import { CheckCircle2, Eye } from 'lucide-react'
import { formatNaira } from '@/lib/catalog'
import type { Product } from '@/types/marketplace'

type ProductCardProps = {
  product: Product
  onView: (product: Product) => void
}

export function ProductCard({ product, onView }: ProductCardProps) {
  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={`View ${product.name}`}
      onClick={() => onView(product)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onView(product)
        }
      }}
      className="group flex min-w-0 cursor-pointer flex-col overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 sm:rounded-2xl"
    >
      <div className="relative block aspect-square w-full overflow-hidden bg-slate-100">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {product.badge && (
          <span className="absolute left-2 top-2 max-w-[70%] truncate rounded-full bg-slate-950/85 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-white shadow-sm sm:left-3 sm:top-3 sm:text-[10px]">
            {product.badge}
          </span>
        )}
        <span className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-slate-700 shadow-md transition group-hover:text-emerald-700 sm:bottom-3 sm:right-3">
          <Eye size={15} />
        </span>
      </div>

      <div className="flex flex-1 flex-col p-2.5 sm:p-4">
        <div className="flex min-h-4 items-center gap-1 text-[9px] font-semibold text-emerald-800 sm:text-[10px]">
          <CheckCircle2 size={11} className="shrink-0" />
          <span className="truncate">{product.category}</span>
        </div>
        <p className="mt-1.5 line-clamp-2 min-h-9 text-xs font-semibold leading-4 text-slate-900 group-hover:text-emerald-800 sm:min-h-10 sm:text-sm sm:leading-5">
          {product.name}
        </p>
        <p className="mt-2 font-display text-sm font-extrabold tracking-tight text-slate-950 sm:text-lg">
          {formatNaira(product.listing_price)}
        </p>
      </div>
    </article>
  )
}
