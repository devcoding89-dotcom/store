import { type ReactNode, useState, useRef, useEffect } from 'react'
import {
  Send,
  X,
  ShoppingBag,
  MapPin,
  MessageCircle,
  Maximize2,
  Minimize2,
  User,
  Phone,
  ArrowRight,
  ExternalLink,
} from 'lucide-react'
import { createOrder, sendChatMessage } from '@/lib/api'
import { formatNaira } from '@/lib/catalog'
import { MARKETPLACE_CONFIG } from '@/lib/config'
import { QRCodeDisplay } from '@/components/QRCodeDisplay'
import { Link } from 'react-router'
import type { Product, Order, CartItem, User as AppUser } from '@/types/marketplace'

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  time: string
  products?: Product[]
  order?: Order | null
  payAction?: {
    productId: string
    productName: string
    amount: number
  } | null
  isOrderPlaced?: boolean
  trackingCode?: string
  whatsappUrl?: string
}

type AINegotiatorChatProps = {
  isOpen: boolean
  onClose: () => void
  onOpen: () => void
  onAddToCart: (p: Product) => void
  onTrackOrder: (code: string) => void
  activeProduct?: Product | null
  checkoutItems?: CartItem[] | null
  currentUser: AppUser
}

const QUICK_PROMPTS = [
  'How does this work? (Specifications)',
  'How much is your last price?',
  'Can you reduce this price for me?',
  'I want to pay now',
  'What is delivery fee to my location?',
]

