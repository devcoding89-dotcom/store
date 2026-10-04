import { type FormEvent, useState } from 'react'
import { Search, ArrowRight, MessageSquare, ShieldCheck, Zap, Truck } from 'lucide-react'

const CHIPS = ['Books', 'iPhone 16 pro', 'Smart watch', 'SAMSUNG GALAXY S24', 'Power bank', 'Rich Dad Poor Dad']

export function Hero({
  onSearch,
  onOpenConcierge,
}: {
  onSearch: (q: string) => void
  onOpenConcierge?: () => void
}) {
  const [q, setQ] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    onSearch(q)
  }

  return (
    <section id="top" className="relative bg-gradient-to-b from-slate-50 via-white to-slate-50 border-b border-slate-200/80 py-12 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Headlines & Search */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            {/* Tagline pill */}
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-3.5 py-1 text-xs font-semibold text-emerald-800 w-fit mb-5 shadow-xs">
              <span className="flex h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
              Verified Citywide Marketplace · Live Stalls
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-[1.12]">
              Shop verified books, gadgets & essentials with <span className="text-emerald-600">live price bargaining</span>.
            </h1>

            <p className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl font-normal">
              Direct from verified stalls across the city. Negotiate prices in real-time with our sales desk manager, pay securely with Paystack, and get tracked delivery to your door.
            </p>

            {/* Big prominent search box */}
            <form onSubmit={submit} className="mt-8 flex max-w-xl items-center rounded-2xl border-2 border-emerald-600/30 bg-white p-2 shadow-lg shadow-emerald-900/5 focus-within:border-emerald-600 focus-within:ring-4 focus-within:ring-emerald-100 transition-all">
              <div className="flex flex-1 items-center px-3">
                <Search size={20} className="text-slate-400 mr-3 shrink-0" />
                <input
                  type="text"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search by book title, iPhone, author, watch..."
                  className="w-full bg-transparent text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:outline-none font-medium"
                />
              </div>
              <button
                type="submit"
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 active:scale-95 transition-all shrink-0"
              >
                <span>Search</span>
                <ArrowRight size={16} />
              </button>
            </form>

            {/* Popular search pills */}
            <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
              <span className="font-semibold text-slate-400 uppercase tracking-wider text-[11px]">
                Trending:
              </span>
              {CHIPS.map((chip) => (
                <button
                  key={chip}
                  onClick={() => {
                    setQ(chip)
                    onSearch(chip)
                  }}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700 shadow-xs hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50/50 transition-all"
                >
                  {chip}
                </button>
              ))}

              {onOpenConcierge && (
                <button
                  onClick={onOpenConcierge}
                  className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-emerald-600 bg-emerald-50 px-3 py-1.5 font-semibold text-emerald-800 hover:bg-emerald-100 transition-colors"
                >
                  <MessageSquare size={13} />
                  <span>Talk with Amaka</span>
                </button>
              )}
            </div>

            {/* Trust badge icons */}
            <div className="mt-10 grid grid-cols-3 gap-4 border-t border-slate-200/80 pt-6">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">100% Genuine</p>
                  <p className="text-[11px] text-slate-500">Inspected stalls</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-700 shrink-0">
                  <Zap size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Instant Bargain</p>
                  <p className="text-[11px] text-slate-500">Live price match</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
                  <Truck size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">WhatsApp Alert</p>
                  <p className="text-[11px] text-slate-500">Direct to owner</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Clean Interactive Hero Showcase */}
          <div className="lg:col-span-5 relative flex justify-center">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/60">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Live Deal Negotiation
                  </span>
                </div>
                <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                  Paystack Verified
                </span>
              </div>

              {/* Showcase Product Preview */}
              <div className="mt-4 flex gap-4 items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                <img
                  src="https://luxoncvjroafxvsylhjh.supabase.co/storage/v1/object/public/product-images/iphone-16-pro-1784901393878.jpg"
                  alt="iPhone 16 Pro"
                  className="h-20 w-20 rounded-lg object-cover bg-white border border-slate-200"
                />
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-100/60 px-2 py-0.5 rounded">
                    Phones & Gadgets
                  </span>
                  <h4 className="font-display text-sm font-bold text-slate-900 mt-1">
                    iPhone 16 pro (256GB)
                  </h4>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-base font-bold text-slate-900">₦902,500</span>
                    <span className="text-xs text-slate-400 line-through">₦950,000</span>
                  </div>
                </div>
              </div>

              {/* Chat snippet preview */}
              <div className="mt-4 space-y-2.5 text-xs">
                <div className="flex gap-2 items-start">
                  <div className="h-6 w-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0">
                    A
                  </div>
                  <div className="bg-slate-100 rounded-2xl rounded-tl-xs px-3 py-2 text-slate-700 leading-relaxed max-w-[85%]">
                    "I can give you a special discount of 5% on this iPhone 16 Pro today. Ready to lock it in?"
                  </div>
                </div>

                <div className="flex justify-end">
                  <div className="bg-emerald-600 text-white rounded-2xl rounded-tr-xs px-3 py-2 leading-relaxed max-w-[80%] font-medium">
                    "Deal! Let me pay with Paystack right now."
                  </div>
                </div>
              </div>

              {/* Trigger negotiation button */}
              <div className="mt-5 pt-4 border-t border-slate-100">
                <button
                  onClick={onOpenConcierge}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-sm hover:bg-emerald-700 transition-colors"
                >
                  <MessageSquare size={15} />
                  Start Live Bargain with Amaka
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
