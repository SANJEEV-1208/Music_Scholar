import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const API = import.meta.env.VITE_API_BASE_URL || ''
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('ms_token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) { setLoading(false); return }
    axios.get(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => setUser(data))
      .catch(() => { localStorage.removeItem('ms_token'); setToken(null) })
      .finally(() => setLoading(false))
  }, [])

  function persist(t, u) {
    localStorage.setItem('ms_token', t)
    setToken(t)
    setUser(u)
  }

  async function login(email, password) {
    const { data } = await axios.post(`${API}/api/auth/login`, { email, password })
    persist(data.token, data.user)
    return data.user
  }

  // Creates the account but does NOT log in — caller handles the redirect to login
  async function signUp(email, password) {
    await axios.post(`${API}/api/auth/register`, { email, password })
  }

  function logout() {
    localStorage.removeItem('ms_token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signUp, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
