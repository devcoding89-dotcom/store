import { useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronLeft, ChevronRight, MessageCircle, ShieldCheck, ShoppingBag, Truck } from 'lucide-react'
import { formatNaira } from '@/lib/catalog'
import type { Product } from '@/types/marketplace'
import { ProductCard } from '@/sections/ProductCard'

type ProductPageProps = {
  product: Product | null
  products: Product[]
  loading: boolean
  onBack: () => void
  onViewProduct: (product: Product) => void
  onAddToCart: (product: Product) => void
  onNegotiate: (product: Product) => void
}

export function ProductPage({
  product,
  products,
  loading,
  onBack,
  onViewProduct,
  onAddToCart,
  onNegotiate,
}: ProductPageProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const touchStartX = useRef<number | null>(null)

  if (loading || !product) {
    return (
      <section className="min-h-[55vh] bg-[#f8faf8] px-4 py-12 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-emerald-800">
            <ArrowLeft size={17} /> Back to products
          </button>
          <p role={loading ? undefined : 'alert'} className="mt-8 text-sm text-slate-600">
            {loading ? 'Loading product details…' : 'This product could not be found. Return to the marketplace to browse available products.'}
          </p>
        </div>
      </section>
    )
  }

  const images = product.images?.length ? product.images : [product.image]
  const activeImage = images[Math.min(activeImageIndex, images.length - 1)] || product.image
  const relatedProducts = products.filter((item) => item.id !== product.id)

  const showPreviousImage = () => {
    setActiveImageIndex((index) => (index - 1 + images.length) % images.length)
  }
  const showNextImage = () => {
    setActiveImageIndex((index) => (index + 1) % images.length)
  }

  return (
    <div className="bg-[#f8faf8] pb-12">
      <div className="mx-auto max-w-7xl px-4 pt-5 sm:px-8 sm:pt-8 lg:px-12">
        <button onClick={onBack} className="inline-flex items-center gap-2 rounded-full px-2 py-2 text-sm font-semibold text-slate-600 transition hover:text-emerald-800">
          <ArrowLeft size={17} /> Back to products
        </button>

        <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)] lg:gap-12">
          <div>
            <div
              className="relative aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:rounded-3xl"
              onTouchStart={(event) => { touchStartX.current = event.touches[0]?.clientX ?? null }}
              onTouchEnd={(event) => {
                if (touchStartX.current === null || images.length < 2) return
                const delta = event.changedTouches[0].clientX - touchStartX.current
                if (Math.abs(delta) > 40) {
                  if (delta < 0) showNextImage()
                  else showPreviousImage()
                }
                touchStartX.current = null
              }}
            >
              <img src={activeImage} alt={product.name} className="h-full w-full select-none object-contain" />
              {product.badge && (
                <span className="absolute left-3 top-3 rounded-full bg-slate-950/85 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  {product.badge}
                </span>
              )}
              {images.length > 1 && (
                <>
                  <button onClick={showPreviousImage} aria-label="Previous product image" className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-slate-800 shadow-lg transition hover:bg-white">
                    <ChevronLeft size={21} />
                  </button>
                  <button onClick={showNextImage} aria-label="Next product image" className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-slate-800 shadow-lg transition hover:bg-white">
                    <ChevronRight size={21} />
                  </button>
                  <span className="absolute bottom-3 right-3 rounded-full bg-slate-950/70 px-3 py-1 text-xs font-semibold text-white">
                    {activeImageIndex + 1} / {images.length}
                  </span>
                </>
              )}
            </div>
            {images.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {images.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    onClick={() => setActiveImageIndex(index)}
                    aria-label={`Show product image ${index + 1}`}
                    aria-pressed={activeImageIndex === index}
                    className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 bg-white transition sm:h-20 sm:w-20 ${
                      activeImageIndex === index ? 'border-emerald-600 ring-2 ring-emerald-100' : 'border-slate-200 opacity-75 hover:opacity-100'
                    }`}
                  >
                    <img src={image} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
            {images.length > 1 && <p className="mt-2 text-center text-xs text-slate-500">Swipe the photo or tap a thumbnail to see more</p>}
          </div>

          <div className="self-start rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:rounded-3xl sm:p-7 lg:sticky lg:top-24">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">{product.category}</span>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                <CheckCircle2 size={14} /> Sold by TownSquare
              </span>
            </div>
            <h1 className="mt-4 font-display text-2xl font-extrabold leading-tight tracking-tight text-slate-950 sm:text-3xl">
              {product.name}
            </h1>
            <p className="mt-4 font-display text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
              {formatNaira(product.listing_price)}
            </p>
            <div className="mt-5 border-t border-slate-100 pt-5">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Product details</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">
                {product.description || 'No additional description is available for this product yet.'}
              </p>
            </div>
            {product.features?.length ? (
              <div className="mt-5 border-t border-slate-100 pt-5">
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Specifications</h2>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {product.features.map((feature, index) => (
                    <li key={`${feature}-${index}`} className="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div className="mt-5 space-y-2 border-t border-slate-100 pt-5 text-xs text-slate-600">
              <p className="flex items-center gap-2"><Truck size={15} className="text-emerald-700" /> Delivery charge is confirmed at checkout.</p>
              <p className="flex items-center gap-2"><ShieldCheck size={15} className="text-emerald-700" /> TownSquare handles your order and customer support.</p>
            </div>
            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              <button onClick={() => onNegotiate(product)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-emerald-700 bg-white px-4 text-sm font-bold text-emerald-800 transition hover:bg-emerald-50">
                <MessageCircle size={17} /> Ask Amaka
              </button>
              <button onClick={() => onAddToCart(product)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800">
                <ShoppingBag size={17} /> Add to cart
              </button>
            </div>
          </div>
        </div>

        <section id="shop" className="scroll-mt-24 mt-12 border-t border-slate-200 pt-8 sm:mt-16 sm:pt-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-emerald-700">Keep browsing</p>
              <h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">More products for you</h2>
            </div>
            <span className="pb-1 text-xs font-medium text-slate-500">{relatedProducts.length} items</span>
          </div>
          {relatedProducts.length ? (
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5">
              {relatedProducts.map((item) => (
                <ProductCard key={item.id} product={item} onView={onViewProduct} />
              ))}
            </div>
          ) : (
            <p className="mt-5 rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">
              There are no other products to show right now.
            </p>
          )}
          <button onClick={onBack} className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-emerald-800 hover:text-emerald-950">
            Browse all products <ArrowRight size={16} />
          </button>
        </section>
      </div>
    </div>
  )
}
