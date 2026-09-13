import {
  fetchServerSentEvents,
  useChat,
  createChatClientOptions,
} from '@tanstack/ai-react'
import type { InferChatMessages, UIMessage } from '@tanstack/ai-react'

const defaultChatOptions = createChatClientOptions({
  connection: fetchServerSentEvents('/api/chat'),
})

export type ChatMessages = InferChatMessages<typeof defaultChatOptions>

export const useAIChat = (options?: {
  sessionId?: string
  initialMessages?: Array<UIMessage>
}) => {
  const chatOptions = createChatClientOptions({
    connection: fetchServerSentEvents('/api/chat'),
    body: options?.sessionId ? { sessionId: options.sessionId } : undefined,
    initialMessages: options?.initialMessages,
  })

  return useChat(chatOptions)
}
