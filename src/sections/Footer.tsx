import { type FormEvent, useState } from 'react'
import { ArrowRight, Mail, Instagram, Twitter } from 'lucide-react'
import { Reveal } from '@/components/Reveal'
import { MARKETPLACE_CONFIG } from '@/lib/config'

export function Footer() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const subscribe = (e: FormEvent) => {
    e.preventDefault()
    if (email.includes('@')) setSubscribed(true)
  }

  return (
    <footer className="bg-slate-900 text-white">
      {/* Newsletter */}
      <div className="border-b border-slate-800 px-4 py-16 sm:px-8 lg:px-10 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <h2 className="max-w-lg font-display text-3xl font-bold sm:text-4xl">
              Good things, <span className="text-emerald-400">close to home.</span>
            </h2>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-slate-400">
              New arrivals, helpful shopping tips, and occasional deals. One email a
              week — never more.
            </p>
          </Reveal>
          <Reveal delay={90}>
            {subscribed ? (
              <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-emerald-600/20 px-5 py-3 text-sm font-semibold text-emerald-400 border border-emerald-500/30">
                <Mail size={16} />
                You're on the list — see you Monday ✓
              </div>
            ) : (
              <form onSubmit={subscribe} className="mt-8 flex max-w-md items-center gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="flex-1 rounded-full border border-slate-700 bg-slate-800 px-5 py-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
                  aria-label="Email address"
                />
                <button
                  type="submit"
                  aria-label="Subscribe"
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white transition-colors hover:bg-emerald-500 shadow-sm"
                >
                  <ArrowRight size={18} strokeWidth={2} />
                </button>
              </form>
            )}
          </Reveal>
        </div>
      </div>

      {/* Link columns */}
      <div className="mx-auto max-w-7xl grid gap-10 px-4 py-14 sm:grid-cols-2 sm:px-8 lg:grid-cols-4 lg:px-10">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-sm">
              T
            </div>
            <span className="font-display text-xl font-bold">{MARKETPLACE_CONFIG.name}</span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">
            Shop through TownSquare and get help with your orders from one place.
          </p>
          <div className="mt-4 flex gap-3">
            <a href="#" className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 text-slate-400 hover:bg-emerald-600 hover:text-white transition-colors">
              <Twitter size={16} />
            </a>
            <a href="#" className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 text-slate-400 hover:bg-emerald-600 hover:text-white transition-colors">
              <Instagram size={16} />
            </a>
          </div>
        </div>
        {(
          [
            ['Shop', ['Fashion & Tailoring', 'Aso-Oke & Textiles', 'Food & Provisions', 'Beauty & Skincare']],
            ['Help', ['Track an order', 'FAQ', 'Returns & refunds', 'Terms & Conditions', 'Contact us']],
            ['Sell', ['List your shop', 'Seller terms', 'Commission rates']],
          ] as const
        ).map(([heading, links]) => (
          <nav key={heading} aria-label={heading}>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">{heading}</p>
            <ul className="mt-4 space-y-2">
              {links.map((l) => (
                <li key={l}>
                  <a
                    href={
                      l === 'FAQ' ? '/faq'
                        : l === 'Returns & refunds' ? '/returns'
                          : l === 'Terms & Conditions' || l === 'Seller terms' ? '/terms'
                            : heading === 'Sell' ? '#sell'
                              : heading === 'Shop' ? '#shop'
                                : '#track'
                    }
                    className="text-sm text-slate-400 transition-colors hover:text-white"
                  >
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      {/* Meta strip */}
      <div className="border-t border-slate-800 px-4 py-5 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl flex flex-col gap-2 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 {MARKETPLACE_CONFIG.name} Marketplace · All Rights Reserved</p>
          <p className="flex items-center gap-1.5">
            Built for local businesses & shoppers
            <span className="h-1 w-1 rounded-full bg-emerald-500" />
            Orders via WhatsApp
          </p>
        </div>
      </div>
    </footer>
  )
}
