import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

export default function AuthScreen() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)

  const isSignup = mode === 'signup'

  async function onSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      if (isSignup) {
        const { needsConfirmation } = await signUp(email.trim(), password)
        if (needsConfirmation) {
          setNotice('Check your email to confirm your account, then sign in.')
          setMode('signin')
        }
      } else {
        await signIn(email.trim(), password)
      }
    } catch (err) {
      setError(err.message ?? String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-[30px]">
      <div className="text-[13px] font-semibold uppercase tracking-[0.2em]">TrackIt</div>

      <div className="flex flex-col gap-[10px]">
        <div className="text-[13px] uppercase tracking-[0.14em] text-neutral-600">
          {isSignup ? 'New account' : 'Welcome back'}
        </div>
        <h1 className="text-[46px] font-semibold leading-[1.02] tracking-[-0.01em]">
          {isSignup ? 'Create account' : 'Sign in'}
        </h1>
        <div className="text-[17px] text-neutral-700">
          Your sessions sync so every lift picks up where you left it.
        </div>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-[20px]">
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            required
            minLength={6}
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error ? <div className="text-[14px] text-magenta-700">{error}</div> : null}
        {notice ? <div className="text-[14px] text-accent-700">{notice}</div> : null}

        <button
          type="submit"
          disabled={busy}
          className="bg-accent text-white text-[20px] font-semibold tracking-[0.02em] rounded-[2px] min-h-[56px] flex items-center justify-center hover:bg-accent-600 active:bg-accent-700 disabled:opacity-50"
        >
          {busy ? 'Working…' : isSignup ? 'Create account' : 'Begin'}
        </button>
      </form>

      <button
        type="button"
        onClick={() => {
          setMode(isSignup ? 'signin' : 'signup')
          setError(null)
          setNotice(null)
        }}
        className="text-[13px] uppercase tracking-[0.12em] text-accent-700 min-h-[44px] flex items-center self-start hover:text-accent-600"
      >
        {isSignup ? 'Have an account? Sign in' : 'New here? Create an account'}
      </button>
    </div>
  )
}
