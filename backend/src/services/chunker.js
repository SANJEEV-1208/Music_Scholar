const PAGE_BREAK_MARKER = '[PAGE_BREAK]'

function estimateTokens(text) {
  return Math.ceil(text.length / 4)
}

function splitSentences(text) {
  return text.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0)
}

function getPageAtPosition(fullText, position) {
  const before = fullText.slice(0, position)
  return (before.match(/\[PAGE_BREAK\]/g) || []).length + 1
}

function flushChunks(chunks, paragraphs, fullText, paragraphPositions) {
  if (paragraphs.length === 0) return
  const content = paragraphs.join('\n\n').trim()
  if (!content) return
  const pos = paragraphPositions[0] ?? 0
  const page = getPageAtPosition(fullText, pos)
  chunks.push({ content, metadata: { page, chunkIndex: chunks.length } })
}

function accumulateIntoChunks(chunks, units, fullText, unitPositions, maxTokens, overlapTokens) {
  let currentUnits = []
  let currentPositions = []
  let currentTokenCount = 0

  for (let i = 0; i < units.length; i++) {
    const unit = units[i]
    const unitTokens = estimateTokens(unit)

    if (currentTokenCount + unitTokens > maxTokens && currentUnits.length > 0) {
      flushChunks(chunks, currentUnits, fullText, currentPositions)

      // Seed next chunk with overlap: take trailing units that fit within overlapTokens
      const overlapUnits = []
      const overlapPositions = []
      let overlapCount = 0
      for (let j = currentUnits.length - 1; j >= 0; j--) {
        const t = estimateTokens(currentUnits[j])
        if (overlapCount + t > overlapTokens) break
        overlapUnits.unshift(currentUnits[j])
        overlapPositions.unshift(currentPositions[j])
        overlapCount += t
      }
      currentUnits = [...overlapUnits, unit]
      currentPositions = [...overlapPositions, unitPositions[i]]
      currentTokenCount = overlapCount + unitTokens
    } else {
      currentUnits.push(unit)
      currentPositions.push(unitPositions[i])
      currentTokenCount += unitTokens
    }
  }

  flushChunks(chunks, currentUnits, fullText, currentPositions)
}

export function chunkText(rawText, options = {}) {
  const { maxTokens = 500, overlapTokens = 50 } = options

  // Normalize line endings and mark page breaks
  const normalised = rawText
    .replace(/\r\n/g, '\n')
    .replace(/\f/g, `\n\n${PAGE_BREAK_MARKER}\n\n`)
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  const chunks = []
  const paragraphs = normalised.split(/\n{2,}/)

  // Track the character position of each paragraph in normalised text for page detection
  const paragraphPositions = []
  let searchFrom = 0
  for (const p of paragraphs) {
    const idx = normalised.indexOf(p, searchFrom)
    paragraphPositions.push(idx)
    searchFrom = idx + p.length
  }

  const sentences = []
  const sentencePositions = []

  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i]
    if (p === PAGE_BREAK_MARKER) continue

    const pTokens = estimateTokens(p)
    if (pTokens > maxTokens) {
      // Oversized paragraph — split to sentences
      const parts = splitSentences(p)
      let offset = paragraphPositions[i]
      for (const s of parts) {
        sentences.push(s)
        sentencePositions.push(offset)
        offset += s.length + 1
      }
    } else {
      sentences.push(p)
      sentencePositions.push(paragraphPositions[i])
    }
  }

  accumulateIntoChunks(chunks, sentences, normalised, sentencePositions, maxTokens, overlapTokens)
  return chunks
}
