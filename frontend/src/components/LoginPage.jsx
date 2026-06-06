import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

function EyeIcon({ open }) {
  return open ? (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  )
}

function PasswordInput({ value, onChange, placeholder, required }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className="w-full px-4 py-3 pr-11 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#67C090] focus:border-transparent transition bg-gray-50 focus:bg-white"
      />
      <button
        type="button"
        onClick={() => setShow(v => !v)}
        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#215B63] transition-colors"
        tabIndex={-1}
      >
        <EyeIcon open={show} />
      </button>
    </div>
  )
}

const FEATURES = [
  { icon: '🎵', text: 'Ask anything about music theory' },
  { icon: '📖', text: 'Backed by a curated knowledge base' },
  { icon: '🤖', text: 'AI-powered answers via Groq' },
  { icon: '💬', text: 'Full conversation history' },
]

const NOTES = [
  { char: '♩', style: 'top-[10%] left-[7%] text-5xl opacity-[0.12] rotate-12' },
  { char: '♪', style: 'top-[26%] right-[9%] text-6xl opacity-[0.10] -rotate-6' },
  { char: '♫', style: 'top-[52%] left-[5%] text-4xl opacity-[0.15] rotate-3' },
  { char: '♬', style: 'bottom-[18%] right-[7%] text-5xl opacity-[0.12] -rotate-12' },
  { char: '𝄞', style: 'bottom-[38%] left-[16%] text-6xl opacity-[0.08] rotate-6' },
  { char: '♩', style: 'top-[68%] right-[16%] text-3xl opacity-[0.15] rotate-12' },
]

export default function LoginPage() {
  const { login, signUp } = useAuth()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (mode === 'register' && password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        await signUp(email, password)
        setSuccess('Account created! Please sign in.')
        setPassword('')
        setConfirmPassword('')
        setMode('login')
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function switchMode(m) {
    setMode(m)
    setError('')
    setSuccess('')
    setPassword('')
    setConfirmPassword('')
  }

  return (
    <div className="min-h-screen flex">

      {/* ── Left branding panel ── */}
      <div
        className="hidden lg:flex lg:w-[52%] relative flex-col justify-between p-12 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #124170 0%, #215B63 50%, #124170 100%)' }}
      >
        {/* Decorative floating notes */}
        {NOTES.map((n, i) => (
          <span key={i} className={`absolute select-none text-white pointer-events-none ${n.style}`}>
            {n.char}
          </span>
        ))}

        {/* Top: logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">🎼</span>
            <span className="text-2xl font-bold text-white tracking-tight">MusicScholar</span>
          </div>
          <p className="text-sm ml-1" style={{ color: '#AAFFC7', opacity: 0.8 }}>Powered by Groq AI</p>
        </div>

        {/* Middle: headline + features */}
        <div className="relative z-10 space-y-7">
          <div>
            <h2 className="text-4xl font-extrabold text-white leading-tight">
              Master music theory<br />with the power of AI
            </h2>
            <p className="mt-4 text-base leading-relaxed max-w-sm" style={{ color: '#AAFFC7', opacity: 0.85 }}>
              Ask questions, explore concepts, and deepen your understanding of harmony, rhythm, and composition.
            </p>
          </div>

          <ul className="space-y-3">
            {FEATURES.map(f => (
              <li key={f.text} className="flex items-center gap-3">
                <span
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                  style={{ backgroundColor: 'rgba(170, 255, 199, 0.15)' }}
                >
                  {f.icon}
                </span>
                <span className="text-sm" style={{ color: '#AAFFC7' }}>{f.text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom */}
        <p className="relative z-10 text-xs" style={{ color: '#AAFFC7', opacity: 0.5 }}>
          © {new Date().getFullYear()} MusicScholar
        </p>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-white">

        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <span className="text-3xl">🎼</span>
          <span className="text-xl font-bold" style={{ color: '#124170' }}>MusicScholar</span>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {mode === 'login'
                ? 'Sign in to continue to MusicScholar'
                : 'Start your music theory journey'}
            </p>
          </div>

          {/* Tab switcher */}
          <div className="flex rounded-xl bg-gray-100 p-1 mb-7">
            {['login', 'register'].map(m => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
                style={mode === m
                  ? { backgroundColor: 'white', color: '#124170', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }
                  : { color: '#6b7280' }
                }
              >
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#67C090] focus:border-transparent transition bg-gray-50 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Password
              </label>
              <PasswordInput
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder={mode === 'register' ? 'At least 6 characters' : '••••••••'}
              />
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Confirm Password
                </label>
                <PasswordInput
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                />
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                <span className="mt-0.5 flex-shrink-0">⚠</span>
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-start gap-2 px-4 py-3 rounded-xl border text-sm"
                style={{ backgroundColor: '#AAFFC7' + '33', borderColor: '#67C090', color: '#215B63' }}>
                <span className="mt-0.5 flex-shrink-0">✓</span>
                <span>{success}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-white rounded-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              style={{ background: loading ? '#67C090' : 'linear-gradient(135deg, #67C090, #215B63)' }}
            >
              {loading
                ? 'Please wait…'
                : mode === 'login'
                ? 'Sign In →'
                : 'Create Account →'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-8">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
              className="font-semibold hover:underline"
              style={{ color: '#124170' }}
            >
              {mode === 'login' ? 'Create one' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
