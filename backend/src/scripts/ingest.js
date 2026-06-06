#!/usr/bin/env node
import { readdir, readFile } from 'fs/promises'
import { join, extname } from 'path'
import { parseArgs } from 'util'
import dotenv from 'dotenv'
import pdfParse from 'pdf-parse'
import { chunkText } from '../services/chunker.js'
import { embedTexts } from '../services/embeddings.js'
import { pool } from '../services/retrieval.js'

dotenv.config()

const { values } = parseArgs({
  options: {
    dir: { type: 'string', default: './knowledge-base' },
    type: { type: 'string', default: 'preloaded' },
  },
})

async function ingestPDF(filePath, filename, type) {
  const buffer = await readFile(filePath)
  const parsed = await pdfParse(buffer)
  const chunks = chunkText(parsed.text)

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const docResult = await client.query(
      'INSERT INTO documents (title, source, type) VALUES ($1, $2, $3) RETURNING id',
      [filename, filePath, type]
    )
    const documentId = docResult.rows[0].id

    const BATCH = 32
    for (let i = 0; i < chunks.length; i += BATCH) {
      const batch = chunks.slice(i, i + BATCH)
      const embeddings = await embedTexts(batch.map(c => c.content))
      for (let j = 0; j < batch.length; j++) {
        const vec = '[' + embeddings[j].join(',') + ']'
        await client.query(
          'INSERT INTO chunks (document_id, content, embedding, metadata) VALUES ($1, $2, $3::vector, $4)',
          [documentId, batch[j].content, vec, JSON.stringify(batch[j].metadata)]
        )
      }
    }

    await client.query('COMMIT')
    console.log(`Ingested: ${filename} → ${chunks.length} chunks`)
    return chunks.length
  } catch (err) {
    await client.query('ROLLBACK')
    console.error(`Failed to ingest ${filename}:`, err.message)
    return 0
  } finally {
    client.release()
  }
}

async function main() {
  const dir = values.dir
  const type = values.type
  console.log(`Ingesting PDFs from: ${dir} as type="${type}"`)

  let files
  try {
    files = await readdir(dir)
  } catch {
    console.error(`Directory not found: ${dir}`)
    process.exit(1)
  }

  const pdfs = files.filter(f => extname(f).toLowerCase() === '.pdf')
  if (pdfs.length === 0) {
    console.log('No PDF files found.')
    process.exit(0)
  }

  let totalDocs = 0
  let totalChunks = 0
  for (const pdf of pdfs) {
    const n = await ingestPDF(join(dir, pdf), pdf, type)
    totalDocs++
    totalChunks += n
  }

  console.log(`\nDone. ${totalDocs} documents, ${totalChunks} total chunks.`)
  process.exit(0)
}

main()
