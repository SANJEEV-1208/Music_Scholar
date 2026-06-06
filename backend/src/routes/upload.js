import express from 'express'
import multer from 'multer'
import pdfParse from 'pdf-parse'
import { v2 as cloudinary } from 'cloudinary'
import { Readable } from 'stream'
import FormData from 'form-data'
import axios from 'axios'
import { chunkText } from '../services/chunker.js'
import { embedTexts } from '../services/embeddings.js'
import { pool } from '../services/retrieval.js'
import { analyzeSheetMusic, sheetMusicToText } from '../services/music21.js'
import { requireAdmin } from '../middleware/auth.js'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  timeout: 300000,
})

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 200 * 1024 * 1024 } })

function handleMulterError(err, req, res, next) {
  if (err?.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File too large. Maximum size is 200MB.' })
  }
  next(err)
}

function uploadToCloudinary(buffer, options) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) reject(error)
      else resolve(result)
    })
    Readable.from(buffer).pipe(stream)
  })
}

async function insertChunks(client, documentId, chunks, embeddings) {
  for (let i = 0; i < chunks.length; i++) {
    const { content, metadata } = chunks[i]
    const vec = '[' + embeddings[i].join(',') + ']'
    await client.query(
      'INSERT INTO chunks (document_id, content, embedding, metadata) VALUES ($1, $2, $3::vector, $4)',
      [documentId, content, vec, JSON.stringify(metadata)]
    )
  }
}

// POST /api/upload/pdf
router.post('/pdf', requireAdmin, (req, res, next) => upload.single('file')(req, res, err => {
  if (err) return handleMulterError(err, req, res, next)
  next()
}), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file provided' })

  try {
    const parsed = await pdfParse(req.file.buffer)
    const chunks = chunkText(parsed.text)

    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      const docResult = await client.query(
        'INSERT INTO documents (title, source, type) VALUES ($1, $2, $3) RETURNING id',
        [req.file.originalname, null, 'pdf']
      )
      const documentId = docResult.rows[0].id

      const embeddings = await embedTexts(chunks.map(c => c.content))
      await insertChunks(client, documentId, chunks, embeddings)

      await client.query('COMMIT')

      // Upload to Cloudinary in background — don't block the response
      const fileBuffer = req.file.buffer
      const filename = req.file.originalname
      uploadToCloudinary(fileBuffer, {
        folder: 'music-documents',
        resource_type: 'raw',
        public_id: `${Date.now()}_${filename}`,
      }).then(result => {
        pool.query('UPDATE documents SET source = $1 WHERE id = $2', [result.secure_url, documentId])
          .catch(e => console.error('Failed to update Cloudinary URL:', e))
      }).catch(e => console.error('Cloudinary upload failed (non-fatal):', e.message))

      res.json({ documentId, chunksCreated: chunks.length, title: req.file.originalname })
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  } catch (err) {
    console.error('PDF upload error:', err)
    res.status(500).json({ error: err.message })
  }
})

// POST /api/upload/sheet-music
router.post('/sheet-music', requireAdmin, (req, res, next) => upload.single('file')(req, res, err => {
  if (err) return handleMulterError(err, req, res, next)
  next()
}), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file provided' })

  try {
    const cloudResult = await uploadToCloudinary(req.file.buffer, {
      folder: 'sheet-music',
      resource_type: 'raw',
      public_id: `${Date.now()}_${req.file.originalname}`,
    })

    const analysis = await analyzeSheetMusic(req.file.buffer, req.file.originalname)
    const analysisText = sheetMusicToText(analysis)
    const chunks = chunkText(analysisText)

    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      const docResult = await client.query(
        'INSERT INTO documents (title, source, type) VALUES ($1, $2, $3) RETURNING id',
        [req.file.originalname, cloudResult.secure_url, 'sheet_music']
      )
      const documentId = docResult.rows[0].id

      const embeddings = await embedTexts(chunks.map(c => c.content))
      await insertChunks(client, documentId, chunks, embeddings)

      await client.query('COMMIT')

      res.json({
        documentId,
        chunksCreated: chunks.length,
        title: req.file.originalname,
        analysis,
        xmlContent: req.file.buffer.toString('utf8'),
      })
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  } catch (err) {
    console.error('Sheet music upload error:', err)
    res.status(500).json({ error: err.message })
  }
})

