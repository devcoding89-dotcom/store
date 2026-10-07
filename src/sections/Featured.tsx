import { useEffect, useLayoutEffect, useState, useMemo } from 'react'
import { X } from 'lucide-react'
import { fetchProducts } from '@/lib/api'
import type { Product } from '@/types/marketplace'
import { ProductCard } from '@/sections/ProductCard'

type FeaturedProps = {
  query: string
  category: string
  onCategory: (c: string) => void
  onClearSearch: () => void
  onAdd: (p: Product) => void
  onViewDetail: (p: Product) => void
  onProductsLoaded: () => void
}

export function Featured({
  query,
  category,
  onCategory,
  onClearSearch,
  onAdd,
  onViewDetail,
  onProductsLoaded,
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

  useLayoutEffect(() => {
    if (!loading) onProductsLoaded()
  }, [loading, onProductsLoaded])

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
          <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} onView={onViewDetail} onAdd={onAdd} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
