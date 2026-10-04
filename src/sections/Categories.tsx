import { CATEGORIES } from '@/lib/catalog'
import { Reveal } from '@/components/Reveal'

export function Categories({ onPick }: { onPick: (category: string) => void }) {
  return (
    <section className="bg-white px-4 py-16 sm:px-8 lg:px-10 lg:py-20" aria-label="Categories">
      <Reveal>
        <div className="mx-auto max-w-7xl">
          <span className="inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-700">
            Browse Categories
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold text-slate-900 sm:text-4xl">
            What are you looking for?
          </h2>
        </div>
      </Reveal>

      <div className="mx-auto mt-10 grid max-w-7xl grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {CATEGORIES.map((cat, i) => (
          <Reveal key={cat.name} delay={(i % 4) * 60}>
            <button
              onClick={() => onPick(cat.name)}
              className="group relative block h-full w-full overflow-hidden rounded-xl bg-white text-left shadow-card transition-all hover:shadow-cardHover"
            >
              <div className="aspect-[4/3] overflow-hidden rounded-t-xl">
                <img
                  src={cat.image}
                  alt={cat.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                />
              </div>
              <div className="p-3">
                <p className="text-sm font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  {cat.name}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {cat.stalls} stalls
                </p>
              </div>
              {/* Emerald accent bar on hover */}
              <div className="absolute bottom-0 left-0 h-0.5 w-full bg-emerald-500 transform scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100" />
            </button>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
