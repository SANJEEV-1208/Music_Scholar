import express from 'express'
import { embedSingle } from '../services/embeddings.js'
import { hybridSearch, pool } from '../services/retrieval.js'
import { generateAnswer, rewriteQuery } from '../services/groq.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

async function getConversationHistory(conversationId, limit = 3) {
  if (!conversationId) return []
  const { rows } = await pool.query(
    `SELECT question, answer FROM chat_history
     WHERE conversation_id = $1
     ORDER BY created_at DESC LIMIT $2`,
    [conversationId, limit]
  )
  return rows.reverse()
}

// POST /api/chat — send a message
router.post('/', requireAuth, async (req, res) => {
  const { question, conversationId } = req.body
  const userId = req.user.id
  if (!question?.trim()) return res.status(400).json({ error: 'question is required' })

  try {
    let convId = conversationId

    if (!convId) {
      const { rows } = await pool.query(
        'INSERT INTO conversations (user_id, title) VALUES ($1, $2) RETURNING id',
        [userId, question.slice(0, 80)]
      )
      convId = rows[0].id
    }

    const history = await getConversationHistory(convId)
    const searchQuery = await rewriteQuery(question, history)
    console.log(`Query rewritten: "${question}" → "${searchQuery}"`)

    const embedding = await embedSingle(searchQuery)
    const chunks = await hybridSearch(embedding, searchQuery, 5)

    const { answer, sourcesUsed } = await generateAnswer(question, chunks, history)

    await pool.query(
      'INSERT INTO chat_history (user_id, conversation_id, question, answer, sources) VALUES ($1, $2, $3, $4, $5)',
      [userId, convId, question, answer, JSON.stringify(sourcesUsed)]
    )

    res.json({ answer, sources: sourcesUsed, conversationId: convId })
  } catch (err) {
    console.error('Chat error:', err)
    res.status(500).json({ error: err.message })
  }
})

// GET /api/chat/conversations/:userId — list conversations (userId ignored, uses JWT)
router.get('/conversations/:userId', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.id, c.title, c.created_at,
         (SELECT COUNT(*) FROM chat_history WHERE conversation_id = c.id)::int AS message_count
       FROM conversations c
       WHERE c.user_id = $1
       ORDER BY c.created_at DESC
       LIMIT 100`,
      [req.user.id]
    )
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/chat/conversations/:id/messages — get all messages in a conversation
router.get('/conversations/:id/messages', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, question, answer, sources, created_at
       FROM chat_history
       WHERE conversation_id = $1
       ORDER BY created_at ASC`,
      [req.params.id]
    )
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/chat/conversations/:id — delete a conversation and its messages
router.delete('/conversations/:id', requireAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM conversations WHERE id = $1', [req.params.id])
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
