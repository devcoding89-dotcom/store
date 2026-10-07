import { useEffect } from 'react'
import { ArrowRight, Minus, Plus, Trash2, X, ShoppingBag, ShieldCheck, Sparkles } from 'lucide-react'
import { formatNaira } from '@/lib/catalog'
import type { CartItem, User } from '@/types/marketplace'

type CartDrawerProps = {
  open: boolean
  items: CartItem[]
  currentUser: User | null
  onClose: () => void
  onQty: (id: string, delta: number) => void
  onRemove: (id: string) => void
  onOrdered: (code: string) => void
  onProceedToAI: (items: CartItem[]) => void
}

export function CartDrawer({
  open,
  items,
  onClose,
  onQty,
  onRemove,
  onProceedToAI,
}: CartDrawerProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const subtotal = items.reduce((sum, i) => sum + i.product.listing_price * i.qty, 0)
  const totalItems = items.reduce((n, i) => n + i.qty, 0)

  const handleCheckoutWithAI = () => {
    if (items.length === 0) return
    onClose()
    onProceedToAI(items)
  }

  return (
    <div
      className={`fixed inset-0 z-[70] ${open ? '' : 'pointer-events-none'}`}
      role="dialog"
      aria-modal="true"
      aria-label="Shopping Cart"
    >
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
      />

      <aside
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white text-slate-900 shadow-2xl transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-6">
          <div className="flex items-center gap-2">
            <ShoppingBag className="text-emerald-600" size={20} />
            <h2 className="font-display text-lg font-bold text-slate-900">
              Your Cart {totalItems > 0 && <span className="text-emerald-700">({totalItems})</span>}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors"
            aria-label="Close cart"
          >
            <X size={18} />
          </button>
        </div>

        {/* Empty State */}
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-4">
              <ShoppingBag size={32} />
            </div>
            <h3 className="font-display text-lg font-bold text-slate-900">Your cart is empty</h3>
            <p className="mt-2 text-sm text-slate-500 max-w-xs">
              Explore our marketplace products and add items to your cart to begin checkout.
            </p>
            <button
              onClick={onClose}
              className="mt-6 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm hover:bg-emerald-700 transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <>
            {/* Cart Items List */}
            <ul className="flex-1 space-y-4 overflow-y-auto divide-y divide-slate-100 p-4 sm:p-6">
              {items.map(({ product, qty }) => (
                <li key={product.id} className="flex gap-4 pt-4 first:pt-0">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-20 w-20 shrink-0 rounded-xl border border-slate-200 object-cover"
                  />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <p className="font-display text-sm font-bold text-slate-900 leading-snug line-clamp-1">
                      {product.name}
                    </p>
                    <p className="text-xs font-bold text-emerald-700 mt-1">
                      {formatNaira(product.listing_price)}
                    </p>

                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50">
                        <button
                          onClick={() => onQty(product.id, -1)}
                          className="flex h-7 w-7 items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-l-lg transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-8 text-center text-xs font-bold text-slate-800">{qty}</span>
                        <button
                          onClick={() => onQty(product.id, 1)}
                          className="flex h-7 w-7 items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-r-lg transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      <button
                        onClick={() => onRemove(product.id)}
                        className="text-slate-400 hover:text-red-600 transition-colors p-1"
                        aria-label="Remove item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* Subtotal & Proceed to AI Checkout */}
            <div className="shrink-0 space-y-4 border-t border-slate-200 bg-slate-50 p-4 sm:p-6">
              <div className="space-y-1.5">
                <div className="flex items-baseline justify-between text-sm text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-display text-xl font-extrabold text-slate-900">
                    {formatNaira(subtotal)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-700">
                  <ShieldCheck size={14} />
                  <span>Buyer Protection & Verified Sellers</span>
                </div>
              </div>

              {/* PROCEED TO CHECKOUT -> DIRECT TO AI CONCIERGE */}
              <button
                onClick={handleCheckoutWithAI}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-4 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-emerald-900/10 hover:bg-emerald-700 transition-all active:scale-[0.99]"
              >
                <Sparkles size={16} />
                Proceed to Checkout (Meet Amaka)
                <ArrowRight size={16} />
              </button>

              <p className="text-center text-[11px] text-slate-500 leading-relaxed">
                Meet your personal sales manager Amaka to review product specs, lock in last price, and confirm order via WhatsApp.
              </p>
            </div>
          </>
        )}
      </aside>
    </div>
  )
}
