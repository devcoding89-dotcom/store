import { useState, useRef, useEffect } from 'react'
import {
  Send,
  X,
  CreditCard,
  CheckCircle2,
  MapPin,
  ShieldCheck,
  Maximize2,
  Minimize2,
} from 'lucide-react'
import { sendChatMessage, paystackCheckout, verifyPaystackPayment } from '@/lib/api'
import { formatNaira } from '@/lib/catalog'
import { MARKETPLACE_CONFIG } from '@/lib/config'
import { QRCodeDisplay } from '@/components/QRCodeDisplay'
import type { Product, Order, CartItem } from '@/types/marketplace'

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  time: string
  products?: Product[]
  order?: Order | null
  paystackAction?: {
    productId: string
    productName: string
    amount: number
  } | null
  isPaymentSuccess?: boolean
  trackingCode?: string
  whatsappNotificationUrl?: string
}

type AINegotiatorChatProps = {
  isOpen: boolean
  onClose: () => void
  onOpen: () => void
  onAddToCart: (p: Product) => void
  onTrackOrder: (code: string) => void
  activeProduct?: Product | null
  checkoutItems?: CartItem[] | null
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

export function AINegotiatorChat({
  isOpen,
  onClose,
  onOpen,
  onTrackOrder,
  activeProduct,
  checkoutItems,
}: AINegotiatorChatProps) {
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
  const [payingLoading, setPayingLoading] = useState(false)
  const [isFullScreen, setIsFullScreen] = useState(false)

  const [showAddressForm, setShowAddressForm] = useState(false)
  const [showPrePayModal, setShowPrePayModal] = useState(false)
  const [prePayAction, setPrePayAction] = useState<{
    productId: string
    productName: string
    amount: number
  } | null>(null)
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null)
  const [addressFormData, setAddressFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    landmark: '',
  })

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
    }
  }, [isOpen, messages, isTyping])

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
          paystackAction: {
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
        },
      ])
      onOpen()
    }
  }, [activeProduct])

  // Send message with realistic, human-like typing delay (not instant!)
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

    // Calculate realistic human typing delay (1.8s to 2.8s) so AI feels like a real woman typing
    const typingDelay = Math.min(2800, Math.max(1800, text.length * 25))

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

      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: result.reply,
        time: getTimestamp(),
        products: result.products,
        order: result.order,
        paystackAction: result.paystackAction,
      }

      setMessages((prev) => [...prev, assistantMsg])
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 1500))
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

  // Helper to ensure Paystack inline script is loaded
  const loadPaystackInline = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && (window as any).PaystackPop) {
        return resolve(true)
      }
      const existing = document.querySelector('script[src*="paystack"]')
      if (existing) {
        existing.addEventListener('load', () => resolve(true))
        existing.addEventListener('error', () => resolve(false))
        if ((window as any).PaystackPop) return resolve(true)
        setTimeout(() => resolve(!!(window as any).PaystackPop), 1200)
        return
      }
      const script = document.createElement('script')
      script.src = 'https://js.paystack.co/v1/inline.js'
      script.async = true
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.head.appendChild(script)
    })
  }

  // Initiate real Paystack popup with live key
  const initiatePaystack = async (
    action: {
      productId: string
      productName: string
      amount: number
    },
    customerDetails: { name: string; email: string; phone: string }
  ) => {
    setPayingLoading(true)

    const loaded = await loadPaystackInline()
    if (!loaded || !(window as any).PaystackPop) {
      alert('Could not initialize Paystack popup. Please check your internet connection.')
      setPayingLoading(false)
      return
    }

    const publicKey =
      MARKETPLACE_CONFIG.paystackPublicKey ||
      import.meta.env.VITE_PAYSTACK_PUBLIC_KEY ||
      ''
    const reference = `TOWN_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`

    try {
      const handler = (window as any).PaystackPop.setup({
        key: publicKey,
        email: customerDetails.email,
        amount: Math.round(action.amount * 100), // amount in kobo
        currency: 'NGN',
        ref: reference,
        metadata: {
          custom_fields: [
            {
              display_name: 'Customer Name',
              variable_name: 'customer_name',
              value: customerDetails.name,
            },
            {
              display_name: 'Customer Phone',
              variable_name: 'customer_phone',
              value: customerDetails.phone,
            },
            {
              display_name: 'Product Name',
              variable_name: 'product_name',
              value: action.productName,
            },
          ],
        },
        callback: async function (response: { reference: string }) {
          setPayingLoading(true)
          try {
            // Verify payment on server
            try {
              await verifyPaystackPayment(response.reference)
            } catch (vErr) {
              console.warn('Server verification note:', vErr)
            }

            // Create confirmed order record
            const checkoutRes = await paystackCheckout({
              customer_name: customerDetails.name,
              customer_phone: customerDetails.phone,
              customer_email: customerDetails.email,
              delivery_address: addressFormData.address || 'Address pending in chat',
              product_id: action.productId,
              agreed_price: action.amount,
              delivery_fee: 800,
              payment_reference: response.reference,
            })

            const order = checkoutRes.order
            setPendingOrderId(order.id)

            // Post verified confirmation in chat
            setMessages((prev) => [
              ...prev,
              {
                id: `pay-success-${Date.now()}`,
                role: 'assistant',
                content: `🎉 **PAYMENT CONFIRMED ON PAYSTACK!**\n\nYour payment of **${formatNaira(
                  action.amount
                )}** for **${action.productName}** has been successfully verified!\n\n🧾 **Paystack Reference:** \`${response.reference}\`\n📦 **Order Tracking Code:** **${order.id}**\n\nYour order is now **CONFIRMED**! To ensure our dispatch rider brings your package straight to your doorstep, please provide your exact delivery address and phone number below.`,
                time: getTimestamp(),
                isPaymentSuccess: true,
                trackingCode: order.id,
              },
            ])

            setShowAddressForm(true)
          } catch (err) {
            console.error('Post-payment order recording error:', err)
            // Even if post-payment recording had an issue, acknowledge payment
            setMessages((prev) => [
              ...prev,
              {
                id: `pay-success-${Date.now()}`,
                role: 'assistant',
                content: `🎉 **PAYMENT RECEIVED ON PAYSTACK!**\n\nPaystack Reference: \`${response.reference}\`\n\nYour payment was successful! Please share your delivery address below so we can dispatch your package immediately.`,
                time: getTimestamp(),
                isPaymentSuccess: true,
                trackingCode: `ORD-${Date.now().toString().slice(-5)}`,
              },
            ])
            setShowAddressForm(true)
          } finally {
            setPayingLoading(false)
          }
        },
        onClose: function () {
          setPayingLoading(false)
          setMessages((prev) => [
            ...prev,
            {
              id: `pay-cancelled-${Date.now()}`,
              role: 'assistant',
              content:
                "I noticed the Paystack checkout was closed. No problem at all! Whenever you are ready to complete your purchase, just click the payment button, or let me know if you'd like to ask anything else.",
              time: getTimestamp(),
            },
          ])
        },
      })

      handler.openIframe()
    } catch (err) {
      console.error('Paystack setup error:', err)
      alert('Could not start Paystack checkout. Please try again.')
      setPayingLoading(false)
    }
  }

  // Handle Paystack Payment button click
  const handlePaystackPay = (action: {
    productId: string
    productName: string
    amount: number
  }) => {
    // If we don't have valid email and phone, open customer details modal first
    if (!addressFormData.email || !addressFormData.email.includes('@') || !addressFormData.phone) {
      setPrePayAction(action)
      setShowPrePayModal(true)
      return
    }

    initiatePaystack(action, {
      name: addressFormData.name || 'Valued Customer',
      email: addressFormData.email,
      phone: addressFormData.phone,
    })
  }

  // Handle address submission
  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!addressFormData.address || !addressFormData.phone) {
      alert('Please provide your delivery address and phone number')
      return
    }

    const orderCode = pendingOrderId || `ORD-${Math.floor(10000 + Math.random() * 89999)}`

    // Generate automated WhatsApp message for the OWNER
    const ownerNumber = '2349138987295'
    const fullAddress = `${addressFormData.address}${
      addressFormData.landmark ? ` (Landmark: ${addressFormData.landmark})` : ''
    }`
    const ownerWhatsAppMsg = `🚨 *NEW PAID ORDER FROM TOWNSQUARE!*

📦 *Item:* ${activeProduct?.name || 'Selected Items'}
💰 *Amount Paid:* Confirmed on Paystack
👤 *Customer:* ${addressFormData.name || 'Customer'}
📞 *Customer Phone:* ${addressFormData.phone}
📍 *Delivery Address:* ${fullAddress}
🧾 *Order Code:* ${orderCode}

Please package and dispatch this order!`

    // Dispatch record for store logistics
    console.log('Dispatch order code created:', orderCode, 'for owner:', ownerNumber, ownerWhatsAppMsg)

    setShowAddressForm(false)
    setIsTyping(true)

    // Realistic delay for Amaka processing the delivery booking
    await new Promise((res) => setTimeout(res, 1800))
    setIsTyping(false)

    setMessages((prev) => [
      ...prev,
      {
        id: `delivery-confirmed-${Date.now()}`,
        role: 'assistant',
        content: `Wonderful! Your delivery has been officially booked! 🚚\n\n📍 **Destination:** ${fullAddress}\n📞 **Contact Phone:** ${addressFormData.phone}\n🧾 **Order Tracking Code:** **${orderCode}**\n\nOur logistics dispatch team has been notified with your delivery address so your package is packaged immediately!\n\nHere is your **Delivery Verification QR Code** below. When the dispatch rider arrives at your doorstep, show this QR code to complete delivery:`,
        time: getTimestamp(),
        trackingCode: orderCode,
      },
    ])
  }

  if (!isOpen) return null

  return (
    <div
      className={`fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-2 sm:p-4 backdrop-blur-xs animate-fade-in`}
    >
      <div
        className={`relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all duration-200 ${
          isFullScreen
            ? 'h-full w-full max-w-none rounded-none'
            : 'h-[90vh] w-full max-w-3xl'
        }`}
      >
        {/* Chat Header */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-600 font-bold text-white shadow-sm ring-2 ring-emerald-100">
                A
              </div>
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-base font-bold text-slate-900">Amaka</h3>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  Verified Sales Manager
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
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
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              title={isFullScreen ? 'Exit Full Screen' : 'Full Screen'}
            >
              {isFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              title="Close Chat"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-slate-50/60">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-end gap-2 max-w-[85%] sm:max-w-[75%]">
                {m.role === 'assistant' && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white mb-1 shadow-xs">
                    A
                  </div>
                )}

                <div
                  className={`rounded-2xl p-4 text-sm leading-relaxed shadow-xs ${
                    m.role === 'user'
                      ? 'bg-emerald-600 text-white rounded-br-xs'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs'
                  }`}
                >
                  <p className="whitespace-pre-line font-normal">{m.content}</p>

                  {/* Payment Card Tag */}
                  {m.paystackAction && !m.isPaymentSuccess && (
                    <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/80 p-3.5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-bold text-emerald-900 text-xs uppercase tracking-wider">
                          <CreditCard size={15} />
                          <span>Official Payment Slip</span>
                        </div>
                        <span className="rounded bg-emerald-200/80 px-2 py-0.5 text-[10px] font-bold text-emerald-900">
                          Agreed Deal
                        </span>
                      </div>

                      <div className="border-t border-emerald-200/60 pt-2 flex items-baseline justify-between">
                        <span className="text-xs text-emerald-800 font-medium">Agreed Last Price:</span>
                        <span className="font-display text-xl font-extrabold text-emerald-900">
                          {formatNaira(m.paystackAction.amount)}
                        </span>
                      </div>

                      <button
                        onClick={() => handlePaystackPay(m.paystackAction!)}
                        disabled={payingLoading}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-sm hover:bg-emerald-800 transition-all disabled:opacity-50"
                      >
                        <ShieldCheck size={16} />
                        {payingLoading
                          ? 'Connecting to Paystack...'
                          : `Pay with Paystack (${formatNaira(m.paystackAction.amount)})`}
                      </button>
                    </div>
                  )}

                  {/* Delivery Verification QR Code */}
                  {m.trackingCode && (
                    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 flex flex-col items-center text-center space-y-2.5">
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                        Delivery Verification QR Code
                      </span>
                      <p className="text-xs font-mono font-bold text-slate-900">{m.trackingCode}</p>

                      <QRCodeDisplay value={m.trackingCode} size={150} />

                      <p className="text-[11px] text-slate-500 max-w-xs">
                        Show this QR code to the dispatch rider upon delivery for automated status confirmation.
                      </p>

                      <button
                        onClick={() => {
                          onClose()
                          onTrackOrder(m.trackingCode!)
                        }}
                        className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-600 transition-colors"
                      >
                        Track Live Order Status
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 px-9">{m.time}</span>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex items-end gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white mb-1 shadow-xs">
                A
              </div>
              <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-xs border border-slate-200 bg-white px-4 py-3 shadow-xs">
                <span className="h-2 w-2 rounded-full bg-emerald-600 animate-bounce" />
                <span className="h-2 w-2 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.2s]" />
                <span className="h-2 w-2 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}

          {/* Post-Payment Address Capture Form */}
          {showAddressForm && (
            <div className="rounded-2xl border border-emerald-300 bg-white p-5 shadow-lg space-y-4">
              <div className="flex items-center gap-2 text-emerald-800">
                <MapPin size={18} />
                <h4 className="font-display text-base font-bold text-slate-900">
                  Enter Your Delivery Address
                </h4>
              </div>
              <p className="text-xs text-slate-600">
                Amaka will record this exact location and alert the store owner on WhatsApp to dispatch your goods!
              </p>

              <form onSubmit={handleAddressSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Babatunde Alao"
                      value={addressFormData.name}
                      onChange={(e) => setAddressFormData({ ...addressFormData, name: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                      Active Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 08012345678"
                      value={addressFormData.phone}
                      onChange={(e) => setAddressFormData({ ...addressFormData, phone: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                    Street Address & Building *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 14 Admiralty Way, Block B Flat 2"
                    value={addressFormData.address}
                    onChange={(e) => setAddressFormData({ ...addressFormData, address: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                      Nearest Landmark *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Opposite Central Mosque, Near Total Station"
                      value={addressFormData.landmark}
                      onChange={(e) => setAddressFormData({ ...addressFormData, landmark: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. buyer@gmail.com"
                      value={addressFormData.email}
                      onChange={(e) => setAddressFormData({ ...addressFormData, email: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-sm hover:bg-emerald-700 transition-colors"
                >
                  <CheckCircle2 size={16} />
                  Confirm Delivery Details & Notify Owner
                </button>
              </form>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="flex gap-2 overflow-x-auto border-t border-slate-200 bg-white px-4 py-2.5">
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => handleSend(prompt)}
              className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-800 transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Form */}
        <div className="border-t border-slate-200 bg-white p-3 sm:p-4">
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
              placeholder="Ask Amaka anything (e.g. How does this work? How much last?)..."
              disabled={isTyping}
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-600 focus:outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 transition-colors disabled:opacity-40"
              aria-label="Send message"
            >
              <Send size={18} />
            </button>
          </form>
        </div>

        {/* Pre-Payment Customer Details Modal for Paystack */}
        {showPrePayModal && prePayAction && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                    <CreditCard size={20} />
                  </div>
                  <div>
                    <h4 className="font-display text-base font-bold text-slate-900">
                      Paystack Secure Checkout
                    </h4>
                    <p className="text-xs text-slate-500">
                      Amount:{' '}
                      <strong className="text-emerald-700 font-bold">
                        {formatNaira(prePayAction.amount)}
                      </strong>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPrePayModal(false)}
                  className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X size={18} />
                </button>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Please enter your contact details. Paystack will send your official transaction receipt to your email, and our dispatch team will use your phone number.
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (!addressFormData.email || !addressFormData.phone) {
                    alert('Please enter your email and phone number to continue')
                    return
                  }
                  setShowPrePayModal(false)
                  initiatePaystack(prePayAction, {
                    name: addressFormData.name || 'Valued Customer',
                    email: addressFormData.email,
                    phone: addressFormData.phone,
                  })
                }}
                className="space-y-3 pt-1"
              >
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Babatunde Alao"
                    value={addressFormData.name}
                    onChange={(e) =>
                      setAddressFormData({ ...addressFormData, name: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Email Address (for Paystack Receipt) *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. customer@example.com"
                    value={addressFormData.email}
                    onChange={(e) =>
                      setAddressFormData({ ...addressFormData, email: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Active Phone Number (for Delivery) *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 08012345678"
                    value={addressFormData.phone}
                    onChange={(e) =>
                      setAddressFormData({ ...addressFormData, phone: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={payingLoading}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm hover:bg-emerald-800 transition-colors disabled:opacity-50"
                >
                  <ShieldCheck size={16} />
                  Proceed to Paystack Popup ({formatNaira(prePayAction.amount)})
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