// POST /api/upload/audio
router.post('/audio', (req, res, next) => upload.single('file')(req, res, err => {
  if (err) return handleMulterError(err, req, res, next)
  next()
}), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file provided' })

  try {
    // Forward to Flask for audio analysis
    const form = new FormData()
    form.append('file', req.file.buffer, { filename: req.file.originalname })

    const { data: analysis } = await axios.post(
      `${process.env.MUSIC21_SERVICE_URL}/analyze-audio`,
      form,
      { headers: form.getHeaders(), timeout: 180000 }
    )

    // Convert analysis to text for embedding
    const analysisText = audioAnalysisToText(analysis, req.file.originalname)
    const chunks = chunkText(analysisText)

    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      const docResult = await client.query(
        'INSERT INTO documents (title, source, type) VALUES ($1, $2, $3) RETURNING id',
        [req.file.originalname, null, 'audio']
      )
      const documentId = docResult.rows[0].id

      const embeddings = await embedTexts(chunks.map(c => c.content))
      await insertChunks(client, documentId, chunks, embeddings)

      await client.query('COMMIT')

      // Upload to Cloudinary in background
      uploadToCloudinary(req.file.buffer, {
        folder: 'audio-recordings',
        resource_type: 'video', // Cloudinary uses 'video' type for audio files
        public_id: `${Date.now()}_${req.file.originalname}`,
      }).then(result => {
        pool.query('UPDATE documents SET source = $1 WHERE id = $2', [result.secure_url, documentId])
          .catch(e => console.error('Cloudinary audio upload failed:', e.message))
      }).catch(e => console.error('Cloudinary audio upload failed (non-fatal):', e.message))

      res.json({
        documentId,
        chunksCreated: chunks.length,
        title: req.file.originalname,
        analysis,
      })
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  } catch (err) {
    console.error('Audio upload error:', err)
    res.status(500).json({ error: err.message })
  }
})

function audioAnalysisToText(analysis, filename) {
  const {
    detectedKey = 'Unknown',
    tempo = 'Unknown',
    duration = 'Unknown',
    chordProgression = [],
    noteSequence = [],
    theoryTopics = [],
    beatCount = 0,
  } = analysis

  const songName = filename.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ')
  const chordsStr = chordProgression.length > 0 ? chordProgression.slice(0, 16).join(', ') : 'not detected'
  const notesStr = noteSequence.length > 0 ? noteSequence.slice(0, 30).join(' ') : 'not detected'
  const uniqueChords = [...new Set(chordProgression)].join(', ')

  return [
    `Audio recording analysis for "${songName}" (file: ${filename}).`,

    `Key and tonality: This audio recording "${songName}" is in the key of ${detectedKey}. ` +
    `The song "${songName}" has a detected key signature of ${detectedKey}.`,

    `Tempo and rhythm: The song "${songName}" has a tempo of ${tempo} BPM with ${beatCount} beats detected. ` +
    `Duration is ${duration}. The rhythm of "${songName}" is approximately ${tempo} beats per minute.`,

    `Chord progression: The chords detected in "${songName}" are: ${chordsStr}. ` +
    `The unique chords used in this audio are: ${uniqueChords}. ` +
    `The chord progression of the uploaded audio "${songName}" moves through these harmonies: ${chordsStr}.`,

    `Melody and notes: The melody notes detected in "${songName}" are: ${notesStr}. ` +
    `The note sequence of this audio recording includes: ${notesStr}.`,

    `Music theory topics relevant to "${songName}": ${theoryTopics.join(', ')}. ` +
    `To understand this song better, study: ${theoryTopics.join(', ')}.`,
  ].join('\n\n')
}

export default router
