import { Reveal } from '@/components/Reveal'
import { MARKETPLACE_CONFIG } from '@/lib/config'
import { Search, Eye, CreditCard, Truck } from 'lucide-react'

const STEPS = [
  {
    n: '01',
    icon: Search,
    title: 'Search or Chat with Sales Desk',
    body: 'Type what you need or chat directly with our sales desk. She checks live shelf stock across all verified stalls in seconds.',
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    n: '02',
    icon: Eye,
    title: 'See the Real Product',
    body: 'Actual prices, actual pictures, actual availability — straight from the seller\'s shelf, not an outdated catalogue.',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    n: '03',
    icon: CreditCard,
    title: 'Negotiate & Pay',
    body: `Bargain with our sales agent or pay listed price via Paystack. You get an instant order code — something like ${MARKETPLACE_CONFIG.orderPrefix}-48291.`,
    color: 'bg-amber-50 text-amber-600',
  },
  {
    n: '04',
    icon: Truck,
    title: 'Track to Your Door',
    body: 'Follow every step with your code. The seller packages, our dispatch delivers, you confirm — simple as that.',
    color: 'bg-purple-50 text-purple-600',
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-24 bg-slate-50 px-4 py-16 sm:px-8 lg:px-10 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <div className="text-center">
            <span className="inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-700">
              How It Works
            </span>
            <h2 className="mt-4 font-display text-3xl font-bold text-slate-900 sm:text-4xl">
              From search to doorstep, <span className="text-emerald-600">four steps</span>
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-base text-slate-600">
              We've made buying from verified local sellers as simple as possible.
            </p>
          </div>
        </Reveal>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => {
            const Icon = s.icon
            return (
              <Reveal key={s.n} delay={i * 100}>
                <div className="group relative flex h-full flex-col rounded-xl bg-white p-6 shadow-card transition-all hover:shadow-cardHover hover:-translate-y-1">
                  {/* Step number */}
                  <span className="absolute -top-3 right-4 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white shadow-sm">
                    {s.n}
                  </span>

                  {/* Icon */}
                  <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${s.color}`}>
                    <Icon size={22} />
                  </div>

                  <h3 className="text-base font-bold text-slate-900">
                    {s.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{s.body}</p>
                </div>
              </Reveal>
            )
          })}
        </div>

        <Reveal delay={120}>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Payments secured by Paystack
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Sellers paid after delivery confirmation
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              WhatsApp dispatch updates
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
