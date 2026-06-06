import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import SourceCitations from './SourceCitations.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const API = import.meta.env.VITE_API_BASE_URL || ''

function groupByDate(convs) {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterdayStart = new Date(todayStart.getTime() - 86400000)
  const weekStart = new Date(todayStart.getTime() - 7 * 86400000)

  const buckets = { Today: [], Yesterday: [], 'Previous 7 Days': [], Older: [] }
  for (const c of convs) {
    const d = new Date(c.created_at)
    if (d >= todayStart) buckets.Today.push(c)
    else if (d >= yesterdayStart) buckets.Yesterday.push(c)
    else if (d >= weekStart) buckets['Previous 7 Days'].push(c)
    else buckets.Older.push(c)
  }
  return Object.entries(buckets).filter(([, items]) => items.length > 0)
}

function rowsToMessages(rows) {
  const msgs = []
  for (const row of rows) {
    msgs.push({ role: 'user', content: row.question })
    const sources = Array.isArray(row.sources)
      ? row.sources
      : typeof row.sources === 'string'
      ? JSON.parse(row.sources)
      : []
    msgs.push({ role: 'assistant', content: row.answer, sources })
  }
  return msgs
}

// ── Avatars ──────────────────────────────────────────────────────

function BotAvatar() {
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 shadow-sm select-none"
      style={{ background: 'linear-gradient(135deg, #67C090, #215B63)' }}
    >
      🎼
    </div>
  )
}

function UserAvatar() {
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm select-none"
      style={{ background: 'linear-gradient(135deg, #124170, #215B63)' }}
    >
      U
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex items-start gap-3">
      <BotAvatar />
      <div className="rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm flex items-center gap-1.5" style={{ backgroundColor: '#AAFFC7' + '25' }}>
        <div className="typing-dot w-2 h-2 rounded-full" style={{ backgroundColor: '#67C090' }} />
        <div className="typing-dot w-2 h-2 rounded-full" style={{ backgroundColor: '#67C090', animationDelay: '0.2s' }} />
        <div className="typing-dot w-2 h-2 rounded-full" style={{ backgroundColor: '#67C090', animationDelay: '0.4s' }} />
      </div>
    </div>
  )
}

// ── Welcome screen ────────────────────────────────────────────────

const SUGGESTIONS = [
  'What is the circle of fifths?',
  'Explain major vs minor scales',
  'How does a ii–V–I progression work?',
  'What is a tritone substitution?',
  'What is sonata form?',
  'Explain voice leading rules',
]

