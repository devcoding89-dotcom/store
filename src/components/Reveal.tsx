import { useEffect, useRef, type ReactNode } from 'react'

type RevealProps = {
  children: ReactNode
  className?: string
  delay?: number
}

export function Reveal({ children, className = '', delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('is-inview')
          io.disconnect()
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={ref} className={`reveal ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  )
}

/** Animated dotted horizontal rule — the spec-sheet motif */
export function DottedRule({ dark = false, className = '' }: { dark?: boolean; className?: string }) {
  return (
    <svg className={`block h-[2px] w-full ${className}`} aria-hidden="true" preserveAspectRatio="none">
      <line
        x1="0"
        y1="1"
        x2="100%"
        y2="1"
        stroke={dark ? '#F1F5F9' : '#E2E8F0'}
        strokeWidth="1"
        className="dotted-anim"
        opacity={dark ? 0.5 : 0.4}
      />
    </svg>
  )
}
