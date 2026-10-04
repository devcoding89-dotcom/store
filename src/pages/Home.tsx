import { useCallback, useState } from 'react'
import { Header } from '@/sections/Header'
import { Hero } from '@/sections/Hero'
import { Marquee } from '@/sections/Marquee'
import { Categories } from '@/sections/Categories'
import { Featured } from '@/sections/Featured'
import { HowItWorks } from '@/sections/HowItWorks'
import { SellWithUs } from '@/sections/SellWithUs'
import { TrackOrder } from '@/sections/TrackOrder'
import { CartDrawer } from '@/sections/CartDrawer'
import { AINegotiatorChat } from '@/sections/AINegotiatorChat'
import { ProductDetailModal } from '@/sections/ProductDetailModal'
import { AdminPortal } from '@/sections/AdminPortal'
import { CustomerAccount } from '@/sections/CustomerAccount'
import { Footer } from '@/sections/Footer'

import type { Product, CartItem, User } from '@/types/marketplace'

function scrollToShop() {
  document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' })
}

export default function Home() {
  // ─── Search & Filter ───
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')

  // ─── Cart ───
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)

  // ─── AI Negotiator (Amaka) ───
  const [chatOpen, setChatOpen] = useState(false)
  const [activeProduct, setActiveProduct] = useState<Product | null>(null)
  const [checkoutItems, setCheckoutItems] = useState<CartItem[] | null>(null)

  // ─── Product Detail Modal ───
  const [detailProduct, setDetailProduct] = useState<Product | null>(null)

  // ─── Admin Portal ───
  const [adminOpen, setAdminOpen] = useState(false)

  // ─── Customer Account ───
  const [accountOpen, setAccountOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  // ─── Track Order ───
  const [trackCode, setTrackCode] = useState('')

  // ─── Handlers ───
  const search = useCallback((q: string) => {
    setQuery(q)
    setCategory('All')
    scrollToShop()
  }, [])

  const pickCategory = useCallback((c: string) => {
    setCategory(c)
    setQuery('')
    scrollToShop()
  }, [])

  const addToCart = useCallback((p: Product) => {
    setCart((prev) => {
      const found = prev.find((i) => i.product.id === p.id)
      if (found) {
        return prev.map((i) => (i.product.id === p.id ? { ...i, qty: i.qty + 1 } : i))
      }
      return [...prev, { product: p, qty: 1 }]
    })
    setCartOpen(true)
  }, [])

  const changeQty = useCallback((id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => (i.product.id === id ? { ...i, qty: i.qty + delta } : i))
        .filter((i) => i.qty > 0),
    )
  }, [])

  const removeItem = useCallback((id: string) => {
    setCart((prev) => prev.filter((i) => i.product.id !== id))
  }, [])

  const handleOrdered = useCallback((code: string) => {
    setTrackCode(code)
    setCart([])
  }, [])

  const handleViewDetail = useCallback((p: Product) => {
    setDetailProduct(p)
  }, [])

  const handleNegotiate = useCallback((p: Product) => {
    setActiveProduct(p)
    setChatOpen(true)
  }, [])

  const handleTrackOrder = useCallback((code: string) => {
    setTrackCode(code)
    document.getElementById('track')?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  return (
    <div className="min-h-screen">
      <Header
        cartCount={cart.reduce((n, i) => n + i.qty, 0)}
        searchQuery={query}
        onSearch={search}
        onOpenCart={() => setCartOpen(true)}
        onOpenAccount={() => setAccountOpen(true)}
        onOpenAdmin={() => setAdminOpen(true)}
      />

      <main>
        <Hero
          onSearch={search}
          onOpenConcierge={() => setChatOpen(true)}
        />
        <Marquee />
        <Categories onPick={pickCategory} />

        <Featured
          query={query}
          category={category}
          onCategory={setCategory}
          onClearSearch={() => setQuery('')}
          onAdd={addToCart}
          onViewDetail={handleViewDetail}
          onNegotiate={handleNegotiate}
        />
        <HowItWorks />
        <SellWithUs />
        <TrackOrder prefill={trackCode} />
      </main>

      <Footer />

      {/* Cart Drawer */}
      <CartDrawer
        open={cartOpen}
        items={cart}
        currentUser={currentUser}
        onClose={() => setCartOpen(false)}
        onQty={changeQty}
        onRemove={removeItem}
        onOrdered={handleOrdered}
        onProceedToAI={(items) => {
          setCheckoutItems(items)
          setActiveProduct(items[0]?.product || null)
          setChatOpen(true)
        }}
      />

      {/* AI Negotiator Chat (Amaka) */}
      <AINegotiatorChat
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        onOpen={() => setChatOpen(true)}
        onAddToCart={addToCart}
        onTrackOrder={handleTrackOrder}
        activeProduct={activeProduct}
        checkoutItems={checkoutItems}
      />

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={detailProduct}
        onClose={() => setDetailProduct(null)}
        onAddToCart={addToCart}
        onNegotiate={handleNegotiate}
      />

      {/* Admin Portal - Full Screen Overlay */}
      {adminOpen && (
        <div className="fixed inset-0 z-[70] overflow-y-auto bg-white">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-slate-900 px-4 py-3 text-white shadow-sm">
            <h2 className="font-display text-lg font-semibold">Admin Portal</h2>
            <button
              onClick={() => setAdminOpen(false)}
              className="text-sm font-medium text-slate-300 hover:text-emerald-400 transition-colors"
            >
              ✕ Close Admin
            </button>
          </div>
          <AdminPortal onBackToShop={() => setAdminOpen(false)} />
        </div>
      )}

      {/* Customer Account Overlay */}
      {accountOpen && (
        <div className="fixed inset-0 z-[65] flex items-start justify-center overflow-y-auto bg-slate-900/50 backdrop-blur-sm pt-10 pb-10 px-4">
          <CustomerAccount
            currentUser={currentUser}
            onLoginSuccess={(user) => setCurrentUser(user)}
            onLogout={() => setCurrentUser(null)}
            onTrackOrder={(code) => {
              setAccountOpen(false)
              handleTrackOrder(code)
            }}
            onClose={() => setAccountOpen(false)}
          />
        </div>
      )}
    </div>
  )
}
