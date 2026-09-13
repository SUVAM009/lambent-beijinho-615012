import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core'

export const chatSessions = pgTable('chat_sessions', {
  id: uuid().primaryKey().defaultRandom(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const chatMessages = pgTable('chat_messages', {
  id: uuid().primaryKey().defaultRandom(),
  sessionId: uuid('session_id')
    .notNull()
    .references(() => chatSessions.id),
  role: text().notNull(),
  content: text().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
