import { useEffect, useState, useMemo } from 'react'
import { X, Eye, ShoppingBag, CheckCircle2, MessageCircle } from 'lucide-react'
import { fetchProducts } from '@/lib/api'
import { formatNaira } from '@/lib/catalog'
import type { Product } from '@/types/marketplace'

type FeaturedProps = {
  query: string
  category: string
  onCategory: (c: string) => void
  onClearSearch: () => void
  onAdd: (p: Product) => void
  onViewDetail: (p: Product) => void
  onNegotiate?: (p: Product) => void
}

export function Featured({
  query,
  category,
  onCategory,
  onClearSearch,
  onAdd,
  onViewDetail,
  onNegotiate,
}: FeaturedProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch all products once for dynamic categories
  useEffect(() => {
    fetchProducts().then((data) => {
      setAllProducts(data)
    })
  }, [])

  // Filtered products query
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const data = await fetchProducts(
        category !== 'All' ? category : undefined,
        query || undefined,
      )
      setProducts(data)
      setLoading(false)
    }
    load()
  }, [category, query])

  // Dynamically compute category filters from authentic products
  const categoryFilters = useMemo(() => {
    const cats = Array.from(new Set(allProducts.map((p) => p.category))).filter(Boolean)
    return ['All', ...cats]
  }, [allProducts])

  return (
    <section id="shop" className="scroll-mt-20 bg-slate-50/60 py-16 sm:py-20 border-b border-slate-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-wrap items-end justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              Live Verified Marketplace
            </span>
            <h2 className="mt-1 font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
              Explore Products & Start Bargaining
            </h2>
          </div>
          <p className="text-sm font-medium text-slate-500">
            {products.length} {products.length === 1 ? 'item' : 'items'} available for delivery
          </p>
        </div>

        {/* Dynamic Category Filter Pills */}
        <div className="mt-6 flex flex-wrap gap-2 items-center">
          {categoryFilters.map((f) => (
            <button
              key={f}
              onClick={() => onCategory(f)}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                category === f
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Search Results Filter Banner */}
        {query && (
          <div className="mt-5 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            <p>
              Showing search results for <span className="font-bold">"{query.trim()}"</span> ({products.length} items found)
            </p>
            <button
              onClick={onClearSearch}
              className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1 font-semibold text-xs text-slate-700 shadow-xs hover:bg-slate-100"
            >
              <X size={14} /> Clear Search
            </button>
          </div>
        )}

        {/* Loading state */}
        {loading ? (
          <div className="mt-20 text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-r-transparent" />
            <p className="mt-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Fetching products from database...
            </p>
          </div>
        ) : products.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-xs">
            <h3 className="font-display text-2xl font-bold text-slate-900">No products found</h3>
            <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
              We couldn't find anything matching your search. Try searching for "book", "iphone", or "watch".
            </p>
            <button
              onClick={onClearSearch}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm hover:bg-emerald-700 transition-colors"
            >
              View All Products
            </button>
          </div>
        ) : (
          /* Product Grid */
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((p) => (
              <article
                key={p.id}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-lg hover:border-emerald-300 transition-all duration-200"
              >
                {/* Image Section */}
                <div
                  className="relative aspect-square overflow-hidden bg-slate-100 cursor-pointer"
                  onClick={() => onViewDetail(p)}
                >
                  <img
                    src={p.image}
                    alt={p.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />

                  {/* Badge */}
                  {p.badge && (
                    <span className="absolute left-3 top-3 rounded-full bg-slate-900/90 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300 shadow-sm backdrop-blur-xs">
                      {p.badge}
                    </span>
                  )}

                  {/* In Stock Pill */}
                  <span className="absolute right-3 top-3 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 shadow-xs">
                    ● In Stock
                  </span>

                  {/* Hover Quick Actions */}
                  <div className="absolute inset-0 flex items-center justify-center gap-2 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onViewDetail(p)
                      }}
                      className="flex items-center gap-1 rounded-full bg-white px-3.5 py-2 text-xs font-bold text-slate-900 shadow-md hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                    >
                      <Eye size={14} /> Quick View
                    </button>
                  </div>
                </div>

                {/* Card Body */}
                <div className="flex flex-1 flex-col justify-between p-5">
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                      <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        {p.category}
                      </span>
                      <span className="truncate max-w-[130px] flex items-center gap-1">
                        <CheckCircle2 size={12} className="text-emerald-600" />
                        {p.vendor_name}
                      </span>
                    </div>

                    <h3
                      onClick={() => onViewDetail(p)}
                      className="mt-2.5 font-display text-base font-bold text-slate-900 leading-snug line-clamp-2 cursor-pointer hover:text-emerald-700 transition-colors"
                    >
                      {p.name}
                    </h3>

                    {p.description && (
                      <p className="mt-1.5 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {p.description}
                      </p>
                    )}
                  </div>

                  {/* Price & Actions */}
                  <div className="mt-5 pt-4 border-t border-slate-100">
                    <div className="flex items-baseline justify-between mb-3.5">
                      <span className="font-display text-xl font-bold text-slate-900">
                        {formatNaira(p.listing_price)}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Listed Price
                      </span>
                    </div>

                    <div className="flex gap-2">
                      {onNegotiate && (
                        <button
                          onClick={() => onNegotiate(p)}
                          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-emerald-600 bg-emerald-50/70 py-2.5 text-[11px] font-bold uppercase tracking-wider text-emerald-800 hover:bg-emerald-100 transition-colors active:scale-[0.98]"
                        >
                          <MessageCircle size={14} />
                          Bargain
                        </button>
                      )}
                      <button
                        onClick={() => onAdd(p)}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-[11px] font-bold uppercase tracking-wider text-white hover:bg-emerald-700 transition-colors shadow-xs active:scale-[0.98]"
                      >
                        <ShoppingBag size={14} />
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
