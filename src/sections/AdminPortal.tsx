import { useState, useEffect, useRef } from 'react'
import {
  TrendingUp,
  Plus,
  Trash2,
  Edit3,
  RefreshCw,
  X,
  Upload,
  CheckCircle2,
  QrCode,
  Search,
  Check,
  Camera,
  CameraOff,
} from 'lucide-react'
import {
  fetchAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  fetchAdminOrders,
  updateOrderStatus,
  markOrderPaid,
  fetchAdminStats,
  confirmOrderDelivery,
} from '@/lib/api'
import { formatNaira } from '@/lib/catalog'
import { SignaturePad } from '@/components/SignaturePad'
import type { Product, Order, AdminStats } from '@/types/marketplace'

const DEFAULT_CATEGORIES = [
  'Power Banks',
  'Chargers',
  'Phones & Gadgets',
  'Accessories',
  'Books',
  'Electronics & Computers',
  'Fashion & Tailoring',
  'General',
]

type DetectedQrCode = { rawValue: string }
type QrDetector = { detect: (source: HTMLVideoElement) => Promise<DetectedQrCode[]> }
type QrDetectorConstructor = new (options: { formats: string[] }) => QrDetector

function getOrderCode(value: string) {
  const trimmedValue = value.trim()
  try {
    const url = new URL(trimmedValue)
    return (url.searchParams.get('code') || url.pathname.split('/').filter(Boolean).pop() || trimmedValue).toUpperCase()
  } catch {
    return trimmedValue.toUpperCase()
  }
}

