import { useState } from 'react'
import axios from 'axios'

const API = import.meta.env.VITE_API_BASE_URL || ''

function deduplicateSources(sources) {
  const seen = new Map()
  for (const src of sources) {
    const key = `${src.title}||${src.page ?? 'N/A'}`
    if (!seen.has(key)) {
      seen.set(key, { ...src, chunkIds: [src.chunkId] })
    } else {
      seen.get(key).chunkIds.push(src.chunkId)
    }
  }
  return Array.from(seen.values())
}

export default function SourceCitations({ sources }) {
  const [expanded, setExpanded] = useState(null)
  const [chunkContent, setChunkContent] = useState({})

  if (!sources || sources.length === 0) return null

  const deduplicated = deduplicateSources(sources)

  async function toggleSource(key, chunkId) {
    if (expanded === key) {
      setExpanded(null)
      return
    }
    setExpanded(key)
    if (!chunkContent[chunkId]) {
      try {
        const { data } = await axios.get(`${API}/api/knowledge/chunk/${chunkId}`)
        setChunkContent(prev => ({ ...prev, [chunkId]: data.content }))
      } catch {
        setChunkContent(prev => ({ ...prev, [chunkId]: 'Could not load chunk content.' }))
      }
    }
  }

  return (
    <div className="mt-4 pt-3 border-t border-gray-100 space-y-2">
      <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest flex items-center gap-1.5 mb-2">
        <span>📖</span> Sources · {deduplicated.length}
      </p>
      <div className="flex flex-wrap gap-2">
        {deduplicated.map(src => {
          const key = `${src.title}||${src.page ?? 'N/A'}`
          const isExpanded = expanded === key
          return (
            <div key={key}>
              <button
                onClick={() => toggleSource(key, src.chunkIds[0])}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                  isExpanded
                    ? 'bg-indigo-100 text-indigo-800 border-indigo-200'
                    : 'bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100'
                }`}
              >
                <span>📄</span>
                <span className="truncate max-w-[140px]">{src.title}</span>
                {src.page && <span className="text-indigo-400 font-normal">p.{src.page}</span>}
                {src.chunkIds.length > 1 && (
                  <span className="bg-indigo-200 text-indigo-700 rounded-full px-1.5 text-xs">
                    ×{src.chunkIds.length}
                  </span>
                )}
                <span className="text-indigo-300">{isExpanded ? '▲' : '▼'}</span>
              </button>

              {isExpanded && (
                <div className="mt-2 p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-600 max-w-sm whitespace-pre-wrap leading-relaxed">
                  {chunkContent[src.chunkIds[0]] ?? (
                    <span className="text-gray-400 animate-pulse">Loading…</span>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
