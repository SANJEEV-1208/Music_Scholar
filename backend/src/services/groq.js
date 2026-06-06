import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const SYSTEM_PROMPT = `You are MusicScholar, an expert music education assistant specialising in music theory, harmony, counterpoint, composition, history, and analysis.

RULES:
1. If CONTEXT CHUNKS are provided, base your answer on them and prioritise that information.
2. If the context chunks do not cover the question — or no chunks are provided — answer using your broad music theory knowledge. Never refuse a genuine music question.
3. Do NOT include inline source citations like [Source: ...] in your answer — sources are shown separately in the UI.
4. Structure your answer clearly: start with a direct explanation, then add detail, then give a practical example where possible.
5. Use music terminology correctly and explain technical terms when you first use them.
6. End your answer with 1–2 suggested follow-up questions the student could explore next, formatted as:
   **Want to explore further?**
   - Question 1?
   - Question 2?
7. Do not fabricate specific historical facts, dates, or composer quotes you are not certain about.`

function buildContextBlock(chunks) {
  if (!chunks || chunks.length === 0) {
    return '[No documents in knowledge base matched this query — answer from general music knowledge]'
  }
  return chunks
    .map((chunk, i) => {
      const page = chunk.metadata?.page ?? 'N/A'
      const content = chunk.content.length > 800
        ? chunk.content.slice(0, 800) + '…'
        : chunk.content
      return `[${i + 1}] Source: "${chunk.title}" | Page: ${page}\n${content}`
    })
    .join('\n\n---\n\n')
}

function buildConversationHistory(history) {
  if (!history || history.length === 0) return []
  return history.flatMap(h => [
    { role: 'user', content: h.question },
    { role: 'assistant', content: h.answer },
  ])
}

// Use Groq to rewrite the user's question into a better search query
export async function rewriteQuery(question, history = []) {
  if (history.length === 0) return question

  const recentHistory = history
    .slice(-2)
    .map(h => `Q: ${h.question}\nA: ${h.answer.slice(0, 200)}`)
    .join('\n\n')

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content:
            'You are a search query rewriter. Given a conversation history and a new question, rewrite the question as a standalone, specific search query that captures the full intent including any context from prior messages. Output ONLY the rewritten query — no explanation, no punctuation at the end.',
        },
        {
          role: 'user',
          content: `CONVERSATION HISTORY:\n${recentHistory}\n\nNEW QUESTION: ${question}\n\nRewritten search query:`,
        },
      ],
      temperature: 0.1,
      max_tokens: 100,
    })
    return completion.choices[0]?.message?.content?.trim() || question
  } catch {
    return question
  }
}

export async function generateAnswer(question, retrievedChunks, history = []) {
  const contextBlock = buildContextBlock(retrievedChunks)
  const conversationMessages = buildConversationHistory(history)

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      ...conversationMessages,
      {
        role: 'user',
        content: `CONTEXT:\n${contextBlock}\n\nUSER QUESTION:\n${question}`,
      },
    ],
    temperature: 0.3,
    max_tokens: 1024,
  })

  const answer = completion.choices[0]?.message?.content ?? ''

  const sourcesUsed = retrievedChunks.map(c => ({
    title: c.title,
    source: c.source,
    page: c.metadata?.page ?? null,
    chunkId: c.id,
  }))

  return { answer, sourcesUsed }
}
