import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('j.whitfield@helioncloud.com')
  const [password, setPassword] = useState('••••••••••')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    login('operator')
    navigate('/dashboard')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[color:var(--bg)] px-6 text-[color:var(--text)]">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <span className="text-lg font-bold tracking-tight text-[color:var(--text-h)]">THRESHOLD</span>
        </Link>
        <div className="glass rounded-[28px] p-7">
          <h1 className="text-xl font-bold text-[color:var(--text-h)]">Sign in</h1>
          <p className="mt-1 text-sm text-[color:var(--text-dim)]">Demo build — any credentials sign you into the full-access operator account.</p>
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[color:var(--text-dim)]">Work email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-elev-2)] px-3.5 py-2.5 text-sm text-[color:var(--text-h)] outline-none focus:border-[color:var(--accent)]/50"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[color:var(--text-dim)]">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-elev-2)] px-3.5 py-2.5 text-sm text-[color:var(--text-h)] outline-none focus:border-[color:var(--accent)]/50"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-full bg-[color:var(--ink)] py-2.5 text-sm font-semibold text-white transition-transform duration-150 ease-out active:scale-[0.98]"
            >
              Log in
            </button>
          </form>
        </div>
        <p className="mt-6 text-center text-xs text-[color:var(--text-dim)]">
          <Link to="/" className="hover:text-[color:var(--text)]">&larr; Back to home</Link>
        </p>
      </div>
    </div>
  )
}
