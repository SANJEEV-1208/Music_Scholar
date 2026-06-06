import express from 'express'
import { pool } from '../services/retrieval.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'

const router = express.Router()

// GET /api/knowledge/documents
router.get('/documents', requireAuth, async (req, res) => {
  const { type, limit = 20, offset = 0 } = req.query
  try {
    const params = [parseInt(limit), parseInt(offset)]
    let query = 'SELECT * FROM documents'
    if (type) {
      query += ' WHERE type = $3'
      params.push(type)
    }
    query += ' ORDER BY uploaded_at DESC LIMIT $1 OFFSET $2'
    const { rows } = await pool.query(query, params)
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/knowledge/documents/:id
router.get('/documents/:id', requireAuth, async (req, res) => {
  try {
    const docResult = await pool.query('SELECT * FROM documents WHERE id = $1', [req.params.id])
    if (docResult.rows.length === 0) return res.status(404).json({ error: 'Not found' })

    const chunkResult = await pool.query(
      'SELECT id, content, metadata FROM chunks WHERE document_id = $1 ORDER BY created_at LIMIT 3',
      [req.params.id]
    )
    res.json({ ...docResult.rows[0], preview: chunkResult.rows })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/knowledge/chunk/:id — fetch a single chunk's content for citation expansion
router.get('/chunk/:id', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT c.id, c.content, c.metadata, d.title, d.source FROM chunks c JOIN documents d ON c.document_id = d.id WHERE c.id = $1',
      [req.params.id]
    )
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' })
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/knowledge/documents/:id
router.delete('/documents/:id', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM documents WHERE id = $1 RETURNING id', [req.params.id])
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' })
    res.json({ deleted: result.rows[0].id })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
