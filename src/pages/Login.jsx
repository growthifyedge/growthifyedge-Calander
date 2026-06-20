import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, User, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Field, Input } from '../components/ui/Form'
import { Button } from '../components/ui'

export default function Login() {
  const { status, signIn, signUp, error, setError } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('signin') // signin | signup
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState(null)

  useEffect(() => {
    setError?.(null)
    setNotice(null)
  }, [mode, setError])

  if (status === 'authed') return <Navigate to="/" replace />

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setNotice(null)
    if (mode === 'signin') {
      const ok = await signIn(form.email, form.password)
      if (ok) navigate('/', { replace: true })
    } else {
      const ok = await signUp(form.email, form.password, form.name)
      if (ok) setNotice('Account created. If email confirmation is on, check your inbox — otherwise sign in now.')
      if (ok) setMode('signin')
    }
    setBusy(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-600 text-white shadow-pop">
            <svg viewBox="0 0 32 32" className="h-7 w-7" fill="none">
              <path d="M9 21V11l7 6 7-6v10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="mt-3 text-xl font-extrabold tracking-tight text-fg">GrowthifyEdge OS</h1>
          <p className="text-sm text-muted">{mode === 'signin' ? 'Sign in to your workspace' : 'Create your workspace'}</p>
        </div>

        <form onSubmit={submit} className="card space-y-4 p-6">
          {mode === 'signup' && (
            <Field label="Full name">
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <Input value={form.name} onChange={set('name')} placeholder="Your name" className="pl-9" />
              </div>
            </Field>
          )}
          <Field label="Email">
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <Input type="email" required value={form.email} onChange={set('email')} placeholder="you@agency.com" className="pl-9" autoFocus />
            </div>
          </Field>
          <Field label="Password">
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <Input type="password" required minLength={6} value={form.password} onChange={set('password')} placeholder="••••••••" className="pl-9" />
            </div>
          </Field>

          {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm font-medium text-red-500">{error}</p>}
          {notice && <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-600">{notice}</p>}

          <Button type="submit" disabled={busy} className="w-full">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === 'signin' ? 'Sign in' : 'Create account'}
          </Button>

          <p className="text-center text-sm text-muted">
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <button type="button" onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')} className="font-semibold text-accent-600 hover:underline">
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </form>
      </motion.div>
    </div>
  )
}
