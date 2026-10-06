import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import type { Session } from '@supabase/supabase-js'
import Landing from './pages/Landing'
import Home from './pages/Home'
import { PublicInfo } from './pages/PublicInfo'
import { supabase, toAppUser } from '@/lib/supabase'
import type { User } from '@/types/marketplace'

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(Boolean(supabase))

  useEffect(() => {
    if (!supabase) return

    const applySession = (session: Session | null) => {
      setCurrentUser(session ? toAppUser(session.user) : null)
      setAuthLoading(false)
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-sm font-medium text-white">
        Loading your account…
      </main>
    )
  }

  return (
    <Routes>
      <Route
        path="/"
        element={currentUser
          ? <Navigate to="/marketplace" replace />
          : <Landing onLoginSuccess={setCurrentUser} />}
      />
      <Route
        path="/marketplace"
        element={currentUser
          ? <Home currentUser={currentUser} onUserChange={setCurrentUser} />
          : <Navigate to="/" replace />}
      />
      <Route path="/terms" element={<PublicInfo page="terms" />} />
      <Route path="/returns" element={<PublicInfo page="returns" />} />
      <Route path="/faq" element={<PublicInfo page="faq" />} />
      <Route path="*" element={<Navigate to={currentUser ? '/marketplace' : '/'} replace />} />
    </Routes>
  )
}
