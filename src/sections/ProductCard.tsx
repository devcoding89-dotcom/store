import { CheckCircle2, Eye, ShoppingBag } from 'lucide-react'
import { formatNaira } from '@/lib/catalog'
import type { Product } from '@/types/marketplace'

type ProductCardProps = {
  product: Product
  onView: (product: Product) => void
  onAdd: (product: Product) => void
}

export function ProductCard({ product, onView, onAdd }: ProductCardProps) {
  return (
    <article className="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-lg sm:rounded-2xl">
      <button
        type="button"
        onClick={() => onView(product)}
        className="relative block aspect-square w-full overflow-hidden bg-slate-100 text-left"
        aria-label={`View ${product.name}`}
      >
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
      </button>

      <div className="flex flex-1 flex-col p-2.5 sm:p-4">
        <div className="flex min-h-4 items-center gap-1 text-[9px] font-semibold text-emerald-800 sm:text-[10px]">
          <CheckCircle2 size={11} className="shrink-0" />
          <span className="truncate">{product.category}</span>
        </div>
        <button
          type="button"
          onClick={() => onView(product)}
          className="mt-1.5 line-clamp-2 min-h-9 text-left text-xs font-semibold leading-4 text-slate-900 hover:text-emerald-800 sm:min-h-10 sm:text-sm sm:leading-5"
        >
          {product.name}
        </button>
        <p className="mt-2 font-display text-sm font-extrabold tracking-tight text-slate-950 sm:text-lg">
          {formatNaira(product.listing_price)}
        </p>
        <button
          type="button"
          onClick={() => onAdd(product)}
          className="mt-2.5 flex min-h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-700 px-2 py-2 text-[10px] font-bold text-white transition hover:bg-emerald-800 active:scale-[0.98] sm:mt-3 sm:min-h-10 sm:rounded-xl sm:text-xs"
        >
          <ShoppingBag size={14} />
          Add to cart
        </button>
      </div>
    </article>
  )
}
