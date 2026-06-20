import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { getDataSource } from '../lib/db'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

// In Supabase mode the app is gated behind email+password auth.
// In local mode (no Supabase keys) a synthetic always-signed-in user is used so
// the app still runs offline with zero setup.
const LOCAL_USER = { id: 'local-user', email: 'you@thisdevice' }

export function AuthProvider({ children }) {
  const mode = getDataSource() // 'supabase' | 'local'
  const isSupabase = mode === 'supabase' && Boolean(supabase)

  const [user, setUser] = useState(isSupabase ? null : LOCAL_USER)
  const [status, setStatus] = useState(isSupabase ? 'loading' : 'authed') // loading | authed | anon
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isSupabase) return
    let alive = true
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return
      setUser(data.session?.user ?? null)
      setStatus(data.session ? 'authed' : 'anon')
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
      setStatus(session ? 'authed' : 'anon')
    })
    return () => {
      alive = false
      sub.subscription.unsubscribe()
    }
  }, [isSupabase])

  const signIn = useCallback(async (email, password) => {
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    return !error
  }, [])

  const signUp = useCallback(async (email, password, fullName) => {
    setError(null)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName || '' } },
    })
    if (error) setError(error.message)
    return error ? false : true
  }, [])

  const signOut = useCallback(async () => {
    if (isSupabase) await supabase.auth.signOut()
  }, [isSupabase])

  const value = {
    mode,
    isSupabase,
    user,
    userId: user?.id ?? null,
    status,
    error,
    setError,
    signIn,
    signUp,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
