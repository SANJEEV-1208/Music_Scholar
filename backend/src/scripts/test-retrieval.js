#!/usr/bin/env node
import dotenv from 'dotenv'
import { embedSingle } from '../services/embeddings.js'
import { hybridSearch } from '../services/retrieval.js'

dotenv.config()

const question = process.argv[2]
if (!question) {
  console.error('Usage: node scripts/test-retrieval.js "Your question here"')
  process.exit(1)
}

console.log(`\nSearching for: "${question}"\n`)

const embedding = await embedSingle(question)
const results = await hybridSearch(embedding, question, 5)

if (results.length === 0) {
  console.log('No results found. Make sure you have ingested documents first.')
  process.exit(0)
}

console.table(
  results.map(r => ({
    title: r.title?.slice(0, 30),
    page: r.metadata?.page ?? 'N/A',
    score: Number(r.combined_score).toFixed(4),
    preview: r.content?.slice(0, 80) + '...',
  }))
)

process.exit(0)
