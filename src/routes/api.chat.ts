import { createFileRoute } from '@tanstack/react-router'
import { chat, maxIterations, toServerSentEventsResponse } from '@tanstack/ai'
import { anthropicText } from '@tanstack/ai-anthropic'
import { openaiText } from '@tanstack/ai-openai'
import { geminiText } from '@tanstack/ai-gemini'
import { ollamaText } from '@tanstack/ai-ollama'

import { db } from '../../db/index.js'
import { chatMessages, chatSessions } from '../../db/schema.js'

const SYSTEM_PROMPT = `You are Dr. Aiva, an AI symptom-checker assistant. You help people understand what might be going on with their symptoms and what to do next.

INSTRUCTIONS:
- Ask brief clarifying questions when symptoms are vague (duration, severity, associated symptoms).
- Offer a short list of possible explanations, from most to least likely, in plain language.
- Suggest sensible self-care steps when appropriate.
- Clearly flag red-flag symptoms (e.g. chest pain, difficulty breathing, stroke signs, severe bleeding) and tell the user to seek emergency care immediately if present.
- Always remind the user that you are not a substitute for a licensed medical professional and that they should see a doctor for diagnosis and treatment.
- Keep responses concise, empathetic, and easy to read.
- Never claim certainty about a diagnosis.`

async function persistMessage(sessionId: string, role: string, content: string) {
  if (!content.trim()) return
  await db.insert(chatSessions).values({ id: sessionId }).onConflictDoNothing()
  await db.insert(chatMessages).values({ sessionId, role, content })
}

async function* trackingStream(
  source: AsyncIterable<any>,
  onDone: (fullText: string) => Promise<void>,
) {
  let fullText = ''
  try {
    for await (const chunk of source) {
      if (chunk?.type === 'content' && typeof chunk.delta === 'string') {
        fullText += chunk.delta
      }
      yield chunk
    }
  } finally {
    await onDone(fullText)
  }
}

export const Route = createFileRoute('/api/chat')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const requestSignal = request.signal

        if (requestSignal.aborted) {
          return new Response(null, { status: 499 })
        }

        const abortController = new AbortController()

        try {
          const body = await request.json()
          const { messages } = body
          const data = body.data || {}
          const sessionId: string | undefined = data.sessionId

          // Determine the best available provider
          let provider: 'anthropic' | 'openai' | 'gemini' | 'ollama' =
            data.provider || 'ollama'
          let model: string = data.model || 'mistral:7b'

          // Use the first available provider with an API key, fallback to ollama
          if (process.env.ANTHROPIC_API_KEY) {
            provider = 'anthropic'
            model = 'claude-haiku-4-5'
          } else if (process.env.OPENAI_API_KEY) {
            provider = 'openai'
            model = 'gpt-4o'
          } else if (process.env.GEMINI_API_KEY) {
            provider = 'gemini'
            model = 'gemini-2.5-flash'
          }

          const adapterConfig = {
            anthropic: () =>
              anthropicText((model || 'claude-haiku-4-5') as any),
            openai: () => openaiText((model || 'gpt-4o') as any),
            gemini: () => geminiText((model || 'gemini-2.5-flash') as any),
            ollama: () => ollamaText((model || 'mistral:7b') as any),
          }

          const adapter = adapterConfig[provider]()

          const lastUserMessage = [...messages]
            .reverse()
            .find((message: any) => message.role === 'user')

          if (sessionId && lastUserMessage) {
            const textPart = Array.isArray(lastUserMessage.content)
              ? lastUserMessage.content
                  .filter((part: any) => part.type === 'text')
                  .map((part: any) => part.text)
                  .join('')
              : lastUserMessage.content
            await persistMessage(sessionId, 'user', textPart ?? '')
          }

          const stream = chat({
            adapter,
            systemPrompts: [SYSTEM_PROMPT],
            agentLoopStrategy: maxIterations(5),
            messages,
            abortController,
          })

          const tracked = sessionId
            ? trackingStream(stream, (fullText) =>
                persistMessage(sessionId, 'assistant', fullText),
              )
            : stream

          return toServerSentEventsResponse(tracked, { abortController })
        } catch (error: any) {
          console.error('Chat error:', error)
          if (error.name === 'AbortError' || abortController.signal.aborted) {
            return new Response(null, { status: 499 })
          }
          return new Response(
            JSON.stringify({
              error: 'Failed to process chat request',
              message: error.message,
            }),
            {
              status: 500,
              headers: { 'Content-Type': 'application/json' },
            },
          )
        }
      },
    },
  },
})
