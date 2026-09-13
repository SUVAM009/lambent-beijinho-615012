import { useEffect, useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Send, Square, Stethoscope, Plus } from 'lucide-react'
import { Streamdown } from 'streamdown'

import { useAIChat } from '@/lib/ai-hook'
import type { ChatMessages } from '@/lib/ai-hook'
import { getSessionMessages } from '@/lib/chat-history.functions'

const SESSION_STORAGE_KEY = 'ai-doctor-session-id'

function getOrCreateSessionId() {
  if (typeof window === 'undefined') return undefined
  const existing = window.localStorage.getItem(SESSION_STORAGE_KEY)
  if (existing) return existing
  const created = crypto.randomUUID()
  window.localStorage.setItem(SESSION_STORAGE_KEY, created)
  return created
}

function Messages({ messages }: { messages: ChatMessages }) {
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight
    }
  }, [messages])

  if (!messages.length) {
    return null
  }

  return (
    <div
      ref={messagesContainerRef}
      className="flex-1 overflow-y-auto pb-4 min-h-0"
    >
      <div className="max-w-3xl mx-auto w-full px-4">
        {messages.map((message) => (
          <div key={message.id} className="p-4 border-b">
            <div className="flex items-start gap-4 max-w-3xl mx-auto w-full">
              <div
                className={`w-8 h-8 rounded-lg border flex items-center justify-center text-sm font-medium flex-shrink-0 ${
                  message.role === 'assistant'
                    ? 'bg-teal-50 border-teal-200 text-teal-700'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                {message.role === 'assistant' ? (
                  <Stethoscope className="w-4 h-4" />
                ) : (
                  'You'
                )}
              </div>
              <div className="flex-1 min-w-0">
                {message.parts.map((part, index) => {
                  if (part.type === 'text' && part.content) {
                    return (
                      <div
                        className="flex-1 min-w-0 prose max-w-none prose-sm"
                        key={index}
                      >
                        <Streamdown>{part.content}</Streamdown>
                      </div>
                    )
                  }
                  return null
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Home() {
  const [input, setInput] = useState('')
  const [sessionId, setSessionId] = useState<string | undefined>(undefined)
  const [initialMessages, setInitialMessages] = useState<
    ChatMessages | undefined
  >(undefined)
  const [historyLoaded, setHistoryLoaded] = useState(false)

  useEffect(() => {
    const id = getOrCreateSessionId()
    if (!id) return
    getSessionMessages({ data: { sessionId: id } })
      .then((rows) => {
        setInitialMessages(
          rows.map((row) => ({
            id: row.id,
            role: row.role,
            parts: [{ type: 'text', content: row.content }],
          })) as ChatMessages,
        )
      })
      .catch(() => setInitialMessages([]))
      .finally(() => {
        setSessionId(id)
        setHistoryLoaded(true)
      })
  }, [])

  const { messages, sendMessage, isLoading, stop, setMessages } = useAIChat({
    sessionId,
    initialMessages,
  })

  function startNewConversation() {
    const id = crypto.randomUUID()
    window.localStorage.setItem(SESSION_STORAGE_KEY, id)
    setSessionId(id)
    setMessages([])
  }

  return (
    <div className="relative flex h-[calc(100vh-80px)]">
      <div className="flex-1 flex flex-col min-h-0">
        <div className="border-b px-4 py-3 flex items-center justify-between max-w-3xl mx-auto w-full">
          <div className="flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-teal-600" />
            <span className="font-semibold">AI Doctor</span>
          </div>
          <button
            onClick={startNewConversation}
            disabled={!historyLoaded}
            className="flex items-center gap-1 text-sm px-3 py-1.5 border rounded-lg disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            New conversation
          </button>
        </div>

        {messages.length === 0 && (
          <div className="flex-1 flex items-center justify-center px-4">
            <div className="text-center max-w-3xl mx-auto w-full">
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center">
                  <Stethoscope className="w-7 h-7 text-teal-600" />
                </div>
              </div>
              <h1 className="text-4xl font-bold mb-4">AI Doctor</h1>
              <p className="mb-2">
                Describe your symptoms and get guidance on possible causes,
                self-care, and when to seek care.
              </p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                This is not a substitute for professional medical advice,
                diagnosis, or treatment. Always consult a qualified healthcare
                provider. If you are experiencing a medical emergency, call
                your local emergency number immediately.
              </p>
            </div>
          </div>
        )}
        <Messages messages={messages} />

        <div className="sticky bottom-0 left-0 right-0 border-t z-10">
          <div className="max-w-3xl mx-auto w-full px-4 py-3">
            {isLoading && (
              <div className="flex items-center justify-center mb-3">
                <button
                  onClick={stop}
                  className="px-4 py-2 border rounded-lg text-sm font-medium flex items-center gap-2"
                >
                  <Square className="w-4 h-4 fill-current" />
                  Stop
                </button>
              </div>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (input.trim() && historyLoaded) {
                  sendMessage(input)
                  setInput('')
                }
              }}
            >
              <div className="relative max-w-xl mx-auto flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Describe your symptoms..."
                  className="w-full rounded-lg border px-4 py-3 text-sm focus:outline-none"
                  disabled={isLoading || !historyLoaded}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading || !historyLoaded}
                  className="p-3 border rounded-lg disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
            <p className="text-center text-[11px] text-slate-400 mt-2">
              AI Doctor can make mistakes. Not medical advice — consult a
              professional.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/')({
  component: Home,
})
