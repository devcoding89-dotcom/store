import { type FormEvent, useState } from 'react'
import { ArrowLeft, LockKeyhole } from 'lucide-react'
import { useNavigate } from 'react-router'
import { AdminPortal } from '@/sections/AdminPortal'
import { clearAdminSession, getAdminSessionToken, loginAdmin } from '@/lib/api'

export function AdminPage() {
  const navigate = useNavigate()
  const [signedIn, setSignedIn] = useState(() => Boolean(getAdminSessionToken()))
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await loginAdmin(password)
      setPassword('')
      setSignedIn(true)
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Admin sign-in failed.')
    } finally {
      setSubmitting(false)
    }
  }

  const leaveAdmin = () => {
    clearAdminSession()
    setSignedIn(false)
    navigate('/marketplace', { replace: true })
  }

  if (signedIn) {
    return (
      <main className="min-h-screen bg-white">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-slate-900 px-4 py-3 text-white shadow-sm">
          <h1 className="font-display text-lg font-semibold">TownSquare Admin</h1>
          <button onClick={leaveAdmin} className="text-sm font-medium text-slate-300 transition-colors hover:text-white">
            Sign out
          </button>
        </div>
        <AdminPortal onBackToShop={leaveAdmin} />
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8faf8] px-4 py-10 text-slate-950">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-900/5 sm:p-9">
        <a href="/marketplace" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-emerald-800">
          <ArrowLeft size={16} /> Back to marketplace
        </a>
        <div className="mt-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
          <LockKeyhole size={22} />
        </div>
        <p className="mt-6 text-xs font-extrabold uppercase tracking-[0.2em] text-emerald-700">Private access</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight">Admin sign in</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">Enter the admin password to manage TownSquare orders and products.</p>

        <form onSubmit={handleLogin} className="mt-7 space-y-4">
          <label htmlFor="admin-password" className="block text-sm font-bold text-slate-700">Admin password</label>
          <input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
          />
          {error && <p role="alert" className="text-sm font-semibold text-red-700">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-emerald-700 px-4 py-3 font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Checking…' : 'Sign in to Admin'}
          </button>
        </form>
      </section>
    </main>
  )
}
