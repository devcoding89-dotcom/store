import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { supabase } from './supabase.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DB_FILE = path.join(__dirname, 'database.json')

// No fake products - only authentic products from Supabase & user creations
const INITIAL_PRODUCTS = []
const INITIAL_ORDERS = []

const INITIAL_USERS = [
  {
    id: 'admin-1',
    name: 'Marketplace Operations (You)',
    email: 'admin@townsquare.market',
    phone: '2349138583684',
    role: 'admin',
    password: 'admin',
    created_at: new Date().toISOString(),
  },
]

// Mock ids to prune from any previous local cache
const FAKE_PRODUCT_IDS = new Set([
  'prod-ankara-dress',
  'prod-aso-oke-gele',
  'prod-shea-butter',
  'prod-kilishi-beef',
  'prod-leather-sandals',
  'prod-fast-charger',
  'prod-smoked-catfish',
  'prod-perfume-oil',
  'prod-brocade-fabric',
  'prod-clay-pot',
  'prod-jewelry-set',
  'prod-throw-pillows',
  'ankara-maxi-dress',
  'aso-oke-gele',
  'raw-shea-butter',
  'clay-cooking-pot',
  'beef-kilishi',
  'leather-sandals',
])

function formatCategory(cat) {
  if (!cat) return 'General'
  const c = cat.toLowerCase().trim()
  if (c === 'phones' || c === 'phone') return 'Phones & Gadgets'
  if (c === 'accessories') return 'Accessories'
  if (c === 'powerbanks' || c === 'power bank') return 'Power Banks'
  if (c === 'chargers' || c === 'charger') return 'Chargers'
  if (c === 'books' || c === 'book') return 'Books'
  return cat.charAt(0).toUpperCase() + cat.slice(1)
}

function toDatabaseCategory(category) {
  const value = String(category || '').toLowerCase().trim()
  if (value.includes('phone')) return 'phones'
  if (value.includes('power')) return 'powerbanks'
  if (value.includes('charger')) return 'chargers'
  return 'accessories'
}

class Database {
  constructor() {
    this.data = {
      products: INITIAL_PRODUCTS,
      orders: INITIAL_ORDERS,
      users: INITIAL_USERS,
      settings: {
        store_name: 'TownSquare Brokerage Marketplace',
        concierge_name: 'Amaka',
        owner_phone: process.env.OWNER_WHATSAPP || '2349138987295',
        delivery_zones: [
          { name: 'Zone 1 (Central / Commercial Core)', fee: 800, eta: '2–4 hours' },
          { name: 'Zone 2 (Inner Ring / Suburbs)', fee: 1200, eta: 'Same day' },
          { name: 'Zone 3 (Outer Districts)', fee: 1800, eta: 'Same day / Next morning' },
          { name: 'Zone 4 (Inter-city Express)', fee: 2500, eta: '24–48 hours' },
        ],
      },
    }
    this.load()
    this.syncInFlight = null
    this.productVersion = 0
  }

  async syncFromSupabase() {
    if (!this.syncInFlight) {
      const versionAtStart = this.productVersion
      this.syncInFlight = (async () => {
        const { data, error } = await supabase.from('products').select('*')
        if (error) throw error
        if (versionAtStart !== this.productVersion) return false

        this.data.products = (data || []).map((product) => this.mapSupabaseProduct(product))
        this.save()
        console.log(`Synced ${this.data.products.length} products from Supabase.`)
        return true
      })()
    }

    let isCurrent
    try {
      isCurrent = await this.syncInFlight
    } finally {
      this.syncInFlight = null
    }
    if (!isCurrent) return this.syncFromSupabase()
  }

