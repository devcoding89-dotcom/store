import { useEffect, useRef } from 'react'

const TAP_WINDOW_MS = 2500

export function HiddenAdminAccess() {
  const tapCount = useRef(0)
  const resetTimer = useRef<number | null>(null)

  useEffect(() => () => {
    if (resetTimer.current !== null) window.clearTimeout(resetTimer.current)
  }, [])

  const handleTap = () => {
    tapCount.current += 1
    if (resetTimer.current !== null) window.clearTimeout(resetTimer.current)
    resetTimer.current = window.setTimeout(() => {
      tapCount.current = 0
      resetTimer.current = null
    }, TAP_WINDOW_MS)

    if (tapCount.current === 3) {
      window.location.assign('/admin')
    }
  }

  return (
    <button
      type="button"
      onClick={handleTap}
      aria-label="Open private admin sign-in"
      className="rounded px-1 font-mono text-[10px] tracking-[0.2em] text-slate-500/60 transition hover:text-slate-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-500"
    >
      $$$
    </button>
  )
}
