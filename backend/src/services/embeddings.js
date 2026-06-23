import axios from 'axios'
import { pipeline, env } from '@xenova/transformers'

// ── Local model (dev) ────────────────────────────────────────────────────────
env.cacheDir = './models'
let embedder = null

async function getEmbedder() {
  if (!embedder) {
    console.log('Loading local embedding model (first run downloads ~90MB)...')
    embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')
    console.log('Embedding model ready.')
  }
  return embedder
}

async function embedLocal(texts) {
  const model = await getEmbedder()
  const results = []
  for (const text of texts) {
    const output = await model(text, { pooling: 'mean', normalize: true })
    results.push(Array.from(output.data))
  }
  return results
}

// ── HF Inference API (production) ───────────────────────────────────────────
const HF_ENDPOINT =
  'https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2'
const BATCH_SIZE = 32
const BATCH_DELAY_MS = 200

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

async function callHF(inputs, retrying = false) {
  try {
    console.log('Using HF endpoint:', HF_ENDPOINT)
    const { data } = await axios.post(
      HF_ENDPOINT,
      { inputs, options: { wait_for_model: true } },
      { headers: { Authorization: `Bearer ${process.env.HF_API_TOKEN}` }, timeout: 60000 }
    )
    return data
  } catch (err) {
    if (!retrying && err.response?.status === 503) {
      console.log('HF model loading, waiting 20s...')
      await sleep(20000)
      return callHF(inputs, true)
    }
    throw err
  }
}

function normalise(result) {
  if (!Array.isArray(result)) throw new Error('Unexpected HF response shape')
  if (result.length === 0) return []
  if (typeof result[0] === 'number') return [result]
  return result
}

async function embedHF(texts) {
  const allEmbeddings = []
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE)
    const raw = await callHF(batch.length === 1 ? batch[0] : batch)
    allEmbeddings.push(...normalise(raw))
    if (i + BATCH_SIZE < texts.length) await sleep(BATCH_DELAY_MS)
  }
  return allEmbeddings
}

// ── Public API ───────────────────────────────────────────────────────────────
const useHF = false

export async function embedTexts(texts) {
  if (texts.length === 0) return []
  return useHF ? embedHF(texts) : embedLocal(texts)
}

export async function embedSingle(text) {
  const vecs = await embedTexts([text])
  return vecs[0]
}