export function AdminPortal({ onBackToShop }: { onBackToShop?: () => void }) {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'delivery'>('orders')
  const [loading, setLoading] = useState(true)
  const [orderFilter, setOrderFilter] = useState<string>('ALL')
  const [orderSearch, setOrderSearch] = useState('')
  const [loadError, setLoadError] = useState('')
  const [paymentUpdatingId, setPaymentUpdatingId] = useState<string | null>(null)
  const [vendorNotifyPreparedId, setVendorNotifyPreparedId] = useState<string | null>(null)
  const [vendorNotifyError, setVendorNotifyError] = useState('')
  const [vendorNotifyErrorId, setVendorNotifyErrorId] = useState<string | null>(null)

  // Add/Edit Product Modal State
  const [showProductModal, setShowProductModal] = useState(false)
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [isCustomCategory, setIsCustomCategory] = useState(false)

  const [formData, setFormData] = useState<{
    name: string
    category: string
    customCategory: string
    images: string[]
    description: string
    features: string[]
    vendor_cost: number
    listing_price: number
    floor_price: number
    vendor_name: string
    vendor_phone: string
    vendor_stall_location: string
  }>({
    name: '',
    category: 'Power Banks',
    customCategory: '',
    images: [],
    description: '',
    features: ['20,000mAh High Capacity', '22.5W Fast Charging', '6 Months Warranty'],
    vendor_cost: 6500,
    listing_price: 11500,
    floor_price: 9000,
    vendor_name: 'Central Gadget Hub',
    vendor_phone: '2349138987295',
    vendor_stall_location: 'Balogun Tech Plaza, Stall 14',
  })

  // Delivery Scanner State
  const [deliveryCodeInput, setDeliveryCodeInput] = useState('')
  const [scannedOrder, setScannedOrder] = useState<Order | null>(null)
  const [deliverySignature, setDeliverySignature] = useState('')
  const [deliveryConfirming, setDeliveryConfirming] = useState(false)
  const [deliverySuccessMessage, setDeliverySuccessMessage] = useState('')
  const [deliveryError, setDeliveryError] = useState('')
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)
  const cameraCleanupRef = useRef<(() => void) | null>(null)

  const loadData = async () => {
    setLoading(true)
    setLoadError('')
    try {
      const [s, p, o] = await Promise.all([
        fetchAdminStats(),
        fetchAdminProducts(),
        fetchAdminOrders(),
      ])
      setStats(s)
      setProducts(p)
      setOrders(o)
    } catch (err) {
      console.error('Failed to load admin data:', err)
      setLoadError('Could not load orders from the database. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => () => cameraCleanupRef.current?.(), [])
  useEffect(() => {
    if (activeTab !== 'delivery') cameraCleanupRef.current?.()
  }, [activeTab])

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await updateOrderStatus(orderId, newStatus)
      await loadData()
      return true
    } catch (err) {
      console.error('Failed to update order status:', err)
      setLoadError('The order status could not be saved. Please try again.')
      return false
    }
  }

  const handleConfirmPayment = async (orderId: string) => {
    setPaymentUpdatingId(orderId)
    setLoadError('')
    try {
      await markOrderPaid(orderId)
      await loadData()
    } catch (err) {
      console.error('Failed to confirm customer payment:', err)
      setLoadError('Payment confirmation could not be saved. Please try again.')
    } finally {
      setPaymentUpdatingId(null)
    }
  }

  const handleOpenVendorWhatsApp = (order: Order) => {
    const digits = (order.vendor_phone || '').replace(/\D/g, '')
    const phone =
      digits.startsWith('00') ? digits.slice(2)
      : digits.startsWith('0') && digits.length === 11 ? `234${digits.slice(1)}`
      : digits.length === 10 ? `234${digits}`
      : digits

    if (!phone || phone.length < 10 || phone.length > 15) {
      setVendorNotifyError(`Add a valid WhatsApp number for ${order.vendor_name} in the product details, then try again.`)
      setVendorNotifyErrorId(order.id)
      return
    }

    const message = `Hello, this is TownSquare order support. Please prepare "${order.product_name}" for pickup. Agreed supplier cost: ₦${order.vendor_cost.toLocaleString()}. Our dispatch team will arrange collection. Order reference: ${order.id}.`
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    const whatsappWindow = window.open(whatsappUrl, '_blank')

    if (!whatsappWindow) {
      setVendorNotifyError('Your browser blocked the WhatsApp window. Allow pop-ups for this site and try again.')
      setVendorNotifyErrorId(order.id)
      return
    }
    whatsappWindow.opener = null

    setVendorNotifyError('')
    setVendorNotifyErrorId(null)
    setVendorNotifyPreparedId(order.id)
  }

  const handleMarkVendorNotified = async (orderId: string) => {
    if (await handleStatusChange(orderId, 'VENDOR_NOTIFIED')) {
      setVendorNotifyPreparedId(null)
    }
  }

  const handleDeleteProduct = async (id: string) => {
    if (confirm('Are you sure you want to remove this product?')) {
      await deleteAdminProduct(id)
      loadData()
    }
  }

  // Open modal for adding a new product
  const handleOpenAddModal = () => {
    setEditingProductId(null)
    setIsCustomCategory(false)
    setFormData({
      name: '',
      category: 'Power Banks',
      customCategory: '',
      images: [],
      description: '',
      features: ['High durability build', 'Original Grade-A product', 'Same-day dispatch verified'],
      vendor_cost: 6500,
      listing_price: 11500,
      floor_price: 9000,
      vendor_name: 'Central Gadget Hub',
      vendor_phone: '2349138987295',
      vendor_stall_location: 'Central Plaza, Stall 14',
    })
    setShowProductModal(true)
  }

  // Open modal for editing an existing product
  const handleOpenEditModal = (p: Product) => {
    setEditingProductId(p.id)
    const isCustom = !DEFAULT_CATEGORIES.includes(p.category)
    setIsCustomCategory(isCustom)

    setFormData({
      name: p.name,
      category: isCustom ? 'custom' : p.category,
      customCategory: isCustom ? p.category : '',
      images: p.images && p.images.length > 0 ? p.images : p.image ? [p.image] : [],
      description: p.description || '',
      features: p.features && p.features.length > 0 ? p.features : ['Quality guaranteed'],
      vendor_cost: p.vendor_cost || Math.round(p.listing_price * 0.8),
      listing_price: p.listing_price,
      floor_price: p.floor_price || Math.round(p.listing_price * 0.9),
      vendor_name: p.vendor_name || 'Market Vendor',
      vendor_phone: p.vendor_phone || '2349138987295',
      vendor_stall_location: p.vendor_stall_location || 'Central Market',
    })
    setShowProductModal(true)
  }

  // Multi-image file upload handler (3-4 images from device)
  const handleImageFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const remainingSlots = 4 - formData.images.length
    if (remainingSlots <= 0) {
      alert('You can upload a maximum of 4 images per product.')
      return
    }

    const filesToRead = Array.from(files).slice(0, remainingSlots)

    filesToRead.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setFormData((prev) => ({
            ...prev,
            images: [...prev.images, event.target!.result as string].slice(0, 4),
          }))
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const handleRemoveImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== index),
    }))
  }

  // Sub-features / specifications handler
  const handleAddFeature = () => {
    setFormData((prev) => ({
      ...prev,
      features: [...prev.features, ''],
    }))
  }

  const handleUpdateFeature = (index: number, val: string) => {
    const updated = [...formData.features]
    updated[index] = val
    setFormData((prev) => ({ ...prev, features: updated }))
  }

  const handleRemoveFeature = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, idx) => idx !== index),
    }))
  }

  // Save product (Create or Edit)
  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.listing_price) {
      alert('Product name and listing price are required')
      return
    }

    const categoryName =
      formData.category === 'custom'
        ? formData.customCategory.trim() || 'General'
        : formData.category

    const primaryImage =
      formData.images.length > 0
        ? formData.images[0]
        : 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=700'

    const payload: Partial<Product> = {
      name: formData.name,
      category: categoryName,
      image: primaryImage,
      images: formData.images.length > 0 ? formData.images : [primaryImage],
      description: formData.description,
      features: formData.features.filter((f) => f.trim().length > 0),
      vendor_cost: Number(formData.vendor_cost),
      listing_price: Number(formData.listing_price),
      floor_price: Number(formData.floor_price),
      vendor_name: formData.vendor_name,
      vendor_phone: formData.vendor_phone,
      vendor_stall_location: formData.vendor_stall_location,
    }

    if (editingProductId) {
      await updateAdminProduct(editingProductId, payload)
    } else {
      await createAdminProduct(payload)
    }

    setShowProductModal(false)
    loadData()
  }

  // Lookup order for QR delivery
  const handleLookupOrderForDelivery = (value = deliveryCodeInput) => {
    const code = getOrderCode(value)
    if (!code) return

    const order = orders.find((o) => o.id === code)
    if (order) {
      setScannedOrder(order)
      setDeliverySuccessMessage('')
      setDeliveryError('')
    } else {
      setScannedOrder(null)
      setDeliveryError(`Order ${code} was not found. Check the code or refresh the order list.`)
    }
  }

  const startQrCamera = async () => {
    setCameraError('')
    const Detector = (window as Window & { BarcodeDetector?: QrDetectorConstructor }).BarcodeDetector
    if (!Detector) {
      setCameraError('Camera QR scanning is not supported in this browser. Enter the order code manually instead.')
      return
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera access is unavailable. Open this page over HTTPS or enter the code manually.')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } } })
      const video = videoRef.current
      if (!video) {
        stream.getTracks().forEach((track) => track.stop())
        setCameraError('The camera preview could not be started. Enter the code manually instead.')
        return
      }

      video.srcObject = stream
      await video.play()
      const detector = new Detector({ formats: ['qr_code'] })
      let animationFrame = 0
      let stopped = false
      const cleanup = () => {
        stopped = true
        cancelAnimationFrame(animationFrame)
        stream.getTracks().forEach((track) => track.stop())
        video.srcObject = null
        cameraCleanupRef.current = null
        setCameraActive(false)
      }
      cameraCleanupRef.current = cleanup
      setCameraActive(true)

      const scanFrame = async () => {
        if (stopped) return
        if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
          try {
            const [result] = await detector.detect(video)
            if (stopped) return
            if (result?.rawValue) {
              const code = getOrderCode(result.rawValue)
              setDeliveryCodeInput(code)
              cleanup()
              handleLookupOrderForDelivery(code)
              return
            }
          } catch (err) {
            console.error('QR camera scan failed:', err)
            setCameraError('The QR code could not be read. Try again or enter the order code manually.')
            cleanup()
            return
          }
        }
        animationFrame = requestAnimationFrame(scanFrame)
      }
      animationFrame = requestAnimationFrame(scanFrame)
    } catch (err) {
      console.error('Could not start QR camera:', err)
      setCameraError('Camera access was blocked. Allow camera permission or enter the code manually.')
    }
  }

  // Confirm delivery with signature
  const handleConfirmDeliveryWithSignature = async () => {
    if (!scannedOrder) return
    setDeliveryConfirming(true)
    setDeliveryError('')

    try {
      await confirmOrderDelivery(scannedOrder.id, deliverySignature || 'Confirmed by owner/rider', 'Store Owner')
      setDeliverySuccessMessage(`Order ${scannedOrder.id} successfully verified & marked as DELIVERED!`)
      setScannedOrder(null)
      setDeliveryCodeInput('')
      setDeliverySignature('')
      loadData()
    } catch (err) {
      console.error('Delivery confirmation error:', err)
      setDeliveryError('Delivery confirmation could not be saved. Please try again.')
    } finally {
      setDeliveryConfirming(false)
    }
  }

  const filteredOrders = orders.filter((order) => {
    const matchesStatus = orderFilter === 'ALL' || order.status === orderFilter
    const term = orderSearch.trim().toLowerCase()
    const matchesSearch =
      !term ||
      [order.id, order.customer_name, order.customer_phone, order.product_name]
        .some((value) => value?.toLowerCase().includes(term))
    return matchesStatus && matchesSearch
  })

  return (
    <div className="min-h-screen bg-white px-4 py-8 sm:px-8 lg:px-12 text-slate-900">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
              Admin Ops Center
            </span>
            <h1 className="font-display text-3xl font-bold text-slate-900 sm:text-4xl">
              Brokerage & Margin Center
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Real products · Multiple image gallery · Edit listings · QR Code delivery verification
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={onBackToShop}
            className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-600 transition-colors"
          >
            ← View Storefront
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Total Orders</p>
          <p className="mt-1 font-display text-3xl font-bold text-slate-900">{stats?.total_orders ?? 0}</p>
          <p className="mt-1 text-xs text-slate-400 font-mono">
            {stats?.pending_orders ?? 0} pending dispatch
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Gross Sales</p>
          <p className="mt-1 font-display text-3xl font-bold text-slate-900">
            {formatNaira(stats?.total_sales ?? 0)}
          </p>
          <p className="mt-1 text-xs text-slate-400 font-mono">Total customer payments</p>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              Net Broker Profit
            </p>
            <TrendingUp size={16} className="text-emerald-700" />
          </div>
          <p className="mt-1 font-display text-3xl font-bold text-emerald-800">
            +{formatNaira(stats?.total_net_profit ?? 0)}
          </p>
          <p className="mt-1 text-xs text-emerald-700/80 font-mono">
            Your pocket margin (Sales - Vendor Cost)
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Active Listings</p>
          <p className="mt-1 font-display text-3xl font-bold text-slate-900">{stats?.active_products ?? 0}</p>
          <p className="mt-1 text-xs text-slate-400 font-mono">In-stock at market stalls</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('orders')}
            className={`text-sm font-semibold pb-2 border-b-2 transition-colors ${
              activeTab === 'orders'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Live Customer Orders ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`text-sm font-semibold pb-2 border-b-2 transition-colors ${
              activeTab === 'products'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Product Catalog & Margins ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('delivery')}
            className={`flex items-center gap-1.5 text-sm font-semibold pb-2 border-b-2 transition-colors ${
              activeTab === 'delivery'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <QrCode size={15} />
            QR Delivery Scanner & Sign
          </button>
        </div>

        {activeTab === 'products' && (
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <Plus size={15} />
            Add New Product
          </button>
        )}
      </div>

      {loadError && (
        <div role="alert" className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <span>{loadError}</span>
          <button onClick={loadData} className="font-semibold underline">Retry</button>
        </div>
      )}

      {/* ─── ORDERS TAB ─── */}
      {activeTab === 'orders' && (
        <div className="mt-6">
          <label className="mb-4 flex max-w-xl items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-400">
            <Search size={16} />
            <input
              type="search"
              value={orderSearch}
              onChange={(event) => setOrderSearch(event.target.value)}
              placeholder="Search order code, customer, phone, or product"
              className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
            />
          </label>
          <div className="flex gap-2 pb-4 overflow-x-auto">
            {['ALL', 'PENDING', 'CONFIRMED', 'VENDOR_NOTIFIED', 'DISPATCHED', 'DELIVERED'].map(
              (st) => (
                <button
                  key={st}
                  onClick={() => setOrderFilter(st)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    orderFilter === st
                      ? 'bg-slate-900 text-white'
                      : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-400'
                  }`}
                >
                  {st.replace('_', ' ')}
                </button>
              )
            )}
          </div>

          <div className="space-y-4 mt-2">
            {filteredOrders.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                <p className="text-base text-slate-500">
                  {loading ? 'Loading orders from Supabase…' : 'No matching orders. Try another status or search term.'}
                </p>
              </div>
            ) : (
              filteredOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-slate-300"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-base font-bold text-slate-900">{ord.id}</span>
                        <span
                          className={`rounded px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${
                            ord.status === 'DELIVERED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ord.status === 'DISPATCHED'
                              ? 'bg-blue-100 text-blue-800'
                              : ord.status === 'VENDOR_NOTIFIED'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {ord.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="font-mono text-[11px] text-slate-400 mt-0.5">
                        Placed: {new Date(ord.created_at).toLocaleString()}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-mono text-lg font-bold text-slate-900">
                        {formatNaira(ord.total_amount)}
                      </p>
                      <p className={`mt-1 text-xs font-bold ${ord.payment_status?.toUpperCase() === 'PAID' ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {ord.payment_status?.toUpperCase() === 'PAID' ? '✓ PAID' : 'PAYMENT PENDING'}
                      </p>
                      <p className="font-mono text-xs text-emerald-700 font-bold">
                        Net Profit: +{formatNaira(ord.net_profit)}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 py-3 sm:grid-cols-3">
                    {/* Buyer Details */}
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Customer & Drop-off
                      </p>
                      <p className="text-sm font-semibold text-slate-900 mt-1">
                        {ord.customer_name}
                      </p>
                      <p className="font-mono text-xs text-slate-600">{ord.customer_phone}</p>
                      <p className="text-xs text-slate-600 mt-1 leading-snug">
                        📍 {ord.delivery_address}
                      </p>
                      {ord.delivery_signature && (
                        <p className="mt-1 text-xs font-semibold text-emerald-700">
                          ✓ Signed on Delivery
                        </p>
                      )}
                    </div>

                    {/* Product & Financials */}
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Product & Margin
                      </p>
                      <p className="text-sm font-semibold text-slate-900 mt-1">
                        {ord.product_name}
                      </p>
                      <p className="font-mono text-xs text-slate-600 mt-1">
                        Agreed Price: <span className="font-bold">{formatNaira(ord.agreed_price)}</span>
                      </p>
                      <p className="font-mono text-xs text-slate-600">
                        Vendor Cost:{' '}
                        <span className="text-red-600 font-bold">
                          -{formatNaira(ord.vendor_cost)}
                        </span>
                      </p>
                      <p className="font-mono text-xs text-slate-600">
                        Delivery Fare: {formatNaira(ord.delivery_fee)}
                      </p>
                    </div>

                    {/* Vendor Stall & Dispatch Action */}
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Fulfillment Partner
                      </p>
                      <p className="text-sm font-semibold text-slate-900 mt-1">
                        {ord.vendor_name}
                      </p>
                      <p className="font-mono text-xs text-slate-600">
                        Phone: {ord.vendor_phone || 'In Database'}
                      </p>

                      {vendorNotifyPreparedId === ord.id && (
                        <p className="mt-1 text-[11px] text-slate-500">
                          WhatsApp opens a draft. Press Send there, then return here to update the order.
                        </p>
                      )}
                      {vendorNotifyErrorId === ord.id && vendorNotifyError && (
                        <p role="alert" className="mt-2 text-xs text-red-700">{vendorNotifyError}</p>
                      )}
                    </div>
                  </div>

                  {/* Order Status Controller */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 mt-1">
                    <div className="flex items-center gap-2">
                      {ord.payment_status?.toUpperCase() !== 'PAID' && (
                        <button
                          onClick={() => handleConfirmPayment(ord.id)}
                          disabled={paymentUpdatingId === ord.id}
                          className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-50"
                        >
                          {paymentUpdatingId === ord.id ? 'Saving…' : 'Confirm payment received'}
                        </button>
                      )}
                      <span className="text-xs font-medium text-slate-500">Update Status:</span>
                      <button
                        onClick={() => vendorNotifyPreparedId === ord.id
                          ? handleMarkVendorNotified(ord.id)
                          : handleOpenVendorWhatsApp(ord)}
                        disabled={ord.status === 'VENDOR_NOTIFIED'}
                        className={`rounded-lg px-2.5 py-1 text-xs font-semibold border ${
                          ord.status === 'VENDOR_NOTIFIED'
                            ? 'bg-purple-600 text-white border-purple-600'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {ord.status === 'VENDOR_NOTIFIED'
                          ? 'Vendor Notified'
                          : vendorNotifyPreparedId === ord.id
                            ? 'I sent it — mark notified'
                            : 'Notify fulfillment partner'}
                      </button>
                      <button
                        onClick={() => handleStatusChange(ord.id, 'DISPATCHED')}
                        className={`rounded-lg px-2.5 py-1 text-xs font-semibold border ${
                          ord.status === 'DISPATCHED'
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        Rider Dispatched
                      </button>
                      <button
                        onClick={() => handleStatusChange(ord.id, 'DELIVERED')}
                        className={`rounded-lg px-2.5 py-1 text-xs font-semibold border ${
                          ord.status === 'DELIVERED'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        Delivered & Verified
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        setDeliveryCodeInput(ord.id)
                        setScannedOrder(ord)
                        setActiveTab('delivery')
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:underline"
                    >
                      <QrCode size={14} />
                      Verify via QR Code
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ─── PRODUCTS CATALOG TAB ─── */}
      {activeTab === 'products' && (
        <div className="mt-6">
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500">
                <tr>
                  <th className="p-3">Product (3-4 Images)</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Vendor Cost</th>
                  <th className="p-3">Listing Price</th>
                  <th className="p-3">Floor (Last) Price</th>
                  <th className="p-3">Potential Margin</th>
                  <th className="p-3">Vendor Stall</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => {
                  const maxMargin = p.listing_price - (p.vendor_cost || 0)
                  const minMargin = (p.floor_price || p.listing_price) - (p.vendor_cost || 0)
                  const imgCount = p.images?.length || 1

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-3 flex items-center gap-3">
                        <div className="relative">
                          <img
                            src={p.image}
                            alt={p.name}
                            className="h-12 w-12 rounded-lg object-cover border border-slate-200"
                          />
                          {imgCount > 1 && (
                            <span className="absolute -top-1 -right-1 rounded-full bg-slate-900 px-1.5 py-0.2 text-[9px] font-bold text-white">
                              {imgCount}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-display font-semibold text-sm leading-tight text-slate-900">
                            {p.name}
                          </p>
                          <p className="font-mono text-[10px] text-slate-400 uppercase">{p.id}</p>
                          {p.features && p.features.length > 0 && (
                            <p className="text-[11px] text-slate-500 truncate max-w-xs mt-0.5">
                              {p.features.join(' · ')}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                          {p.category}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-xs text-red-600 font-semibold">
                        {formatNaira(p.vendor_cost || 0)}
                      </td>
                      <td className="p-3 font-mono text-xs font-bold text-slate-900">
                        {formatNaira(p.listing_price)}
                      </td>
                      <td className="p-3 font-mono text-xs text-amber-700 font-semibold">
                        {formatNaira(p.floor_price || p.listing_price)}
                      </td>
                      <td className="p-3 font-mono text-xs text-emerald-700 font-bold">
                        +{formatNaira(minMargin)} – +{formatNaira(maxMargin)}
                      </td>
                      <td className="p-3">
                        <p className="text-xs font-semibold text-slate-800">{p.vendor_name}</p>
                        <p className="text-[11px] text-slate-400">{p.vendor_stall_location}</p>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditModal(p)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                            title="Edit Product"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete Product"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── QR DELIVERY SCANNER & SIGN TAB ─── */}
      {activeTab === 'delivery' && (
        <div className="mt-6 max-w-2xl mx-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <QrCode size={24} />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-slate-900">
                Delivery Verification & Signature
              </h2>
              <p className="text-xs text-slate-500">
                Scan or enter customer QR order code upon delivery to collect digital signature and auto-complete order.
              </p>
            </div>
          </div>

          {deliverySuccessMessage && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex items-center gap-2 text-emerald-800 text-sm font-semibold">
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
              <span>{deliverySuccessMessage}</span>
            </div>
          )}

          <div className="space-y-3">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className={`max-h-72 w-full rounded-xl bg-slate-950 object-contain ${cameraActive ? '' : 'hidden'}`}
            />
            {!cameraActive ? (
              <button
                onClick={startQrCamera}
                className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
              >
                <Camera size={17} />
                Open camera scanner
              </button>
            ) : (
              <button
                onClick={() => cameraCleanupRef.current?.()}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700"
              >
                <CameraOff size={16} />
                Stop camera
              </button>
            )}
            {cameraError && <p role="alert" className="text-sm text-amber-800">{cameraError}</p>}
          </div>

          {/* Lookup Input */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter Order Code (e.g. ORD-48291)..."
              value={deliveryCodeInput}
              onChange={(e) => setDeliveryCodeInput(e.target.value.toUpperCase())}
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-mono text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
            />
            <button
              onClick={() => handleLookupOrderForDelivery()}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors"
            >
              <Search size={15} />
              Find Order
            </button>
          </div>
          {deliveryError && (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {deliveryError}
            </p>
          )}

          {/* Order Details & Digital Signature */}
          {scannedOrder && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <span className="font-mono text-base font-bold text-slate-900">{scannedOrder.id}</span>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Customer: <span className="font-bold text-slate-800">{scannedOrder.customer_name}</span> ({scannedOrder.customer_phone})
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-base font-bold text-slate-900">
                    {formatNaira(scannedOrder.total_amount)}
                  </span>
                  <p className="text-[10px] font-bold uppercase text-emerald-700">
                    Status: {scannedOrder.status}
                  </p>
                </div>
              </div>

              <div className="text-xs text-slate-600 space-y-1">
                <p>
                  <strong>Package:</strong> {scannedOrder.product_name}
                </p>
                <p>
                  <strong>Destination:</strong> {scannedOrder.delivery_address}
                </p>
              </div>

              {/* Digital Signature Pad */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-2">
                  Customer Digital Signature / Confirmation
                </label>
                <SignaturePad onSave={(sig) => setDeliverySignature(sig)} />
              </div>

              <button
                onClick={handleConfirmDeliveryWithSignature}
                disabled={deliveryConfirming}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-sm hover:bg-emerald-700 transition-all disabled:opacity-50"
              >
                <Check size={16} />
                {deliveryConfirming
                  ? 'Confirming Delivery...'
                  : 'Confirm Delivery & Mark as Delivered'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ─── ADD / EDIT PRODUCT MODAL ─── */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h2 className="font-display text-2xl font-bold text-slate-900">
                  {editingProductId ? 'Edit Product & Margins' : 'Add New Marketplace Product'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Upload up to 4 images from your device, configure specifications, and set floor negotiation boundaries.
                </p>
              </div>
              <button
                onClick={() => setShowProductModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitProduct} className="mt-5 space-y-5">
              {/* Product Name */}
              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. 20,000mAh Ultra-Fast Power Bank"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                />
              </div>

              {/* Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => {
                      const val = e.target.value
                      setFormData({ ...formData, category: val })
                      setIsCustomCategory(val === 'custom')
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none font-medium"
                  >
                    {DEFAULT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    <option value="custom">➕ Create Custom Category...</option>
                  </select>
                </div>

                {isCustomCategory && (
                  <div>
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                      Custom Category Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Solar Generators"
                      value={formData.customCategory}
                      onChange={(e) => setFormData({ ...formData, customCategory: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none font-medium"
                    />
                  </div>
                )}
              </div>

              {/* 3 to 4 Multi-Image Upload from Device */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Product Images (Select 3 to 4 images from your device)
                  </label>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {formData.images.length}/4 uploaded
                  </span>
                </div>

                {/* Upload Button */}
                <div className="flex flex-col gap-3">
                  <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-4 text-center cursor-pointer hover:bg-slate-100/80 transition-colors">
                    <Upload size={22} className="text-emerald-600 mb-1" />
                    <span className="text-xs font-semibold text-slate-700">
                      Click to choose pictures from your device
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      Accepts PNG, JPG, WEBP (No video)
                    </span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageFiles}
                      className="hidden"
                    />
                  </label>

                  {/* Thumbnail Previews Grid */}
                  {formData.images.length > 0 && (
                    <div className="grid grid-cols-4 gap-2">
                      {formData.images.map((img, idx) => (
                        <div
                          key={idx}
                          className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100"
                        >
                          <img src={img} alt={`Product ${idx}`} className="h-full w-full object-cover" />
                          {idx === 0 && (
                            <span className="absolute bottom-1 left-1 rounded bg-slate-900/80 px-1 py-0.2 text-[8px] font-bold text-white uppercase">
                              Main
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white shadow-xs opacity-80 hover:opacity-100 transition-opacity"
                            title="Remove picture"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Sub-features / Attributes Builder */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Specifications & Attributes (AI discusses these with buyer)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddFeature}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline"
                  >
                    <Plus size={13} /> Add Specification
                  </button>
                </div>

                <div className="space-y-2">
                  {formData.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 shrink-0" />
                      <input
                        type="text"
                        value={feat}
                        onChange={(e) => handleUpdateFeature(idx, e.target.value)}
                        placeholder="e.g. 20,000mAh Battery Capacity, Dual USB-C 22.5W Fast Charging..."
                        className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(idx)}
                        className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                  Product Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed product info, condition, and usage..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none"
                />
              </div>

              {/* Pricing & AI Negotiation Boundaries */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                  💰 Broker Pricing & AI Negotiation Floor
                </p>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                      Vendor Cost (₦) *
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.vendor_cost}
                      onChange={(e) =>
                        setFormData({ ...formData, vendor_cost: Number(e.target.value) })
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white p-2 font-mono text-xs font-bold text-red-600"
                    />
                    <span className="text-[10px] text-slate-400 font-mono">You pay vendor</span>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                      Listing Price (₦) *
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.listing_price}
                      onChange={(e) =>
                        setFormData({ ...formData, listing_price: Number(e.target.value) })
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white p-2 font-mono text-xs font-bold text-slate-900"
                    />
                    <span className="text-[10px] text-slate-400 font-mono">Customer sees</span>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                      Floor Price (₦) *
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.floor_price}
                      onChange={(e) =>
                        setFormData({ ...formData, floor_price: Number(e.target.value) })
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white p-2 font-mono text-xs font-bold text-amber-700"
                    />
                    <span className="text-[10px] text-slate-400 font-mono">AI strict last price</span>
                  </div>
                </div>

                <div className="font-mono text-xs text-emerald-800 font-bold bg-white/80 p-2.5 rounded-lg border border-emerald-200/60">
                  Guaranteed Profit per Unit: +₦
                  {(formData.floor_price - formData.vendor_cost).toLocaleString()} to +₦
                  {(formData.listing_price - formData.vendor_cost).toLocaleString()}
                </div>
              </div>

              {/* Vendor Info */}
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  🏪 Market Vendor Info (For Dispatch & Pickup)
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Vendor / Shop Name"
                    required
                    value={formData.vendor_name}
                    onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-medium"
                  />
                  <input
                    type="tel"
                    placeholder="Vendor WhatsApp Phone (e.g. 2348012345678)"
                    required
                    value={formData.vendor_phone}
                    onChange={(e) => setFormData({ ...formData, vendor_phone: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-mono"
                  />
                </div>

                <input
                  type="text"
                  placeholder="Stall Number & Location (e.g. Line 4, Stall 12, Balogun Market)"
                  required
                  value={formData.vendor_stall_location}
                  onChange={(e) =>
                    setFormData({ ...formData, vendor_stall_location: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-medium"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm hover:bg-emerald-700 transition-colors"
                >
                  {editingProductId ? 'Save Changes' : 'Publish Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
