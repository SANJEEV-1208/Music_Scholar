import { useState, useRef, useEffect } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import LoginPage from './components/LoginPage.jsx'
import ChatInterface from './components/ChatInterface.jsx'
import FileUpload from './components/FileUpload.jsx'
import SheetMusicViewer from './components/SheetMusicViewer.jsx'
import TopicBrowser from './components/TopicBrowser.jsx'
import AudioAnalysis from './components/AudioAnalysis.jsx'

const ALL_TABS = [
  { id: 'chat',       label: 'Chat',        icon: '💬', adminOnly: false },
  { id: 'upload',     label: 'Upload',      icon: '📤', adminOnly: true  },
  { id: 'browse',     label: 'Library',     icon: '📚', adminOnly: true  },
  { id: 'sheetmusic', label: 'Sheet Music', icon: '🎵', adminOnly: true  },
  { id: 'audio',      label: 'Audio',       icon: '🎤', adminOnly: true  },
]

function ProfileMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleLogout() {
    setOpen(false)
    if (window.confirm('Are you sure you want to sign out?')) {
      onLogout()
    }
  }

  const initials = user.email.slice(0, 2).toUpperCase()

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm hover:shadow-md transition-shadow select-none"
        style={{ background: 'linear-gradient(135deg, #67C090, #215B63)' }}
        title={user.email}
      >
        {initials}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-54 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50" style={{ minWidth: '210px' }}>
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-800 truncate">{user.email}</p>
            <span
              className="inline-block mt-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full"
              style={user.role === 'admin'
                ? { backgroundColor: '#AAFFC7', color: '#124170' }
                : { backgroundColor: '#f3f4f6', color: '#6b7280' }
              }
            >
              {user.role === 'admin' ? 'Admin' : 'Member'}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}

function AppShell() {
  const { user, logout, loading } = useAuth()
  const [activeTab, setActiveTab] = useState('chat')
  const [selectedMusicXML, setSelectedMusicXML] = useState(null)
  const [musicAnalysis, setMusicAnalysis] = useState(null)
  const [audioAnalysis, setAudioAnalysis] = useState(null)
  const [audioTitle, setAudioTitle] = useState(null)
  const [documents, setDocuments] = useState([])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#67C090', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  if (!user) return <LoginPage />

  const isAdmin = user.role === 'admin'
  const tabs = ALL_TABS.filter(t => !t.adminOnly || isAdmin)
  const visibleTabIds = tabs.map(t => t.id)
  const safeTab = visibleTabIds.includes(activeTab) ? activeTab : 'chat'

  function handleMusicUploaded(analysis, xmlContent) {
    setMusicAnalysis(analysis)
    setSelectedMusicXML(xmlContent)
    setActiveTab('sheetmusic')
  }

  function handleAudioUploaded(analysis, title) {
    setAudioAnalysis(analysis)
    setAudioTitle(title)
    setActiveTab('audio')
  }

  function handleDocumentAdded(doc) {
    setDocuments(prev => [doc, ...prev])
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
        <div className="px-4 flex items-center justify-between h-14">
          {/* Logo */}
          <span className="text-lg font-bold tracking-tight flex items-center gap-2 flex-shrink-0" style={{ color: '#124170' }}>
            🎼 <span>MusicScholar</span>
          </span>

          {/* Tabs */}
          <div className="flex h-full">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="relative flex items-center gap-1.5 px-4 text-sm font-medium transition-colors h-full"
                style={safeTab === tab.id
                  ? { color: '#124170' }
                  : { color: '#6b7280' }
                }
                onMouseEnter={e => { if (safeTab !== tab.id) e.currentTarget.style.color = '#215B63' }}
                onMouseLeave={e => { if (safeTab !== tab.id) e.currentTarget.style.color = '#6b7280' }}
              >
                <span className="text-base leading-none">{tab.icon}</span>
                <span>{tab.label}</span>
                {safeTab === tab.id && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t"
                    style={{ backgroundColor: '#67C090' }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Profile */}
          <ProfileMenu user={user} onLogout={logout} />
        </div>
      </nav>

      {/* Content */}
      {safeTab === 'chat' ? (
        <div className="flex-1 min-h-0 overflow-hidden">
          <ChatInterface />
        </div>
      ) : (
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-4 py-6">
            {safeTab === 'upload' && (
              <FileUpload
                onMusicUploaded={handleMusicUploaded}
                onAudioUploaded={handleAudioUploaded}
                onDocumentAdded={handleDocumentAdded}
              />
            )}
            {safeTab === 'browse' && (
              <TopicBrowser documents={documents} setDocuments={setDocuments} />
            )}
            {safeTab === 'sheetmusic' && (
              <SheetMusicViewer xmlContent={selectedMusicXML} analysis={musicAnalysis} />
            )}
            {safeTab === 'audio' && (
              <AudioAnalysis analysis={audioAnalysis} title={audioTitle} />
            )}
          </div>
        </main>
      )}
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  )
}
