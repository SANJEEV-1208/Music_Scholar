import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext.jsx'

const API = import.meta.env.VITE_API_BASE_URL || ''

const TYPE_CONFIG = {
  pdf:        { color: 'bg-blue-100 text-blue-700',    icon: '📄', label: 'PDF',            topBorder: 'border-t-blue-400' },
  sheet_music:{ color: 'bg-purple-100 text-purple-700', icon: '🎵', label: 'Sheet Music',    topBorder: 'border-t-purple-400' },
  audio:      { color: 'bg-rose-100 text-rose-700',    icon: '🎤', label: 'Audio',           topBorder: 'border-t-rose-400' },
  preloaded:  { color: 'bg-emerald-100 text-emerald-700', icon: '📚', label: 'Knowledge Base', topBorder: 'border-t-emerald-400' },
}

const FILTERS = [
  { id: 'all',         label: 'All' },
  { id: 'pdf',         label: '📄 PDF' },
  { id: 'sheet_music', label: '🎵 Sheet Music' },
  { id: 'audio',       label: '🎤 Audio' },
  { id: 'preloaded',   label: '📚 Knowledge Base' },
]

function getConfig(type) {
  return TYPE_CONFIG[type] || { color: 'bg-gray-100 text-gray-600', icon: '📁', label: type, topBorder: 'border-t-gray-300' }
}

function SkeletonCard() {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden animate-pulse">
      <div className="h-1 bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="flex items-start gap-2">
          <div className="w-9 h-9 rounded-xl bg-gray-100" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="h-3 bg-gray-100 rounded w-3/4" />
            <div className="h-3 bg-gray-100 rounded w-1/2" />
          </div>
        </div>
        <div className="flex justify-between">
          <div className="h-5 w-20 bg-gray-100 rounded-full" />
          <div className="h-4 w-16 bg-gray-100 rounded" />
        </div>
      </div>
    </div>
  )
}

export default function TopicBrowser({ documents, setDocuments }) {
  const { token } = useAuth()
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchDocuments()
  }, [filter])

  async function fetchDocuments() {
    setLoading(true)
    try {
      const params = filter !== 'all' ? `?type=${filter}` : ''
      const { data } = await axios.get(`${API}/api/knowledge/documents${params}`, { headers: { Authorization: `Bearer ${token}` } })
      setDocuments(data)
    } catch (err) {
      console.error('Failed to fetch documents:', err)
    } finally {
      setLoading(false)
    }
  }

  async function deleteDocument(id) {
    if (!confirm('Delete this document and all its indexed content?')) return
    try {
      await axios.delete(`${API}/api/knowledge/documents/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      setDocuments(prev => prev.filter(d => d.id !== id))
    } catch {
      alert('Failed to delete document')
    }
  }

  const filtered = documents.filter(d =>
    d.title?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Document Library</h2>
        <p className="text-sm text-gray-500 mt-1">All documents indexed in your knowledge base</p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Search by title…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 border border-gray-200 rounded-xl py-2 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-white shadow-sm w-60"
          />
        </div>
        <div className="flex rounded-xl overflow-hidden border border-gray-200 shadow-sm">
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-2 text-xs font-medium transition-colors border-r border-gray-200 last:border-r-0 ${
                filter === f.id ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button
          onClick={fetchDocuments}
          className="px-3 py-2 text-xs bg-white hover:bg-gray-50 border border-gray-200 rounded-xl text-gray-600 transition-colors shadow-sm"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Document grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 space-y-3">
          <div className="text-6xl">📚</div>
          <p className="font-semibold text-gray-500">No documents found</p>
          <p className="text-sm text-gray-400">Upload a PDF, sheet music, or audio recording to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(doc => {
            const cfg = getConfig(doc.type)
            return (
              <div
                key={doc.id}
                className={`bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 border-t-4 ${cfg.topBorder}`}
              >
                <div className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-lg flex-shrink-0">
                      {cfg.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 text-sm leading-snug line-clamp-2">
                        {doc.title}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteDocument(doc.id)}
                      className="w-6 h-6 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors text-lg leading-none flex-shrink-0"
                      title="Delete document"
                    >
                      ×
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.color}`}>
                      {cfg.label}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(doc.uploaded_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