function WelcomeScreen({ onSuggest }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6 py-10">
      <div className="text-5xl mb-4">🎼</div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">How can I help you today?</h2>
      <p className="text-sm text-gray-500 mb-8 max-w-sm">
        Ask anything about music theory, or upload documents from the Upload tab to chat with your own materials.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-xl">
        {SUGGESTIONS.map(s => (
          <button
            key={s}
            onClick={() => onSuggest(s)}
            className="text-left px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-600 transition-all shadow-sm"
            style={{}}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#AAFFC7' + '33'; e.currentTarget.style.borderColor = '#67C090' }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.borderColor = '#e5e7eb' }}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────

export default function ChatInterface() {
  const { user, token } = useAuth()
  const [conversations, setConversations] = useState([])
  const [activeConvId, setActiveConvId] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [convLoading, setConvLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const bottomRef = useRef(null)
  const activeConvIdRef = useRef(null)

  const authHeader = { Authorization: `Bearer ${token}` }

  useEffect(() => { activeConvIdRef.current = activeConvId }, [activeConvId])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, isLoading])

  // Load conversations on mount, auto-select the most recent one
  useEffect(() => {
    async function init() {
      const convs = await fetchConversations()
      if (convs.length > 0) {
        await loadMessages(convs[0].id)
      }
    }
    init()
  }, [])

  async function fetchConversations() {
    try {
      const { data } = await axios.get(`${API}/api/chat/conversations/${user.id}`, { headers: authHeader })
      setConversations(data)
      return data
    } catch {
      return []
    }
  }

  async function loadMessages(id) {
    setConvLoading(true)
    setMessages([])
    setActiveConvId(id)
    setSidebarOpen(false)
    try {
      const { data } = await axios.get(`${API}/api/chat/conversations/${id}/messages`, { headers: authHeader })
      setMessages(rowsToMessages(data))
    } catch {
      setMessages([])
    } finally {
      setConvLoading(false)
    }
  }

  function startNewChat() {
    setActiveConvId(null)
    setMessages([])
    setInput('')
    setSidebarOpen(false)
  }

  async function deleteConversation(e, id) {
    e.stopPropagation()
    if (!confirm('Delete this conversation?')) return
    try {
      await axios.delete(`${API}/api/chat/conversations/${id}`, { headers: authHeader })
      setConversations(prev => prev.filter(c => c.id !== id))
      if (activeConvIdRef.current === id) {
        setActiveConvId(null)
        setMessages([])
      }
    } catch {
      alert('Failed to delete conversation')
    }
  }

  async function sendMessage(questionOverride) {
    const question = (questionOverride ?? input).trim()
    if (!question || isLoading) return

    setMessages(prev => [...prev, { role: 'user', content: question }])
    setInput('')
    setIsLoading(true)

    const currentConvId = activeConvIdRef.current

    try {
      const { data } = await axios.post(`${API}/api/chat`, {
        question,
        conversationId: currentConvId,
      }, { headers: authHeader })

      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: data.answer, sources: data.sources || [] },
      ])

      // New conversation was just created — add it to the sidebar
      if (!currentConvId && data.conversationId) {
        setActiveConvId(data.conversationId)
        setConversations(prev => [
          {
            id: data.conversationId,
            title: question.slice(0, 80),
            created_at: new Date().toISOString(),
            message_count: 1,
          },
          ...prev,
        ])
      }
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Sorry, something went wrong. Please try again.', sources: [] },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const dateGroups = groupByDate(conversations)
  const activeTitle = conversations.find(c => c.id === activeConvId)?.title

  return (
    <div className="flex h-full bg-white border-t border-gray-100">

      {/* ── Sidebar ── */}
      <aside
        className={`${sidebarOpen ? 'flex' : 'hidden'} md:flex w-64 flex-shrink-0 flex-col text-white absolute md:relative inset-y-0 left-0 z-30 h-full`}
        style={{ backgroundColor: '#124170' }}
      >
        {/* New chat button */}
        <div className="p-3 border-b border-white/10">
          <button
            onClick={startNewChat}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-white text-sm font-semibold transition-colors"
            style={{ backgroundColor: '#67C090' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#215B63'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#67C090'}
          >
            <span className="text-base leading-none">✏</span>
            New Chat
          </button>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
          {conversations.length === 0 ? (
            <p className="text-xs text-center mt-8 px-3" style={{ color: '#AAFFC7', opacity: 0.5 }}>
              No conversations yet. Start chatting!
            </p>
          ) : (
            dateGroups.map(([label, items]) => (
              <div key={label}>
                <p className="text-xs font-semibold uppercase tracking-wider px-2 mb-1" style={{ color: '#AAFFC7', opacity: 0.55 }}>
                  {label}
                </p>
                {items.map(conv => (
                  <button
                    key={conv.id}
                    onClick={() => loadMessages(conv.id)}
                    className="group w-full flex items-center justify-between gap-1 px-3 py-2 rounded-lg text-left text-sm transition-colors"
                    style={activeConvId === conv.id
                      ? { backgroundColor: '#215B63', color: 'white' }
                      : { color: '#AAFFC7', opacity: 0.85 }
                    }
                    onMouseEnter={e => { if (activeConvId !== conv.id) { e.currentTarget.style.backgroundColor = 'rgba(33,91,99,0.5)'; e.currentTarget.style.opacity = '1' } }}
                    onMouseLeave={e => { if (activeConvId !== conv.id) { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.opacity = '0.85' } }}
                  >
                    <span className="truncate flex-1 text-xs leading-relaxed">{conv.title}</span>
                    <span
                      onClick={e => deleteConversation(e, conv.id)}
                      className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-all text-lg leading-none flex-shrink-0"
                      title="Delete"
                    >
                      ×
                    </span>
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-20"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Chat area ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-100 bg-white flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(v => !v)}
            className="md:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          >
            ☰
          </button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs shadow-sm flex-shrink-0" style={{ background: 'linear-gradient(135deg, #67C090, #215B63)' }}>
              🎼
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">
                {activeConvId ? (activeTitle || 'Conversation') : 'New Conversation'}
              </p>
              <p className="text-xs text-gray-400">MusicScholar · Powered by Groq</p>
            </div>
          </div>
          {activeConvId && (
            <button
              onClick={startNewChat}
              className="hidden md:flex items-center gap-1 text-xs text-gray-400 transition-colors px-2 py-1 rounded-lg"
            onMouseEnter={e => { e.currentTarget.style.color = '#124170'; e.currentTarget.style.backgroundColor = '#AAFFC7' + '33' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.backgroundColor = '' }}
            >
              ✏ New Chat
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-7">
          {convLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#67C090', borderTopColor: 'transparent' }} />
            </div>
          ) : messages.length === 0 ? (
            <WelcomeScreen onSuggest={q => sendMessage(q)} />
          ) : (
            messages.map((msg, i) => (
              <div key={i} className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                {msg.role === 'assistant' ? <BotAvatar /> : <UserAvatar />}

                {msg.role === 'user' ? (
                  <div
                    className="max-w-[75%] text-white rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm text-sm leading-relaxed"
                    style={{ background: 'linear-gradient(135deg, #124170, #215B63)' }}
                  >
                    {msg.content}
                  </div>
                ) : (
                  <div className="flex-1 min-w-0 rounded-2xl rounded-tl-sm px-6 py-5 shadow-sm" style={{ backgroundColor: '#AAFFC7' + '22' }}>
                    <div className={`
                      prose prose-base max-w-none
                      prose-headings:font-bold prose-headings:text-gray-900 prose-headings:mt-5 prose-headings:mb-3
                      prose-h1:text-xl prose-h2:text-lg prose-h3:text-base
                      prose-p:text-gray-700 prose-p:leading-[1.8] prose-p:my-3
                      prose-strong:text-gray-900 prose-strong:font-semibold
                      prose-em:text-gray-600 prose-em:italic
                      prose-ul:my-3 prose-ul:text-gray-700 prose-ul:space-y-1
                      prose-ol:my-3 prose-ol:text-gray-700 prose-ol:space-y-1
                      prose-li:my-1 prose-li:text-gray-700 prose-li:leading-relaxed
                      prose-code:text-[#215B63] prose-code:bg-[#AAFFC7]/40 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
                      prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:rounded-xl prose-pre:text-sm prose-pre:leading-relaxed prose-pre:p-4
                      prose-blockquote:border-l-4 prose-blockquote:border-[#67C090] prose-blockquote:text-gray-600 prose-blockquote:not-italic prose-blockquote:bg-[#AAFFC7]/20 prose-blockquote:rounded-r-lg prose-blockquote:py-1
                      prose-hr:border-gray-200 prose-hr:my-4
                    `}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                    </div>
                    {msg.sources?.length > 0 && <SourceCitations sources={msg.sources} />}
                  </div>
                )}
              </div>
            ))
          )}
          {isLoading && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div className="border-t border-gray-100 bg-gray-50/80 px-4 py-3 flex-shrink-0">
          <div className="flex gap-2 items-end">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a music theory question…"
              rows={2}
              className="flex-1 resize-none rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm focus:outline-none shadow-sm"
              onFocus={e => { e.currentTarget.style.boxShadow = '0 0 0 2px #67C09066'; e.currentTarget.style.borderColor = '#67C090' }}
              onBlur={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.borderColor = '#e5e7eb' }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={isLoading || !input.trim()}
              className="px-4 py-2.5 text-white rounded-xl text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
              style={{ background: 'linear-gradient(135deg, #67C090, #215B63)' }}
              onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.background = 'linear-gradient(135deg, #215B63, #124170)' }}
              onMouseLeave={e => e.currentTarget.style.background = 'linear-gradient(135deg, #67C090, #215B63)'}
            >
              Send →
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1.5 ml-1">Enter to send · Shift+Enter for newline</p>
        </div>

      </div>
    </div>
  )
}
