import { useEffect, useLayoutEffect, useState, useMemo, useRef } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { fetchProducts } from '@/lib/api'
import type { Product } from '@/types/marketplace'
import { ProductCard } from '@/sections/ProductCard'

type FeaturedProps = {
  query: string
  category: string
  onCategory: (c: string) => void
  onClearSearch: () => void
  onViewDetail: (p: Product, sectionIndex: number, slideIndex: number) => void
  onProductsLoaded: () => void
  initialSectionIndex: number
  initialSlideIndex: number
}

type ProductSection = {
  type: 'normal' | 'carousel'
  products: Product[]
}

type ProductCarouselProps = {
  products: Product[]
  initialSlide: number
  onViewDetail: (product: Product, slideIndex: number) => void
}

function ProductCarousel({ products, initialSlide, onViewDetail }: ProductCarouselProps) {
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const slides = useMemo(() => {
    const result: Product[][] = []
    for (let index = 0; index < products.length; index += 4) {
      result.push(products.slice(index, index + 4))
    }
    return result
  }, [products])
  const [activeSlide, setActiveSlide] = useState(() => Math.min(initialSlide, slides.length - 1))

  const moveSlide = (direction: -1 | 1) => {
    setActiveSlide((slide) => Math.max(0, Math.min(slides.length - 1, slide + direction)))
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/70 p-3 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">Swipe to explore</p>
        {slides.length > 1 && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => moveSlide(-1)}
              disabled={activeSlide === 0}
              aria-label="Show previous four products"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 disabled:opacity-40"
            >
              <ChevronLeft size={17} />
            </button>
            <button
              type="button"
              onClick={() => moveSlide(1)}
              disabled={activeSlide === slides.length - 1}
              aria-label="Show next four products"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 disabled:opacity-40"
            >
              <ChevronRight size={17} />
            </button>
          </div>
        )}
      </div>
      <div
        className="flex touch-pan-y transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${activeSlide * 100}%)` }}
        onTouchStart={(event) => {
          const touch = event.touches[0]
          touchStart.current = { x: touch.clientX, y: touch.clientY }
        }}
        onTouchEnd={(event) => {
          const start = touchStart.current
          const touch = event.changedTouches[0]
          touchStart.current = null
          if (!start || !touch) return
          const deltaX = touch.clientX - start.x
          const deltaY = touch.clientY - start.y
          if (Math.abs(deltaX) >= 45 && Math.abs(deltaX) > Math.abs(deltaY)) {
            moveSlide(deltaX < 0 ? 1 : -1)
          }
        }}
      >
        {slides.map((slide, slideIndex) => (
          <div key={slide[0]?.id ?? slideIndex} className="w-full shrink-0">
            <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
              {slide.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onView={(selected) => onViewDetail(selected, slideIndex)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      {slides.length > 1 && (
        <p className="mt-3 text-center text-xs font-medium text-slate-500">
          {activeSlide + 1} / {slides.length}
        </p>
      )}
    </div>
  )
}

export function Featured({
  query,
  category,
  onCategory,
  onClearSearch,
  onViewDetail,
  onProductsLoaded,
  initialSectionIndex,
  initialSlideIndex,
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
  const productSections = useMemo(() => {
    const pattern = [
      { type: 'normal', count: 8 },
      { type: 'carousel', count: 8 },
      { type: 'normal', count: 4 },
      { type: 'carousel', count: 8 },
      { type: 'carousel', count: 8 },
    ] as const
    const sections: ProductSection[] = []
    let productIndex = 0
    let patternIndex = 0
    while (productIndex < products.length) {
      const section = pattern[patternIndex % pattern.length]
      sections.push({
        type: section.type,
        products: products.slice(productIndex, productIndex + section.count),
      })
      productIndex += section.count
      patternIndex += 1
    }
    return sections
  }, [products])

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
          <div className="flex items-center gap-3">
            <p className="text-sm font-medium text-slate-500">
              {products.length} {products.length === 1 ? 'item' : 'items'} available for delivery
            </p>
          </div>
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
          <div className="mt-6 space-y-5 sm:mt-8 sm:space-y-7">
            {productSections.map((section, sectionIndex) => section.type === 'normal' ? (
              <div key={`${section.products[0]?.id}-normal`} className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
                {section.products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onView={(selected) => onViewDetail(selected, sectionIndex, 0)}
                  />
                ))}
              </div>
            ) : (
              <ProductCarousel
                key={`${section.products[0]?.id}-carousel`}
                products={section.products}
                initialSlide={sectionIndex === initialSectionIndex ? initialSlideIndex : 0}
                onViewDetail={(selected, slideIndex) => onViewDetail(selected, sectionIndex, slideIndex)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
