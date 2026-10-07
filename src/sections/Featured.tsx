import { useEffect, useLayoutEffect, useState, useMemo, useRef } from 'react'
import { X } from 'lucide-react'
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
  showSwipeHint: boolean
  onViewDetail: (product: Product, slideIndex: number) => void
}

function ProductCarousel({ products, initialSlide, showSwipeHint, onViewDetail }: ProductCarouselProps) {
  const pointerStart = useRef<{ x: number; y: number } | null>(null)
  const suppressClick = useRef(false)
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
      {showSwipeHint && (
        <p className="mb-3 text-center text-xs font-bold uppercase tracking-wider text-emerald-800">
          Swipe to explore
        </p>
      )}
      <div
        className="flex touch-pan-y select-none transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${activeSlide * 100}%)` }}
        onPointerDown={(event) => {
          suppressClick.current = false
          pointerStart.current = { x: event.clientX, y: event.clientY }
        }}
        onPointerUp={(event) => {
          const start = pointerStart.current
          pointerStart.current = null
          if (!start) return
          const deltaX = event.clientX - start.x
          const deltaY = event.clientY - start.y
          if (Math.abs(deltaX) >= 45 && Math.abs(deltaX) > Math.abs(deltaY)) {
            suppressClick.current = true
            moveSlide(deltaX < 0 ? 1 : -1)
          }
        }}
        onPointerCancel={() => { pointerStart.current = null }}
        onClickCapture={(event) => {
          if (!suppressClick.current) return
          suppressClick.current = false
          event.preventDefault()
          event.stopPropagation()
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
      { type: 'normal', count: 4 },
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
    <section id="shop" className="scroll-mt-20 border-b border-slate-200 bg-slate-50/60 py-8 sm:py-14 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between sm:gap-4 sm:pb-6">
          <div className="min-w-0">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              Live Verified Marketplace
            </span>
            <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
              Explore Products & Start Bargaining
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-xs font-medium text-slate-500 sm:text-sm">
              {products.length} {products.length === 1 ? 'item' : 'items'} available for delivery
            </p>
          </div>
        </div>

        {/* Dynamic Category Filter Pills */}
        <div className="no-scrollbar mt-4 flex items-center gap-2 overflow-x-auto pb-2 sm:mt-6 sm:flex-wrap sm:overflow-visible sm:pb-0">
          {categoryFilters.map((f) => (
            <button
              key={f}
              onClick={() => onCategory(f)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
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
          <div className="mt-5 flex flex-col gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 sm:flex-row sm:items-center sm:justify-between">
            <p className="min-w-0 break-words">
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
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center shadow-xs sm:mt-12 sm:p-12">
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
          <div className="mt-5 space-y-5 sm:mt-8 sm:space-y-7">
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
                showSwipeHint={sectionIndex === productSections.findIndex((item) => item.type === 'carousel')}
                onViewDetail={(selected, slideIndex) => onViewDetail(selected, sectionIndex, slideIndex)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
