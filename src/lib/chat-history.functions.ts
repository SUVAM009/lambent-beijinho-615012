import { createServerFn } from '@tanstack/react-start'
import { eq, asc } from 'drizzle-orm'

import { db } from '../../db/index.js'
import { chatMessages } from '../../db/schema.js'

export const getSessionMessages = createServerFn({ method: 'GET' })
  .inputValidator((data: { sessionId: string }) => data)
  .handler(async ({ data }) => {
    const rows = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, data.sessionId))
      .orderBy(asc(chatMessages.createdAt))

    return rows.map((row) => ({
      id: row.id,
      role: row.role as 'user' | 'assistant',
      content: row.content,
    }))
  })
