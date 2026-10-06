import { useCallback, useEffect, useState } from 'react'
import { MessageCircle } from 'lucide-react'
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
import { CustomerAccount } from '@/sections/CustomerAccount'
import { Footer } from '@/sections/Footer'
import { loadShoppingState, saveShoppingState } from '@/lib/shoppingState'

import type { Product, CartItem, User } from '@/types/marketplace'

type HomeProps = {
  currentUser: User
  onUserChange: (user: User | null) => void
}

function scrollToShop() {
  document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' })
}

export default function Home({ currentUser, onUserChange }: HomeProps) {
  const [savedShoppingState] = useState(() => loadShoppingState(currentUser.id))

  // ─── Search & Filter ───
  const [query, setQuery] = useState(savedShoppingState.query)
  const [category, setCategory] = useState(savedShoppingState.category)

  // ─── Cart ───
  const [cart, setCart] = useState<CartItem[]>(savedShoppingState.cart)
  const [cartOpen, setCartOpen] = useState(false)

  // ─── AI Negotiator (Amaka) ───
  const [chatOpen, setChatOpen] = useState(false)
  const [activeProduct, setActiveProduct] = useState<Product | null>(null)
  const [checkoutItems, setCheckoutItems] = useState<CartItem[] | null>(null)

  // ─── Product Detail Modal ───
  const [detailProduct, setDetailProduct] = useState<Product | null>(null)

  // ─── Customer Account ───
  const [accountOpen, setAccountOpen] = useState(false)

  // ─── Track Order ───
  const [trackCode, setTrackCode] = useState('')

  useEffect(() => {
    saveShoppingState(currentUser.id, { cart, query, category })
  }, [currentUser.id, cart, query, category])

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
          setCart([])
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
        currentUser={currentUser}
      />

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={detailProduct}
        onClose={() => setDetailProduct(null)}
        onAddToCart={addToCart}
        onNegotiate={handleNegotiate}
      />

      {/* Customer Account Overlay */}
      {accountOpen && (
        <CustomerAccount
          currentUser={currentUser}
          onLoginSuccess={onUserChange}
          onLogout={() => onUserChange(null)}
          onTrackOrder={(code) => {
            setAccountOpen(false)
            handleTrackOrder(code)
          }}
          onClose={() => setAccountOpen(false)}
        />
      )}
      {/* Floating Chat Trigger — quick access on mobile & desktop */}
      {!chatOpen && (
        <button
          onClick={() => {
            setActiveProduct(null)
            setChatOpen(true)
          }}
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2.5 rounded-full bg-emerald-600 px-4 py-3.5 text-white shadow-xl shadow-emerald-950/20 hover:bg-emerald-700 hover:shadow-2xl transition-all active:scale-95 group"
          aria-label="Chat with Amaka"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
          </span>
          <MessageCircle size={18} />
          <span className="text-xs font-bold font-display tracking-wide">Bargain with Amaka</span>
        </button>
      )}
    </div>
  )
}