  mapSupabaseProduct(product) {
    const listing = Number(product.price || product.listing_price || 0)
    const stock = Number(product.stock ?? 1)
    const productFeatures = product.features || []
    const storedCategory = productFeatures.find((feature) => /^Category:\s*/i.test(feature))
    const displayCategory = storedCategory
      ? storedCategory.replace(/^Category:\s*/i, '')
      : formatCategory(product.category)
    return {
      id: product.id,
      name: product.name,
      category: displayCategory,
      image: product.image || product.images?.[0] || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=700',
      images: product.images || (product.image ? [product.image] : []),
      description: product.description || '',
      features: productFeatures.filter((feature) => !/^Category:\s*/i.test(feature)),
      listing_price: listing,
      vendor_cost: Number(product.vendor_cost || Math.round(listing * 0.82)),
      floor_price: Number(product.floor_price || Math.round(listing * 0.9)),
      vendor_name: product.vendor_name || 'Direct Gadget Hub',
      vendor_phone: product.vendor_phone || this.data.settings.owner_phone,
      vendor_stall_location: product.vendor_stall_location || 'Tech Quarter, Suite 12',
      in_stock: stock > 0,
      stock,
      badge: product.badge || (product.is_bestseller ? 'BESTSELLER' : undefined),
    }
  }