function getTimestamp() {
  const d = new Date()
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function renderMessageContent(content: string) {
  const linkPattern = /\[([^\]]+)\]\((\/(?:faq|returns|terms|marketplace(?:#track)?))\)/g
  const parts: ReactNode[] = []
  let previousIndex = 0

  for (const match of content.matchAll(linkPattern)) {
    const [markdown, label, to] = match
    const index = match.index ?? 0
    if (index > previousIndex) parts.push(content.slice(previousIndex, index))
    parts.push(
      <Link key={`${to}-${index}`} to={to} className="font-semibold text-emerald-700 underline underline-offset-2 hover:text-emerald-900">
        {label}
      </Link>,
    )
    previousIndex = index + markdown.length
  }

  if (previousIndex < content.length) parts.push(content.slice(previousIndex))
  return parts
}

export function AINegotiatorChat({
  isOpen,
  onClose,
  onOpen,
  onTrackOrder,
  activeProduct,
  checkoutItems,
  currentUser,
}: AINegotiatorChatProps) {
  const ownerWhatsApp = (MARKETPLACE_CONFIG.ownerWhatsApp || '2349138987295').replace(/\D/g, '')

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-welcome',
      role: 'assistant',
      content:
        "Hi! How are you doing today? Hope everything is moving well with you! 😊\n\nMy name is Amaka, your personal shopping assistant here at TownSquare. Tell me what product you're looking for, or let's discuss any item you have in mind. How can I help you today?",
      time: getTimestamp(),
    },
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isFullScreen, setIsFullScreen] = useState(false)

  // Checkout form modal state
  const [showCheckoutForm, setShowCheckoutForm] = useState(false)
  const [formError, setFormError] = useState('')
  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false)
  const [checkoutAction, setCheckoutAction] = useState<{
    productId: string
    productName: string
    amount: number
  } | null>(null)
  const [checkoutFormData, setCheckoutFormData] = useState({
    name: '',
    address: '',
    whatsapp: '',
  })

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
    }
  }, [isOpen, messages, isTyping])

  // Focus on name input when checkout form opens
  useEffect(() => {
    if (showCheckoutForm) {
      setTimeout(() => {
        nameInputRef.current?.focus()
      }, 100)
    }
  }, [showCheckoutForm])

  // Handle Cart Checkout trigger
  useEffect(() => {
    if (checkoutItems && checkoutItems.length > 0 && isOpen) {
      const itemsList = checkoutItems.map((i) => `${i.product.name} (x${i.qty})`).join(', ')
      const subtotal = checkoutItems.reduce((sum, i) => sum + i.product.listing_price * i.qty, 0)
      const primaryProduct = checkoutItems[0].product

      setMessages([
        {
          id: `msg-cart-${Date.now()}`,
          role: 'assistant',
          content: `Welcome to checkout! 😊\n\nI have your order ready for **${itemsList}** (Total: **${formatNaira(
            subtotal
          )}**).\n\nWould you like me to walk you through the specifications and how the items work, or would you like to discuss a sweet last price before we lock it in?`,
          time: getTimestamp(),
          products: checkoutItems.map((i) => i.product),
          payAction: {
            productId: primaryProduct.id,
            productName: itemsList,
            amount: subtotal,
          },
        },
      ])
      onOpen()
    }
  }, [checkoutItems])

  // Handle Single Product Negotiate trigger
  useEffect(() => {
    if (activeProduct && isOpen) {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-item-${Date.now()}`,
          role: 'assistant',
          content: `Hi! How are you doing? 😊\n\nI see you're interested in the **${activeProduct.name}** (Listed at ${formatNaira(
            activeProduct.listing_price
          )})!\n\n${
            activeProduct.features && activeProduct.features.length > 0
              ? `Key Specs: ${activeProduct.features.slice(0, 3).join(' · ')}\n\n`
              : ''
          }Would you like to ask how it works, or make an offer on our last price? Tell me what price works for your budget!`,
          time: getTimestamp(),
          products: [activeProduct],
          payAction: {
            productId: activeProduct.id,
            productName: activeProduct.name,
            amount: activeProduct.floor_price || activeProduct.listing_price,
          },
        },
      ])
      onOpen()
    }
  }, [activeProduct])

  // Send message with realistic, human-like typing delay
  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim()
    if (!text || isTyping) return

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      time: getTimestamp(),
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    // Check if user is asking to pay right now
    const lowerText = text.toLowerCase()
    const isPaymentIntent =
      lowerText.includes('pay') ||
      lowerText.includes('checkout') ||
      lowerText.includes('buy now') ||
      lowerText.includes('order now') ||
      lowerText.includes('i want to order')

    // Typing delay between 1.4s to 2.2s
    const typingDelay = Math.min(2200, Math.max(1400, text.length * 20))

    try {
      const historyPayload = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }))

      const targetProdId = activeProduct?.id || checkoutItems?.[0]?.product.id

      const [result] = await Promise.all([
        sendChatMessage(text, historyPayload, targetProdId),
        new Promise((resolve) => setTimeout(resolve, typingDelay)),
      ])

      // Fallback payAction if payment intent detected and none returned
      let effectivePayAction = result.payAction || (result as Record<string, unknown>).paystackAction
      if (!effectivePayAction && isPaymentIntent) {
        const prod = activeProduct || (result.products && result.products[0]) || checkoutItems?.[0]?.product
        if (prod) {
          effectivePayAction = {
            productId: prod.id,
            productName: prod.name,
            amount: prod.floor_price || prod.listing_price,
          }
        }
      }

      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: result.reply,
        time: getTimestamp(),
        products: result.products,
        order: result.order,
        payAction: effectivePayAction as Message['payAction'],
      }

      setMessages((prev) => [...prev, assistantMsg])
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 1200))
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content:
            "Network hiccup for a small second! But don't worry, I am here. Tell me what you'd like to inspect or order!",
          time: getTimestamp(),
        },
      ])
    } finally {
      setIsTyping(false)
    }
  }

  // Handle "Pay Now" button click — shows the checkout form modal
  const handlePayNow = (action: {
    productId: string
    productName: string
    amount: number
  }) => {
    setCheckoutAction(action)
    setFormError('')
    setShowCheckoutForm(true)
  }

  // Save the order first so the tracking code points to a real order.
  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const name = checkoutFormData.name.trim()
    const address = checkoutFormData.address.trim()
    const whatsapp = checkoutFormData.whatsapp.trim()

    if (!name || !address || !whatsapp) {
      setFormError('Please fill in your name, delivery address, and WhatsApp number.')
      return
    }

    const itemName = checkoutAction?.productName || activeProduct?.name || 'Selected Items'
    const productId = checkoutAction?.productId || activeProduct?.id || checkoutItems?.[0]?.product.id
    const amount = checkoutAction?.amount ?? (
      checkoutItems?.reduce((sum, item) => sum + item.product.listing_price * item.qty, 0)
      ?? activeProduct?.listing_price
      ?? 0
    )
    if (!productId || amount <= 0) {
      setFormError('We could not identify the product or price. Please close checkout and try again.')
      return
    }

    const agreedAmount = formatNaira(amount)
    const isMobile =
      typeof window !== 'undefined' &&
      /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    const whatsappTab = isMobile ? null : window.open('about:blank', '_blank')
    setCheckoutSubmitting(true)
    setFormError('')

    try {
      const order = await createOrder({
        customer_id: currentUser.id,
        customer_name: name,
        customer_phone: whatsapp,
        customer_email: currentUser.email,
        delivery_address: address,
        product_id: productId,
        product_name: itemName,
        agreed_price: amount,
        delivery_fee: 800,
      })
      const orderCode = order.id

      const whatsappMessage = `🛒 *NEW ORDER FROM TOWNSQUARE!*

