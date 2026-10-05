import { useState } from 'react'
import { X, CheckCircle2, ShoppingBag, ShieldCheck, Truck } from 'lucide-react'
import { formatNaira } from '@/lib/catalog'
import type { Product } from '@/types/marketplace'

type ProductDetailModalProps = {
  product: Product | null
  onClose: () => void
  onAddToCart: (p: Product) => void
  onNegotiate?: (p: Product) => void
}

export function ProductDetailModal({
  product,
  onClose,
  onAddToCart,
  onNegotiate,
}: ProductDetailModalProps) {
  if (!product) return null

  // Support multiple images gallery if available
  const allImages =
    product.images && product.images.length > 0
      ? product.images
      : [product.image]

  const [selectedImage, setSelectedImage] = useState(allImages[0] || product.image)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl text-slate-900 max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors"
          aria-label="Close dialog"
        >
          <X size={18} />
        </button>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Left Column: Image Gallery */}
          <div className="flex flex-col gap-3">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 aspect-square shadow-xs">
              <img
                src={selectedImage}
                alt={product.name}
                className="h-full w-full object-cover transition-all"
              />
            </div>

            {/* Gallery thumbnails */}
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {allImages.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(img)}
                    className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                      selectedImage === img
                        ? 'border-emerald-600 shadow-md ring-2 ring-emerald-100'
                        : 'border-slate-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Details & Actions */}
          <div className="flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-0.5 text-xs font-bold text-emerald-800">
                  {product.category}
                </span>
                {product.badge && (
                  <span className="rounded-full bg-slate-900 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                    {product.badge}
                  </span>
                )}
                <span className="ml-auto text-xs font-semibold text-emerald-700 flex items-center gap-1">
                  ● Verified In Stock
                </span>
              </div>

              <h2 className="mt-3 font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 leading-tight">
                {product.name}
              </h2>

              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-display text-3xl font-extrabold text-slate-900">
                  {formatNaira(product.listing_price)}
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Official Store Price
                </span>
              </div>

              {/* Vendor & Stall info */}
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                  <span>Verified Stall: {product.vendor_name}</span>
                </div>
                <p className="mt-1 text-slate-500 pl-5 text-[11px]">
                  📍 {product.vendor_stall_location}
                </p>
              </div>

              {/* Description */}
              <p className="mt-4 text-sm text-slate-600 leading-relaxed font-normal">
                {product.description ||
                  'Authentic, hand-selected product verified directly from our marketplace vendor. Quality checked before dispatch.'}
              </p>

              {/* Features List */}
              {product.features && product.features.length > 0 && (
                <div className="mt-4 border-t border-slate-100 pt-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Specifications:
                  </p>
                  <ul className="grid grid-cols-2 gap-2 text-xs text-slate-700">
                    {product.features.map((feat: string, idx: number) => (
                      <li key={idx} className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 shrink-0" />
                        <span className="truncate font-medium">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Guarantees */}
              <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <Truck size={14} className="text-emerald-600 shrink-0" />
                  <span>Fast tracked delivery across city (₦800–₦1,800)</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
                  <span>Buyer protection: Order via WhatsApp · Verified Dispatch</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 border-t border-slate-100 pt-5 flex flex-col sm:flex-row gap-3">
              {onNegotiate && (
                <button
                  onClick={() => {
                    onNegotiate(product)
                    onClose()
                  }}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-emerald-600 bg-emerald-50/70 py-3 sm:py-3.5 text-xs font-bold uppercase tracking-wider text-emerald-800 hover:bg-emerald-100 transition-all active:scale-[0.99]"
                >
                  Bargain with Amaka
                </button>
              )}
              {/* Primary: Add to Cart */}
              <button
                onClick={() => {
                  onAddToCart(product)
                  onClose()
                }}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 sm:py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-emerald-900/10 hover:bg-emerald-700 transition-all active:scale-[0.99]"
              >
                <ShoppingBag size={16} />
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
