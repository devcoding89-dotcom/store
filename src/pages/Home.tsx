import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { MessageCircle } from 'lucide-react'
import { Header } from '@/sections/Header'
import { Hero } from '@/sections/Hero'
import { Marquee } from '@/sections/Marquee'
import { Categories } from '@/sections/Categories'
import { Featured } from '@/sections/Featured'
import { TrackOrder } from '@/sections/TrackOrder'
import { CartDrawer } from '@/sections/CartDrawer'
import { AINegotiatorChat } from '@/sections/AINegotiatorChat'
import { CustomerAccount } from '@/sections/CustomerAccount'
import { CustomerOrders } from '@/sections/CustomerOrders'
import { ProductPage } from '@/sections/ProductPage'
import { fetchProducts } from '@/lib/api'
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

function getProductId(pathname: string) {
  const match = pathname.match(/^\/marketplace\/products\/([^/]+)\/?$/)
  if (!match) return null
  try {
    return decodeURIComponent(match[1])
  } catch {
    return null
  }
}

export default function Home({ currentUser, onUserChange }: HomeProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const [savedShoppingState] = useState(() => loadShoppingState(currentUser.id))
  const isProductPage = location.pathname.startsWith('/marketplace/products/')
  const productId = getProductId(location.pathname)

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

  // ─── Product detail page ───
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([])
  const savedProductListScroll = useRef(0)
  const [savedProductListSection, setSavedProductListSection] = useState(0)
  const [savedProductListSlide, setSavedProductListSlide] = useState(0)
  const pendingScrollRestore = useRef<number | null>(null)
  const detailProduct = productId
    ? catalogProducts.find((product) => product.id === productId) || null
    : null

  // ─── Customer Account ───
  const [accountOpen, setAccountOpen] = useState(false)
  const [ordersOpen, setOrdersOpen] = useState(false)

  // ─── Track Order ───
  const [trackCode, setTrackCode] = useState('')

  useEffect(() => {
    saveShoppingState(currentUser.id, { cart, query, category })
  }, [currentUser.id, cart, query, category])

  useEffect(() => {
    const state = location.state as {
      restoreProductListScroll?: number
      restoreProductListSlide?: number
    } | null
    if (location.pathname === '/marketplace' && typeof state?.restoreProductListScroll === 'number') {
      pendingScrollRestore.current = state.restoreProductListScroll
    }
  }, [location.pathname, location.state])

  useEffect(() => {
    const route = location.pathname.match(/^\/marketplace\/products\/([^/]+)\/?$/)
    if (!route) return

    let requestedProductId: string
    try {
      requestedProductId = decodeURIComponent(route[1])
    } catch {
      navigate('/marketplace', { replace: true })
      return
    }

    let active = true
    void fetchProducts().then((catalog) => {
      if (!active) return
      setCatalogProducts(catalog)
      if (!catalog.some((product) => product.id === requestedProductId)) {
        navigate('/marketplace', { replace: true })
      }
    })
    return () => { active = false }
  }, [location.pathname, navigate])

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

  const handleViewDetail = useCallback((p: Product, sectionIndex = 0, slideIndex = 0) => {
    if (!isProductPage) {
      savedProductListScroll.current = window.scrollY
      setSavedProductListSection(sectionIndex)
      setSavedProductListSlide(slideIndex ?? 0)
    }
    setCatalogProducts((current) => current.some((item) => item.id === p.id) ? current : [p, ...current])
    navigate(`/marketplace/products/${encodeURIComponent(p.id)}`)
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [isProductPage, navigate])

  const handleBackToProducts = useCallback(() => {
    pendingScrollRestore.current = savedProductListScroll.current
    navigate('/marketplace', {
      state: {
        restoreProductListScroll: savedProductListScroll.current,
        restoreProductListSection: savedProductListSection,
        restoreProductListSlide: savedProductListSlide,
      },
    })
  }, [navigate, savedProductListSection, savedProductListSlide])

  const restoreProductListScroll = useCallback(() => {
    const scrollY = pendingScrollRestore.current
    if (scrollY === null) return
    pendingScrollRestore.current = null
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => window.scrollTo({ top: scrollY, behavior: 'auto' }))
    })
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
        onOpenOrders={() => setOrdersOpen(true)}
      />

      <main>
        {isProductPage ? (
          <ProductPage
            key={productId || location.pathname}
            product={detailProduct}
            products={catalogProducts}
            loading={!detailProduct}
            onBack={handleBackToProducts}
            onViewProduct={handleViewDetail}
            onAddToCart={addToCart}
            onNegotiate={handleNegotiate}
          />
        ) : (
          <>
            <Hero
              onSearch={search}
              onOpenConcierge={() => setChatOpen(true)}
            />
            <Marquee />
            <Categories onPick={pickCategory} />

            <Featured
              query={query}
              category={category}
              initialSectionIndex={savedProductListSection}
              initialSlideIndex={savedProductListSlide}
              onCategory={setCategory}
              onClearSearch={() => setQuery('')}
              onViewDetail={handleViewDetail}
              onProductsLoaded={restoreProductListScroll}
            />
          </>
        )}
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

      {/* Customer Account Overlay */}
      {accountOpen && (
        <CustomerAccount
          currentUser={currentUser}
          onLoginSuccess={onUserChange}
          onLogout={() => onUserChange(null)}
          onClose={() => setAccountOpen(false)}
        />
      )}
      {ordersOpen && (
        <CustomerOrders
          currentUser={currentUser}
          onTrackOrder={handleTrackOrder}
          onClose={() => setOrdersOpen(false)}
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
