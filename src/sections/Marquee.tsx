import { SELLER_MARQUEE } from '@/lib/catalog'

export function Marquee() {
  const row = (
    <>
      {SELLER_MARQUEE.map((s) => (
        <span key={s} className="flex items-center whitespace-nowrap">
          <span className="px-6 text-xs font-semibold uppercase tracking-widest text-slate-600">
            {s}
          </span>
          <span className="text-emerald-500" aria-hidden="true">
            •
          </span>
        </span>
      ))}
    </>
  )

  return (
    <div
      className="overflow-hidden border-y border-slate-200 bg-slate-50 py-3 text-slate-700"
      aria-hidden="true"
    >
      <div className="marquee-track">
        <div className="flex">{row}</div>
        <div className="flex">{row}</div>
      </div>
    </div>
  )
}
