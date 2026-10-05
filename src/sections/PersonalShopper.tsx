import { useState, useRef, useEffect, type FormEvent } from 'react'
import {
  X,
  Send,
  Sparkles,
  PhoneCall,
  ArrowRight,
  Plus,
} from 'lucide-react'
import { PRODUCTS, formatNaira, type Product } from '@/lib/catalog'
import { MARKETPLACE_CONFIG } from '@/lib/config'

type Message = {
  id: string
  sender: 'shopper' | 'user'
  text: string
  time: string
  products?: Product[]
  action?: 'order-prompt' | 'order-complete'
  orderCode?: string
}

type PersonalShopperProps = {
  isOpen: boolean
  onClose: () => void
  onOpen: () => void
  onAddToCart: (p: Product) => void
  onOrdered: (code: string) => void
}

const QUICK_CHIPS = [
  '👗 Dresses under ₦20k',
  '🥩 Kilishi & snacks',
  '🧴 Shea butter & skincare',
  '⚡ Phone chargers & cables',
  '🚚 How does delivery work?',
  '📦 Place an order with me',
]

function getTimestamp() {
  const d = new Date()
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function PersonalShopper({
  isOpen,
  onClose,
  onOpen,
  onAddToCart,
  onOrdered,
}: PersonalShopperProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm-intro',
      sender: 'shopper',
      text: MARKETPLACE_CONFIG.concierge.greeting,
      time: getTimestamp(),
    },
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [unreadCount, setUnreadCount] = useState(1)
  const [hasInteracted, setHasInteracted] = useState(false)

  // Order state inside chat
  const [orderStep, setOrderStep] = useState<'idle' | 'collecting_info' | 'confirmed'>('idle')
  const [orderForm, setOrderForm] = useState({ name: '', phone: '', address: '', item: '' })

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0)
      scrollToBottom()
    }
  }, [isOpen, messages, isTyping])

  // Human-like response generator based on catalog search
  const generateShopperResponse = (query: string) => {
    const q = query.toLowerCase()

    // Delivery query
    if (q.includes('deliver') || q.includes('transport') || q.includes('shipping') || q.includes('fare') || q.includes('fee')) {
      return {
        text: `Here is our exact delivery breakdown for you:\n\n• Central / Downtown: ₦800 (2–4 hours)\n• Inner Ring & Suburbs: ₦1,200 (Same day)\n• Outer Districts: ₦1,800\n\nThe dispatch rider will call you to confirm your address before riding out. You can also pay on delivery!`,
      }
    }

    // Payment query
    if (q.includes('pay') || q.includes('card') || q.includes('transfer') || q.includes('cod')) {
      return {
        text: `You have two easy ways to pay:\n\n1. Chat with Amaka to order directly via WhatsApp with full buyer protection.\n2. Direct bank transfer or pay on delivery when the rider arrives.\n\nEvery order comes with a receipt and tracking code!`,
      }
    }

    // Order intent
    if (q.includes('place an order') || q.includes('order with me') || q.includes('buy this') || q.includes('i want to order')) {
      setOrderStep('collecting_info')
      return {
        text: `I'd love to set that up for you! Just send me:\n1. Your Full Name\n2. Delivery Address\n3. Phone Number\n\nOr fill in the quick card below and I'll confirm with the seller right away:`,
        action: 'order-prompt' as const,
      }
    }

    // Budget search under 10k or 20k
    if (q.includes('20k') || q.includes('20,000') || q.includes('under 20')) {
      const matched = PRODUCTS.filter((p) => p.price <= 20000).slice(0, 3)
      return {
        text: `I found these great items under ₦20,000 currently in stock with our sellers:`,
        products: matched,
      }
    }

    if (q.includes('10k') || q.includes('10,000') || q.includes('cheap') || q.includes('under 10')) {
      const matched = PRODUCTS.filter((p) => p.price <= 10000).slice(0, 3)
      return {
        text: `Here are our best-rated picks under ₦10,000:`,
        products: matched,
      }
    }

    // Keyword matching in catalog
    const matched = PRODUCTS.filter((p) => {
      const pName = p.name.toLowerCase()
      const pCat = p.category.toLowerCase()
      const pSeller = p.seller.toLowerCase()

      if (q.includes('dress') || q.includes('ankara') || q.includes('wear') || q.includes('fashion')) {
        return pCat.includes('fashion') || pName.includes('dress') || pName.includes('ankara')
      }
      if (q.includes('kilishi') || q.includes('meat') || q.includes('beef') || q.includes('food') || q.includes('catfish')) {
        return pCat.includes('food') || pName.includes('kilishi') || pName.includes('catfish')
      }
      if (q.includes('shea') || q.includes('butter') || q.includes('cream') || q.includes('skin') || q.includes('perfume') || q.includes('scent')) {
        return pCat.includes('beauty') || pName.includes('shea') || pName.includes('perfume')
      }
      if (q.includes('shoe') || q.includes('sandal') || q.includes('leather')) {
        return pCat.includes('leather') || pName.includes('shoe') || pName.includes('sandal')
      }
      if (q.includes('charge') || q.includes('cable') || q.includes('phone')) {
        return pCat.includes('phone') || pName.includes('charger')
      }
      if (q.includes('aso') || q.includes('gele') || q.includes('textile') || q.includes('brocade')) {
        return pCat.includes('aso-oke') || pName.includes('aso-oke') || pName.includes('brocade')
      }
      if (q.includes('pot') || q.includes('pillow') || q.includes('home')) {
        return pCat.includes('home') || pName.includes('pot') || pName.includes('pillow')
      }
      if (q.includes('jewel') || q.includes('gold') || q.includes('earring')) {
        return pCat.includes('jewellery') || pName.includes('gold')
      }

      return pName.includes(q) || pCat.includes(q) || pSeller.includes(q)
    })

    if (matched.length > 0) {
      return {
        text: `Here is what our sellers have ready on the shelf right now:`,
        products: matched.slice(0, 3),
      }
    }

    // Default warm human response
    return {
      text: `Let me check with our sellers for "${query}". In the meantime, feel free to browse our main stalls or ask me about our popular categories like Fashion, Fresh Provisions, or Tech Accessories!`,
    }
  }

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || input).trim()
    if (!text) return

    setHasInteracted(true)
    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text,
      time: getTimestamp(),
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    // Simulate realistic human response delay (700-1100ms)
    setTimeout(() => {
      const response = generateShopperResponse(text)
      const shopperMsg: Message = {
        id: `s-${Date.now()}`,
        sender: 'shopper',
        text: response.text,
        time: getTimestamp(),
        products: response.products,
        action: response.action,
      }
      setMessages((prev) => [...prev, shopperMsg])
      setIsTyping(false)
    }, 850)
  }

  const submitOrderFromChat = (e: FormEvent) => {
    e.preventDefault()
    if (!orderForm.name || !orderForm.phone) return

    const code = `${MARKPLACE_PREFIX}-${Math.floor(10000 + Math.random() * 89999)}`
    setIsTyping(true)

    setTimeout(() => {
      setIsTyping(false)
      setOrderStep('confirmed')
      onOrdered(code)
      setMessages((prev) => [
        ...prev,
        {
          id: `s-confirm-${Date.now()}`,
          sender: 'shopper',
          text: `Awesome, ${orderForm.name}! I have booked this directly with the seller. Your order code is ${code}. The rider will call ${orderForm.phone} once picked up.`,
          time: getTimestamp(),
          orderCode: code,
          action: 'order-complete',
        },
      ])
    }, 900)
  }

  const MARKPLACE_PREFIX = MARKETPLACE_CONFIG.orderPrefix

  return (
    <>
      {/* Floating launcher button */}
      <div className="fixed bottom-5 right-4 z-40 sm:bottom-6 sm:right-6">
        <button
          onClick={onOpen}
          aria-label="Open Personal Shopper Desk"
          className="group flex items-center gap-3 rounded-full border border-ink bg-ink px-4 py-3 text-cream shadow-[4px_4px_0_#B39C4F] transition-all hover:bg-gold hover:text-ink active:translate-y-0.5"
        >
          <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-gold font-display text-sm font-bold text-ink group-hover:bg-ink group-hover:text-gold">
            A
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-ink bg-emerald-500" />
          </div>
          <div className="text-left leading-tight">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em]">
              Personal Shopper
            </p>
            <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-cream/70 group-hover:text-ink/80">
              Amaka · Online now
            </p>
          </div>
          {unreadCount > 0 && !isOpen && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-terra font-mono text-[10px] font-bold text-cream">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Slide-over Drawer / Panel */}
      <div
        className={`fixed inset-0 z-50 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        {/* Backdrop */}
        <div onClick={onClose} className="absolute inset-0 bg-ink/50 backdrop-blur-sm" />

        {/* Chat window */}
        <aside
          className={`absolute bottom-0 right-0 flex h-full w-full flex-col border-l border-ink/20 bg-cream text-ink shadow-2xl transition-transform duration-300 ease-[cubic-bezier(.33,1,.68,1)] sm:bottom-4 sm:right-4 sm:h-[620px] sm:w-[420px] sm:rounded-xl sm:border ${
            isOpen ? 'translate-x-0 sm:translate-y-0' : 'translate-x-full sm:translate-y-6'
          }`}
          role="dialog"
          aria-label="Personal Shopper Chat"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-ink/20 bg-ink px-4 py-3.5 text-cream sm:rounded-t-xl">
            <div className="flex items-center gap-3">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gold font-display text-base font-bold text-ink">
                A
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-ink bg-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-display text-[15px] font-semibold leading-none">
                    {MARKETPLACE_CONFIG.concierge.name}
                  </span>
                  <span className="rounded bg-gold/25 px-1.5 py-0.5 font-mono text-[8.5px] uppercase tracking-wider text-gold">
                    Concierge
                  </span>
                </div>
                <p className="mt-1 flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.16em] text-cream/70">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {MARKETPLACE_CONFIG.concierge.status}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <a
                href={MARKETPLACE_CONFIG.support.whatsapp}
                target="_blank"
                rel="noreferrer"
                title="Chat on WhatsApp"
                className="flex h-8 w-8 items-center justify-center rounded text-cream/70 transition-colors hover:text-gold"
              >
                <PhoneCall size={16} />
              </a>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded text-cream/70 transition-colors hover:text-cream"
                aria-label="Close chat"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Subheader info note */}
          <div className="flex items-center gap-2 border-b border-ink/15 bg-creamdeep px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink/70">
            <Sparkles size={12} className="text-golddeep shrink-0" />
            <span>Direct help with verified stock, sizes & same-day drop-off</span>
          </div>

          {/* Message List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3.5 py-2.5 text-[14px] leading-[1.6] ${
                    m.sender === 'user'
                      ? 'bg-ink text-cream'
                      : 'border border-ink/20 bg-white/80 text-ink shadow-sm'
                  }`}
                >
                  <p className="whitespace-pre-line">{m.text}</p>

                  {/* Render Product recommendations if any */}
                  {m.products && m.products.length > 0 && (
                    <div className="mt-3 space-y-2 border-t border-ink/15 pt-2.5">
                      {m.products.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center gap-2.5 rounded border border-ink/15 bg-cream p-2"
                        >
                          <img
                            src={p.image}
                            alt={p.name}
                            className="h-12 w-12 rounded object-cover border border-ink/10"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-display text-[13px] font-semibold truncate leading-tight">
                              {p.name}
                            </p>
                            <p className="font-mono text-[9px] text-ink/60 uppercase">
                              {p.seller} · {p.area}
                            </p>
                            <p className="font-mono text-[12px] font-bold text-ink mt-0.5">
                              {formatNaira(p.price)}
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              onAddToCart(p)
                              setMessages((prev) => [
                                ...prev,
                                {
                                  id: `sys-${Date.now()}`,
                                  sender: 'shopper',
                                  text: `Added "${p.name}" to your basket! Anything else you need?`,
                                  time: getTimestamp(),
                                },
                              ])
                            }}
                            className="flex h-8 items-center gap-1 rounded bg-ink px-2.5 font-mono text-[10px] font-bold text-cream uppercase tracking-wider hover:bg-gold hover:text-ink transition-colors"
                          >
                            <Plus size={12} />
                            Add
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Order form card */}
                  {m.action === 'order-prompt' && orderStep !== 'confirmed' && (
                    <form
                      onSubmit={submitOrderFromChat}
                      className="mt-3 space-y-2 rounded border border-ink/20 bg-cream p-3"
                    >
                      <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink/80">
                        Quick Delivery Details
                      </p>
                      <input
                        type="text"
                        placeholder="Your Full Name"
                        required
                        value={orderForm.name}
                        onChange={(e) => setOrderForm({ ...orderForm, name: e.target.value })}
                        className="w-full rounded border border-ink/30 bg-white px-2.5 py-1.5 text-xs font-mono"
                      />
                      <input
                        type="tel"
                        placeholder="Phone Number (e.g. 08012345678)"
                        required
                        value={orderForm.phone}
                        onChange={(e) => setOrderForm({ ...orderForm, phone: e.target.value })}
                        className="w-full rounded border border-ink/30 bg-white px-2.5 py-1.5 text-xs font-mono"
                      />
                      <input
                        type="text"
                        placeholder="Delivery Address / Landmark"
                        required
                        value={orderForm.address}
                        onChange={(e) => setOrderForm({ ...orderForm, address: e.target.value })}
                        className="w-full rounded border border-ink/30 bg-white px-2.5 py-1.5 text-xs font-mono"
                      />
                      <button
                        type="submit"
                        className="mt-1 flex w-full items-center justify-center gap-1.5 rounded bg-gold py-2 font-mono text-[11px] font-bold uppercase tracking-wider text-ink hover:bg-ink hover:text-cream transition-colors"
                      >
                        Confirm Order Now
                        <ArrowRight size={13} />
                      </button>
                    </form>
                  )}

                  {/* Order tracking link */}
                  {m.orderCode && (
                    <div className="mt-2.5 flex items-center justify-between rounded border border-gold/60 bg-gold/15 p-2 font-mono text-[11px]">
                      <span className="font-bold text-ink">Code: {m.orderCode}</span>
                      <a
                        href="#track"
                        onClick={onClose}
                        className="underline font-bold text-ink hover:text-golddeep"
                      >
                        Track status →
                      </a>
                    </div>
                  )}
                </div>
                <span className="mt-1 px-1 font-mono text-[9px] uppercase tracking-wider text-ink/40">
                  {m.time}
                </span>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 text-ink/60">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gold/50 font-display text-xs">
                  A
                </div>
                <div className="flex items-center gap-1 rounded-lg border border-ink/15 bg-white px-3 py-2 text-xs font-mono text-ink/60 shadow-sm">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-ink/40 animate-bounce" />
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-full bg-ink/40 animate-bounce"
                    style={{ animationDelay: '150ms' }}
                  />
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-full bg-ink/40 animate-bounce"
                    style={{ animationDelay: '300ms' }}
                  />
                  <span className="ml-1 text-[10px] uppercase tracking-wider">
                    Amaka is checking stalls...
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestions chips */}
          {!hasInteracted && (
            <div className="border-t border-ink/15 bg-cream px-3 py-2">
              <p className="font-mono text-[9px] uppercase tracking-wider text-ink/50 mb-1.5">
                Quick requests:
              </p>
              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {QUICK_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    onClick={() => handleSend(chip)}
                    className="shrink-0 rounded-full border border-ink/30 bg-white px-2.5 py-1 font-mono text-[10px] text-ink/80 hover:border-ink hover:bg-ink hover:text-cream transition-colors"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input field */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
            className="flex items-center gap-2 border-t border-ink/20 bg-white p-3 sm:rounded-b-xl"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Amaka about products, sizes, prices..."
              className="flex-1 bg-transparent px-2 py-1.5 font-eczar text-[15px] text-ink placeholder:text-ink/40 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-cream transition-colors hover:bg-gold hover:text-ink disabled:opacity-40"
              aria-label="Send message"
            >
              <Send size={15} />
            </button>
          </form>
        </aside>
      </div>
    </>
  )
}