📦 *Item:* ${itemName}
💰 *Agreed Price:* ${agreedAmount}
👤 *Customer Name:* ${name}
📍 *Delivery Address:* ${address}
📞 *Customer WhatsApp:* ${whatsapp}
🧾 *Order Code:* ${orderCode}

💬 *Message:* Hello, I discussed this order with Amaka at TownSquare and would like to confirm it. Please confirm the details and arrange delivery to my address.`

      const whatsappUrl = `https://wa.me/${ownerWhatsApp}?text=${encodeURIComponent(whatsappMessage)}`

      setShowCheckoutForm(false)

      setMessages((prev) => [
        ...prev,
        {
          id: `checkout-${Date.now()}`,
          role: 'assistant',
          content: `✅ **Order saved!**\n\n📦 **Item:** ${itemName}\n💰 **Price:** ${agreedAmount}\n👤 **Name:** ${name}\n📍 **Address:** ${address}\n📞 **WhatsApp:** ${whatsapp}\n🧾 **Order Code:** \`${orderCode}\`\n\nYour order is saved and can now be tracked. Continue to WhatsApp to confirm the details with the TownSquare team.`,
          time: getTimestamp(),
          trackingCode: orderCode,
          whatsappUrl,
        },
      ])

      setCheckoutFormData({ name: '', address: '', whatsapp: '' })

      if (whatsappTab) {
        whatsappTab.location.href = whatsappUrl
      } else {
        window.location.assign(whatsappUrl)
      }
    } catch (err) {
      whatsappTab?.close()
      setFormError(err instanceof Error ? err.message : 'We could not save your order. Please try again.')
    } finally {
      setCheckoutSubmitting(false)
    }

  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs animate-fade-in"
    >
      <div
        className={`relative flex flex-col overflow-hidden bg-white shadow-2xl transition-all duration-200 ${
          isFullScreen
            ? 'h-[100dvh] w-full max-w-none rounded-none'
            : 'h-[100dvh] w-full sm:h-[90vh] sm:max-w-3xl sm:rounded-2xl sm:border sm:border-slate-200'
        }`}
      >
        {/* Chat Header */}
        <div className="flex h-14 sm:h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-3 sm:px-5">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative">
              <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-emerald-600 font-bold text-white shadow-sm ring-2 ring-emerald-100 text-sm sm:text-base">
                A
              </div>
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-emerald-500 ring-2 ring-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h3 className="font-display text-sm sm:text-base font-bold text-slate-900">Amaka</h3>
                <span className="rounded-full bg-emerald-100 px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-emerald-800">
                  Sales Desk
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
                {isTyping ? (
                  <span className="text-emerald-700 font-semibold animate-pulse">
                    Amaka is typing...
                  </span>
                ) : (
                  'Active now · TownSquare Concierge'
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="hidden sm:flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              title={isFullScreen ? 'Exit Full Screen' : 'Full Screen'}
            >
              {isFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors active:scale-95"
              title="Close Chat"
              aria-label="Close Chat"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-5 bg-slate-50/60 overscroll-contain">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-end gap-1.5 sm:gap-2 max-w-[92%] sm:max-w-[78%]">
                {m.role === 'assistant' && (
                  <div className="flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[10px] sm:text-xs font-bold text-white mb-1 shadow-xs">
                    A
                  </div>
                )}

                <div
                  className={`rounded-2xl p-3.5 sm:p-4 text-xs sm:text-sm leading-relaxed shadow-xs ${
                    m.role === 'user'
                      ? 'bg-emerald-600 text-white rounded-br-xs font-medium'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs'
                  }`}
                >
                  <p className="whitespace-pre-line font-normal">{renderMessageContent(m.content)}</p>

                  {/* Payment / Order Action Card */}
                  {m.payAction && !m.isOrderPlaced && (
                    <div className="mt-3 sm:mt-4 rounded-xl border-2 border-emerald-300 bg-emerald-50/90 p-3.5 sm:p-4 space-y-3 shadow-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-bold text-emerald-950 text-[11px] sm:text-xs uppercase tracking-wider">
                          <ShoppingBag size={14} className="text-emerald-700" />
                          <span>Agreed Deal Summary</span>
                        </div>
                        <span className="rounded-full bg-emerald-200/90 px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-emerald-900">
                          Ready to Order
                        </span>
                      </div>

                      <div className="border-t border-emerald-200/80 pt-2 flex items-baseline justify-between">
                        <span className="text-xs text-emerald-800 font-medium">Agreed Price:</span>
                        <span className="font-display text-xl sm:text-2xl font-extrabold text-emerald-900">
                          {formatNaira(m.payAction.amount)}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handlePayNow(m.payAction!)}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 sm:py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-emerald-900/10 hover:bg-emerald-700 active:scale-[0.98] transition-all"
                      >
                        <MessageCircle size={16} />
                        <span>👉 Click Here to Enter Name & Address</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  )}

                  {/* Direct WhatsApp link fallback button */}
                  {m.whatsappUrl && (
                    <a
                      href={m.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-emerald-700 transition-colors"
                    >
                      <MessageCircle size={16} />
                      <span>Open WhatsApp with Owner</span>
                      <ExternalLink size={14} />
                    </a>
                  )}

                  {/* Delivery Verification QR Code */}
                  {m.trackingCode && (
                    <div className="mt-3 sm:mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3.5 sm:p-4 flex flex-col items-center text-center space-y-2 sm:space-y-2.5">
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                        Order Tracking Code
                      </span>
                      <p className="text-sm font-mono font-bold text-slate-900 tracking-wider">
                        {m.trackingCode}
                      </p>

                      <QRCodeDisplay value={m.trackingCode} size={110} />

                      <p className="text-[10px] sm:text-[11px] text-slate-500 max-w-xs leading-normal">
                        Save this code to track your order dispatch and delivery status.
                      </p>

                      <button
                        onClick={() => {
                          onClose()
                          onTrackOrder(m.trackingCode!)
                        }}
                        className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-600 transition-colors active:scale-95"
                      >
                        Track Order Live
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <span className="text-[9px] sm:text-[10px] text-slate-400 mt-1 px-8 sm:px-9">{m.time}</span>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex items-end gap-1.5 sm:gap-2">
              <div className="flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[10px] sm:text-xs font-bold text-white mb-1 shadow-xs">
                A
              </div>
              <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-xs border border-slate-200 bg-white px-3.5 sm:px-4 py-2.5 sm:py-3 shadow-xs">
                <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-emerald-600 animate-bounce" />
                <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.2s]" />
                <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="flex gap-1.5 sm:gap-2 overflow-x-auto border-t border-slate-200 bg-white px-3 sm:px-4 py-2 sm:py-2.5 scrollbar-hide shrink-0">
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => handleSend(prompt)}
              className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-800 transition-colors active:scale-95"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Form — 16px font-size to prevent iOS Safari auto-zoom */}
        <div className="border-t border-slate-200 bg-white p-2.5 sm:p-4 shrink-0 pb-4 sm:pb-4">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Amaka anything (e.g. I want to pay)..."
              disabled={isTyping}
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 sm:px-4 py-2.5 sm:py-3 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-600 focus:outline-none transition-colors font-normal"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 transition-colors disabled:opacity-40 active:scale-95"
              aria-label="Send message"
            >
              <Send size={17} />
            </button>
          </form>
        </div>

        {/* Checkout Form Modal (WhatsApp Direct Redirect) */}
        {showCheckoutForm && checkoutAction && (
          <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-slate-900/60 p-0 sm:p-4 backdrop-blur-xs animate-fade-in">
            <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl border-t sm:border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90dvh] overflow-y-auto pb-8 sm:pb-6">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                    <ShoppingBag size={20} />
                  </div>
                  <div>
                    <h4 className="font-display text-base font-bold text-slate-900">
                      Enter Delivery Details
                    </h4>
                    <p className="text-xs text-slate-500">
                      {checkoutAction.productName} —{' '}
                      <strong className="text-emerald-700 font-bold">
                        {formatNaira(checkoutAction.amount)}
                      </strong>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCheckoutForm(false)}
                  className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Fill in your details below. We&apos;ll save your order and tracking code, then open WhatsApp so you can confirm with the TownSquare team.
              </p>

              {formError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-700 font-medium">
                  {formError}
                </div>
              )}

              <form onSubmit={handleCheckoutSubmit} className="space-y-3.5 pt-1">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    <span className="flex items-center gap-1.5">
                      <User size={13} className="text-emerald-600" />
                      Your Full Name *
                    </span>
                  </label>
                  <input
                    ref={nameInputRef}
                    type="text"
                    required
                    placeholder="e.g. Babatunde Alao"
                    value={checkoutFormData.name}
                    onChange={(e) =>
                      setCheckoutFormData({ ...checkoutFormData, name: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-600 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    <span className="flex items-center gap-1.5">
                      <MapPin size={13} className="text-emerald-600" />
                      Delivery Address *
                    </span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 14 Admiralty Way, Lekki Phase 1, Lagos"
                    value={checkoutFormData.address}
                    onChange={(e) =>
                      setCheckoutFormData({ ...checkoutFormData, address: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-600 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    <span className="flex items-center gap-1.5">
                      <Phone size={13} className="text-emerald-600" />
                      WhatsApp Phone Number *
                    </span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 08012345678"
                    value={checkoutFormData.whatsapp}
                    onChange={(e) =>
                      setCheckoutFormData({ ...checkoutFormData, whatsapp: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-600 focus:outline-none transition-colors"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={checkoutSubmitting}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 sm:py-4 text-xs sm:text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-emerald-900/10 hover:bg-emerald-700 active:scale-[0.98] transition-all"
                  >
                    <MessageCircle size={18} />
                    <span>{checkoutSubmitting ? 'Saving order...' : 'Save Order & Continue to WhatsApp'}</span>
                  </button>
                  <p className="mt-2 text-center text-[10px] text-slate-400">
                    Your order will be saved before WhatsApp opens.
                  </p>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