  load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8')
        this.data = JSON.parse(raw)
        // Clean out fake products if any were cached
        if (this.data.products) {
          this.data.products = this.data.products.filter((p) => !FAKE_PRODUCT_IDS.has(p.id))
        }
      } else {
        this.save()
      }
    } catch (err) {
      console.error('Error loading database, resetting to default:', err)
      this.save()
    }
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8')
    } catch (err) {
      console.error('Error saving database:', err)
    }
  }

  // Product methods
  getProducts() {
    return this.data.products.filter((p) => !FAKE_PRODUCT_IDS.has(p.id))
  }

  getProductById(id) {
    return this.data.products.find((p) => p.id === id)
  }

  async addProduct(product) {
    this.productVersion += 1
    const listingPrice = Number(product.listing_price || product.price || 0)
    const floorPrice = Number(product.floor_price || Math.round(listingPrice * 0.9))
    const vendorCost = Number(product.vendor_cost || Math.round(listingPrice * 0.82))

    const stock = Number(product.stock ?? 5)
    const { data, error } = await supabase
      .from('products')
      .insert({
        name: product.name,
        category: toDatabaseCategory(product.category),
        description: product.description || '',
        image: product.image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=700',
        images: product.images || (product.image ? [product.image] : []),
        price: listingPrice,
        floor_price: floorPrice,
        vendor_cost: vendorCost,
        vendor_name: product.vendor_name || 'Marketplace Seller',
        vendor_phone: product.vendor_phone || this.data.settings.owner_phone,
        vendor_stall_location: product.vendor_stall_location || 'Central Market Plaza',
        stock,
        features: [`Category: ${formatCategory(product.category)}`, ...(product.features || [])],
        badge: product.badge || null,
      })
      .select('*')
      .single()
    if (error) throw error
    if (!data) throw new Error('Supabase did not return the saved product.')

    const savedProduct = this.mapSupabaseProduct(data)
    this.productVersion += 1
    this.data.products = [savedProduct, ...this.data.products.filter((item) => item.id !== savedProduct.id)]
    this.save()
    return savedProduct
  }

  async updateProduct(id, updates) {
    this.productVersion += 1
    const databaseUpdates = {}
    if (updates.name !== undefined) databaseUpdates.name = updates.name
    if (updates.category !== undefined) databaseUpdates.category = toDatabaseCategory(updates.category)
    if (updates.description !== undefined) databaseUpdates.description = updates.description
    if (updates.image !== undefined) databaseUpdates.image = updates.image
    if (updates.images !== undefined) databaseUpdates.images = updates.images
    if (updates.listing_price !== undefined) databaseUpdates.price = Number(updates.listing_price)
    if (updates.floor_price !== undefined) databaseUpdates.floor_price = Number(updates.floor_price)
    if (updates.vendor_cost !== undefined) databaseUpdates.vendor_cost = Number(updates.vendor_cost)
    if (updates.vendor_name !== undefined) databaseUpdates.vendor_name = updates.vendor_name
    if (updates.vendor_phone !== undefined) databaseUpdates.vendor_phone = updates.vendor_phone
    if (updates.vendor_stall_location !== undefined) databaseUpdates.vendor_stall_location = updates.vendor_stall_location
    if (updates.stock !== undefined) databaseUpdates.stock = Number(updates.stock)
    if (updates.features !== undefined) databaseUpdates.features = updates.features

    const { data, error } = await supabase
      .from('products')
      .update(databaseUpdates)
      .eq('id', id)
      .select('*')
      .maybeSingle()
    if (error) throw error
    if (!data) return null

    const updatedProduct = this.mapSupabaseProduct(data)
    this.productVersion += 1
    this.data.products = this.data.products.map((item) => item.id === id ? updatedProduct : item)
    this.save()
    return updatedProduct
  }

  async deleteProduct(id) {
    this.productVersion += 1
    const { data, error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
      .select('id')
    if (error) throw error
    if (!data?.length) return false

    this.productVersion += 1
    this.data.products = this.data.products.filter((product) => product.id !== id)
    this.save()
    return true
  }

  // Order methods
  mapSupabaseOrder(row) {
    const orderItems = Array.isArray(row.items) ? row.items : row.items ? [row.items] : []
    const item = orderItems[0]
    const productId = row.product_id || item?.product_id || item?.id || ''
    const product = this.getProductById(productId)
    const totalAmount = Number(row.total_amount || 0)
    const agreedPrice = Number(row.agreed_price || item?.price || totalAmount)
    const deliveryFee = Number(row.delivery_fee ?? Math.max(totalAmount - agreedPrice, 0))
    const databaseStatus = String(row.status || 'pending').toUpperCase()
    const fulfillmentStatus = String(row.fulfillment_status || '').toUpperCase()
    const addressFromNotes = String(row.notes || '').match(/Delivery Address:\s*(.+?)(?:\.\s*(?:Agreed Last Price|PAID via)|$)/i)?.[1]

    return {
      id: row.order_id,
      customer_id: row.customer_id || '',
      customer_name: row.customer_name || 'Customer',
      customer_phone: row.customer_phone || row.whatsapp_number || '',
      customer_email: row.customer_email || '',
      delivery_address: row.delivery_address || addressFromNotes || '',
      delivery_zone: row.delivery_zone || 'Zone 1 (Central / Commercial Core)',
      product_id: productId,
      product_name: orderItems.length
        ? orderItems.map((line) => `${line.name || 'Product'}${Number(line.quantity || 1) > 1 ? ` × ${line.quantity}` : ''}`).join(', ')
        : product?.name || 'Product',
      items: orderItems.map((line) => ({
        product_id: line.product_id || line.id || productId,
        name: line.name || product?.name || 'Product',
        image: line.image || product?.image || '',
        price: Number(line.price || 0),
        quantity: Number(line.quantity || 1),
        ...(line.line_total !== undefined ? { line_total: Number(line.line_total) } : {}),
      })),
      agreed_price: agreedPrice,
      delivery_fee: deliveryFee,
      total_amount: totalAmount,
      vendor_cost: Number(row.vendor_cost ?? product?.vendor_cost ?? 0),
      net_profit: Number(row.net_profit ?? Math.max(agreedPrice - Number(row.vendor_cost ?? product?.vendor_cost ?? 0), 0)),
      vendor_name: row.vendor_name || product?.vendor_name || 'Marketplace Seller',
      vendor_phone: row.vendor_phone || product?.vendor_phone || '',
      payment_status: String(row.payment_status || 'pending').toUpperCase(),
      payment_reference: row.payment_reference || '',
      payment_verified_at: row.payment_verified_at || '',
      delivery_signature: row.delivery_signature || '',
      delivered_at: row.delivered_at || '',
      delivered_by: row.delivered_by || '',
      status: fulfillmentStatus || (
        databaseStatus === 'PROCESSING' ? 'CONFIRMED'
        : databaseStatus === 'SHIPPED' ? 'DISPATCHED'
        : databaseStatus
      ),
      created_at: row.created_at,
    }
  }

  async getOrders() {
    const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false })
    if (error) throw new Error(`Could not fetch orders from Supabase: ${error.message}`)
    return (data || []).map((row) => this.mapSupabaseOrder(row))
  }

  async getOrderById(id) {
    const { data, error } = await supabase.from('orders').select('*').eq('order_id', id).maybeSingle()
    if (error) throw new Error(`Could not fetch order from Supabase: ${error.message}`)
    return data ? this.mapSupabaseOrder(data) : null
  }

  async getOrdersByCustomer(customerId) {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
    if (error) throw new Error(`Could not fetch customer orders from Supabase: ${error.message}`)
    return (data || []).map((row) => this.mapSupabaseOrder(row))
  }

  async createOrder(orderData) {
    const code = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
    const requestedItems = Array.isArray(orderData.items) && orderData.items.length
      ? orderData.items
      : [{ product_id: orderData.product_id, quantity: 1 }]
    const products = requestedItems.map(({ product_id, quantity }) => {
      const product = this.getProductById(product_id)
      const itemQuantity = Number(quantity)
      if (!product || !Number.isInteger(itemQuantity) || itemQuantity < 1 || itemQuantity > 99) {
        throw new Error('Order contains an invalid product or quantity')
      }
      return { product, quantity: itemQuantity }
    })
    const baseSubtotal = products.reduce((sum, item) => sum + item.product.listing_price * item.quantity, 0)
    const agreedPrice = Number(orderData.agreed_price ?? baseSubtotal)
    if (!Number.isFinite(agreedPrice) || agreedPrice <= 0) {
      throw new Error('Order total must be a positive amount')
    }
    const vendorCost = products.reduce((sum, item) => sum + (item.product.vendor_cost || 0) * item.quantity, 0)
    const deliveryFee = Number(orderData.delivery_fee || 800)
    const netProfit = agreedPrice - vendorCost
    let remainingAgreedPrice = agreedPrice
    const orderItems = products.map(({ product, quantity }, index) => {
      const baseLineTotal = product.listing_price * quantity
      const lineTotal = index === products.length - 1
        ? remainingAgreedPrice
        : Math.round(agreedPrice * baseLineTotal / baseSubtotal)
      remainingAgreedPrice -= lineTotal
      return {
        product_id: product.id,
        name: product.name,
        image: product.image || '',
        price: lineTotal / quantity,
        quantity,
        line_total: lineTotal,
      }
    })
    const primaryProduct = products[0].product

    const newOrder = {
      id: code,
      customer_id: orderData.customer_id || 'guest',
      customer_name: orderData.customer_name,
      customer_phone: orderData.customer_phone,
      customer_email: orderData.customer_email || '',
      delivery_address: orderData.delivery_address,
      delivery_zone: orderData.delivery_zone || 'Zone 1 (Central / Commercial Core)',
      product_id: primaryProduct.id,
      product_name: orderItems.map((item) => `${item.name}${item.quantity > 1 ? ` × ${item.quantity}` : ''}`).join(', '),
      items: orderItems,
      agreed_price: agreedPrice,
      delivery_fee: deliveryFee,
      total_amount: agreedPrice + deliveryFee,
      vendor_cost: vendorCost,
      net_profit: netProfit > 0 ? netProfit : 0,
      vendor_name: primaryProduct.vendor_name,
      vendor_phone: primaryProduct.vendor_phone,
      payment_status: orderData.payment_status || 'PENDING',
      payment_reference: orderData.payment_reference || '',
      status: orderData.status || 'PENDING',
      created_at: new Date().toISOString(),
    }

    const safeEmail =
      orderData.customer_email ||
      `${orderData.customer_name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'buyer'}@guest.townsquare.market`
    const trackingId = `TRK-${Math.floor(100000 + Math.random() * 899999)}`

    const { data, error } = await supabase
      .from('orders')
      .insert({
        order_id: code,
        tracking_id: trackingId,
        customer_id: newOrder.customer_id,
        customer_name: orderData.customer_name,
        customer_email: safeEmail,
        customer_phone: orderData.customer_phone,
        whatsapp_number: orderData.whatsapp_number || orderData.customer_phone,
        product_id: newOrder.product_id,
        total_amount: agreedPrice + deliveryFee,
        status: newOrder.status.toLowerCase() === 'confirmed' ? 'processing' : (newOrder.status.toLowerCase() || 'pending'),
        payment_status: newOrder.payment_status.toLowerCase(),
        fulfillment_status: 'pending',
        payment_reference: newOrder.payment_reference,
        delivery_fee: deliveryFee,
        delivery_address: newOrder.delivery_address,
        delivery_zone: newOrder.delivery_zone,
        vendor_cost: vendorCost,
        net_profit: newOrder.net_profit,
        agreed_price: agreedPrice,
        vendor_name: newOrder.vendor_name,
        vendor_phone: newOrder.vendor_phone,
        items: orderItems,
        notes: `Delivery Address: ${orderData.delivery_address}. Agreed Last Price: ₦${agreedPrice}, Vendor Cost: ₦${vendorCost}, Net Profit: ₦${netProfit}`,
      })
      .select('*')
      .single()

    if (error) throw new Error(`Could not save order to Supabase: ${error.message}`)
    console.log(`Order ${code} saved to Supabase`)
    return this.mapSupabaseOrder(data)
  }

  async markOrderPaid(id, paymentReference = '') {
    const order = await this.getOrderById(id)
    if (!order) return null

    const { data, error } = await supabase
      .from('orders')
      .update({
        payment_status: 'paid',
        payment_verified_at: new Date().toISOString(),
        ...(paymentReference ? { payment_reference: paymentReference } : {}),
      })
      .eq('order_id', id)
      .select('*')
      .single()
    if (error) throw new Error(`Could not update paid order in Supabase: ${error.message}`)
    const updatedOrder = this.mapSupabaseOrder(data)

    // Construct WhatsApp message for owner
    const ownerPhone = this.data.settings.owner_phone || '2349138987295'
    const cleanPhone = ownerPhone.replace(/\D/g, '')
    const whatsappMessage = 
`🚨 *NEW PAID ORDER via Paystack!*

📦 *Item Ordered:* ${updatedOrder.product_name}
💰 *Last Negotiated Price Paid:* ₦${updatedOrder.agreed_price.toLocaleString()}
🚚 *Delivery Fee:* ₦${updatedOrder.delivery_fee.toLocaleString()} (Total: ₦${updatedOrder.total_amount.toLocaleString()})
👤 *Customer:* ${updatedOrder.customer_name}
📞 *Customer Phone:* ${updatedOrder.customer_phone}
📍 *Delivery Address:* ${updatedOrder.delivery_address}
🧾 *Order Code:* ${updatedOrder.id}
💳 *Paystack Reference:* ${paymentReference || 'Completed'}

Please package and dispatch this order!`

    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsappMessage)}`

    return {
      order: updatedOrder,
      whatsappUrl,
      whatsappMessage,
      ownerPhone: cleanPhone,
    }
  }

  async updateOrderStatus(id, status) {
    const normalizedStatus = String(status).toUpperCase()
    const allowedStatuses = new Set(['PENDING', 'CONFIRMED', 'VENDOR_NOTIFIED', 'DISPATCHED', 'DELIVERED', 'CANCELLED'])
    if (!allowedStatuses.has(normalizedStatus)) throw new Error('Invalid order status')
    const databaseStatus = {
      PENDING: 'pending',
      CONFIRMED: 'processing',
      VENDOR_NOTIFIED: 'processing',
      DISPATCHED: 'processing',
      DELIVERED: 'delivered',
      CANCELLED: 'cancelled',
    }[normalizedStatus]
    const { data, error } = await supabase
      .from('orders')
      .update({
        status: databaseStatus,
        fulfillment_status: normalizedStatus.toLowerCase(),
      })
      .eq('order_id', id)
      .select('*')
      .maybeSingle()
    if (error) throw new Error(`Could not update order status in Supabase: ${error.message}`)
    return data ? this.mapSupabaseOrder(data) : null
  }

  // Users
  getUserByEmail(email) {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase())
  }

  createUser(userData) {
    const newUser = {
      id: `user-${Date.now()}`,
      role: 'customer',
      created_at: new Date().toISOString(),
      ...userData,
    }
    this.data.users.push(newUser)
    this.save()
    return newUser
  }

  // Stats
  async getStats() {
    const products = this.getProducts()
    const orders = await this.getOrders()

    const totalOrders = orders.length
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0)
    const totalProfit = orders.reduce((sum, o) => sum + (o.net_profit || 0), 0)
    const activeProducts = products.filter((p) => p.in_stock).length

    return {
      total_orders: totalOrders,
      total_sales: totalRevenue,
      total_net_profit: totalProfit,
      pending_orders: orders.filter((order) => order.status === 'PENDING').length,
      dispatched_orders: orders.filter((order) => order.status === 'DISPATCHED').length,
      active_products: activeProducts,
    }
  }
}

export const db = new Database()
