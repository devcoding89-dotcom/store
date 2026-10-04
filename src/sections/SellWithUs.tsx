import { ArrowUpRight, CheckCircle2 } from 'lucide-react'
import { Reveal } from '@/components/Reveal'
import { MARKETPLACE_CONFIG } from '@/lib/config'

const ROWS = [
  {
    title: 'Send us your goods',
    body: 'Photos, prices and a short description on WhatsApp — that\'s all we need.',
  },
  {
    title: 'We list within 24 hours',
    body: 'Your products go live with real pictures, priced the way you want them.',
  },
  {
    title: 'Orders come to you',
    body: 'Customer name, phone, product and drop-off point — nothing hidden.',
  },
  {
    title: 'You deliver, you get paid',
    body: 'We keep a small commission from 5% only when a sale completes.',
  },
]

export function SellWithUs() {
  return (
    <section id="sell" className="scroll-mt-24 bg-white px-4 py-16 sm:px-8 lg:px-10 lg:py-24">
      <div className="mx-auto max-w-7xl grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
        {/* Left — CTA side */}
        <Reveal>
          <div>
            <span className="inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-700">
              For Sellers
            </span>
            <h2 className="mt-4 font-display text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">
              Your shop doesn't need a website. It needs{' '}
              <span className="text-emerald-600">customers.</span>
            </h2>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-slate-600">
              A proper website costs ₦50,000–₦150,000 before it sells a single thing. Skip all that.
              We bring the buyers; you keep doing what you're good at.
            </p>
            <a
              href={MARKETPLACE_CONFIG.support.whatsapp}
              target="_blank"
              rel="noreferrer"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow-md"
            >
              List your shop — it's free
              <ArrowUpRight size={16} strokeWidth={2} />
            </a>
            <p className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <CheckCircle2 size={14} className="text-emerald-500" /> No setup fees
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 size={14} className="text-emerald-500" /> No listing fees
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 size={14} className="text-emerald-500" /> We earn only when you do
              </span>
            </p>
          </div>
        </Reveal>

        {/* Right — Steps */}
        <div className="space-y-0">
          {ROWS.map(({ title, body }, i) => (
            <Reveal key={title} delay={i * 80}>
              <div className="flex gap-4 border-b border-slate-100 py-5 last:border-b-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-sm font-bold text-emerald-700">
                  0{i + 1}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{body}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
