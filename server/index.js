import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { db } from './db.js'
import { processChat } from './ai.js'
import { supabase } from './supabase.js'
import { createAdminSessionToken, isValidAdminPassword, requireAdmin } from './adminAuth.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

const PRIVATE_PRODUCT_FIELDS = new Set([
  'vendor_cost',
  'floor_price',
  'vendor_phone',
  'vendor_name',
  'vendor_stall_location',
])

function toPublicProduct(product) {
  return {
    ...Object.fromEntries(Object.entries(product).filter(([key]) => !PRIVATE_PRODUCT_FIELDS.has(key))),
    vendor_name: 'SHOPLY TOWN',
    vendor_stall_location: 'Online store',
  }
}

app.use(cors())
app.use(express.json({ limit: '25mb' }))
app.use(express.urlencoded({ extended: true, limit: '25mb' }))

async function requireCustomer(req, res, next) {
  const authorization = req.get('authorization') || ''
  const [scheme, token] = authorization.split(' ')
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Customer sign-in required.' })
  }

  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) {
    return res.status(401).json({ error: 'Your session is invalid or expired. Please sign in again.' })
  }
  req.customer = data.user
  return next()
}

function toCustomerOrder(order) {
  return {
    id: order.id,
    customer_id: order.customer_id,
    customer_name: order.customer_name,
    customer_phone: order.customer_phone,
    customer_email: order.customer_email,
    delivery_address: order.delivery_address,
    delivery_zone: order.delivery_zone,
    product_id: order.product_id,
    product_name: order.product_name,
    items: order.items,
    agreed_price: order.agreed_price,
    delivery_fee: order.delivery_fee,
    total_amount: order.total_amount,
    payment_status: order.payment_status,
    payment_reference: order.payment_reference,
    payment_verified_at: order.payment_verified_at,
    delivery_signature: order.delivery_signature,
    delivered_at: order.delivered_at,
    delivered_by: order.delivered_by,
    status: order.status,
    created_at: order.created_at,
  }
}

const adminLoginAttempts = new Map()
const ADMIN_LOGIN_WINDOW_MS = 15 * 60 * 1000
const ADMIN_MAX_LOGIN_ATTEMPTS = 5

app.post('/api/admin/login', (req, res) => {
  const configuredPassword = process.env.ADMIN_PASSWORD
  if (!configuredPassword) {
    return res.status(503).json({ error: 'Admin sign-in is not configured on the server.' })
  }

  const now = Date.now()
  const clientKey = req.ip || req.socket.remoteAddress || 'unknown'
  const recentAttempts = (adminLoginAttempts.get(clientKey) || [])
    .filter((attemptAt) => now - attemptAt < ADMIN_LOGIN_WINDOW_MS)

  if (recentAttempts.length >= ADMIN_MAX_LOGIN_ATTEMPTS) {
    adminLoginAttempts.set(clientKey, recentAttempts)
    return res.status(429).json({ error: 'Too many sign-in attempts. Try again in 15 minutes.' })
  }

  const password = typeof req.body?.password === 'string' ? req.body.password : ''
  if (!isValidAdminPassword(password)) {
    recentAttempts.push(now)
    adminLoginAttempts.set(clientKey, recentAttempts)
    return res.status(401).json({ error: 'Incorrect admin password.' })
  }

  adminLoginAttempts.delete(clientKey)
  return res.json({ token: createAdminSessionToken() })
})

app.use('/api/admin', requireAdmin)

// --- PRODUCTS API ---

// Public products for customer storefront
app.get('/api/products', async (req, res) => {
  try {
  await db.syncFromSupabase()
  const { category, search } = req.query
  let products = db.getProducts().filter((p) => p.in_stock)

  if (category && category !== 'All') {
    products = products.filter((p) => p.category === category)
  }

  if (search) {
    const q = search.toLowerCase()
    products = products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    )
  }

  // Keep supplier contacts and internal cost/margin details server-side.
  res.json(products.map(toPublicProduct))
  } catch (error) {
    console.error('Failed to load storefront products:', error)
    res.status(503).json({ error: 'Products are temporarily unavailable. Please try again.' })
  }
})

// Admin products list (includes vendor_cost, floor_price, vendor phone & profit potential)
app.get('/api/admin/products', async (req, res) => {
  try {
    await db.syncFromSupabase()
    res.json(db.getProducts())
  } catch (error) {
    console.error('Failed to load admin products:', error)
    res.status(503).json({ error: 'Could not load products from Supabase.' })
  }
})

// Admin add new product
app.post('/api/admin/products', async (req, res) => {
  const body = req.body || {}
  const { name, category, listing_price } = body
  if (typeof name !== 'string' || !name.trim() || !Number.isFinite(Number(listing_price)) || Number(listing_price) <= 0) {
    return res.status(400).json({ error: 'Name and listing price are required' })
  }

  try {
    const newProduct = await db.addProduct({
      ...body,
      name: name.trim(),
      category: category || 'General',
      listing_price: Number(listing_price),
      floor_price: Number(body.floor_price || Math.round(Number(listing_price) * 0.9)),
      vendor_cost: Number(body.vendor_cost || Math.round(Number(listing_price) * 0.82)),
      vendor_name: body.vendor_name || 'Marketplace Seller',
      vendor_phone: body.vendor_phone || db.data.settings.owner_phone,
    })
    res.status(201).json(newProduct)
  } catch (error) {
    console.error('Failed to save admin product:', error)
    res.status(500).json({ error: 'Could not save product to Supabase. Check the database connection and product fields, then try again.' })
  }
})

// Admin update product
app.put('/api/admin/products/:id', async (req, res) => {
  try {
    const updated = await db.updateProduct(req.params.id, req.body)
    if (!updated) return res.status(404).json({ error: 'Product not found' })
    res.json(updated)
  } catch (error) {
    console.error('Failed to update admin product:', error)
    res.status(500).json({ error: 'Could not save product changes to Supabase.' })
  }
})

// Admin delete product
app.delete('/api/admin/products/:id', async (req, res) => {
  try {
    const ok = await db.deleteProduct(req.params.id)
    if (!ok) return res.status(404).json({ error: 'Product not found' })
    res.json({ success: true })
  } catch (error) {
    console.error('Failed to delete product:', error)
    res.status(500).json({ error: 'Could not delete product from the database.' })
  }
})

// --- ORDERS API ---

// Admin list of all orders with net profit calculation
app.get('/api/admin/orders', async (req, res) => {
  try {
    res.json(await db.getOrders())
  } catch (error) {
    console.error('Failed to load admin orders:', error)
    res.status(500).json({ error: 'Could not load orders from the order database.' })
  }
})

app.all(['/api/orders/paystack-checkout', '/api/paystack/verify/:reference'], (_req, res) => {
  res.status(410).json({ error: 'Online payments are not available. Place your order and confirm payment via WhatsApp.' })
})

// Customer's personal orders
app.get('/api/orders/my', requireCustomer, async (req, res) => {
  try {
    const orders = await db.getOrdersByCustomer(req.customer.id)
    res.json(orders.map(toCustomerOrder))
  } catch (error) {
    console.error('Failed to load customer orders:', error)
    res.status(500).json({ error: 'Could not load customer orders.' })
  }
})

// Public tracking lookup
app.get('/api/orders/track/:code', requireCustomer, async (req, res) => {
  try {
    const order = await db.getOrderById(req.params.code.trim().toUpperCase())
    if (!order || order.customer_id !== req.customer.id) {
      return res.status(404).json({ error: 'Order not found' })
    }
    res.json({
      id: order.id,
      product_name: order.product_name,
      agreed_price: order.agreed_price,
      delivery_fee: order.delivery_fee,
      total_amount: order.total_amount,
      payment_status: order.payment_status,
      status: order.status,
      fulfillment_status: order.fulfillment_status,
      delivered_at: order.delivered_at,
      created_at: order.created_at,
    })
  } catch (error) {
    console.error('Failed to look up tracked order:', error)
    res.status(500).json({ error: 'Order tracking is temporarily unavailable.' })
  }
})

// QR Code Delivery Confirmation & Signature
app.post('/api/orders/:id/deliver', requireAdmin, async (req, res) => {
  const { signature, delivered_by } = req.body
  try {
    const { data, error } = await supabase
      .from('orders')
      .update({
        status: 'delivered',
        fulfillment_status: 'delivered',
        delivery_signature: signature || '',
        delivered_at: new Date().toISOString(),
        delivered_by: delivered_by || '',
      })
      .eq('order_id', req.params.id.trim().toUpperCase())
      .select('*')
      .maybeSingle()
    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Order not found' })
    res.json({ success: true, order: db.mapSupabaseOrder(data) })
  } catch (error) {
    console.error('Failed to confirm delivery:', error)
    res.status(500).json({ error: 'Could not save delivery confirmation. Check that the latest orders migration has been run in Supabase.' })
  }
})

// Create order (from checkout or AI chat)
app.post('/api/orders', requireCustomer, async (req, res) => {
  const {
    customer_name,
    customer_phone,
    delivery_address,
    product_id,
    items,
    agreed_price,
    delivery_zone,
  } = req.body || {}

  if (
    typeof customer_name !== 'string' || !customer_name.trim() || customer_name.length > 120 ||
    typeof customer_phone !== 'string' || !customer_phone.trim() || customer_phone.length > 40 ||
    typeof delivery_address !== 'string' || !delivery_address.trim() || delivery_address.length > 500 ||
    (!product_id && !Array.isArray(items)) ||
    (product_id !== undefined && typeof product_id !== 'string') ||
    (Array.isArray(items) && (
      items.length < 1 ||
      items.length > 20 ||
      items.some((item) =>
        !item ||
        typeof item.product_id !== 'string' ||
        !Number.isInteger(Number(item.quantity)) ||
        Number(item.quantity) < 1 ||
        Number(item.quantity) > 99
      )
    ))
  ) {
    return res.status(400).json({ error: 'Name, phone, delivery address, and at least one product are required.' })
  }

  try {
    await db.syncFromSupabase()
    const order = await db.createOrder({
      customer_id: req.customer.id,
      customer_name: customer_name.trim(),
      customer_phone: customer_phone.trim(),
      whatsapp_number: customer_phone.trim(),
      customer_email: req.customer.email || '',
      delivery_address: delivery_address.trim(),
      delivery_zone: delivery_zone === 'Zone 2 (Inner Ring / Suburbs)' ||
        delivery_zone === 'Zone 3 (Outer Districts)' ||
        delivery_zone === 'Zone 4 (Inter-city Express)'
        ? delivery_zone
        : 'Zone 1 (Central / Commercial Core)',
      product_id,
      items,
      agreed_price,
      payment_status: 'PENDING',
      status: 'PENDING',
      payment_reference: '',
    })
    res.status(201).json(toCustomerOrder(order))
  } catch (error) {
    console.error('Failed to save new order:', error)
    res.status(error.statusCode || 500).json({
      error: error.statusCode ? error.message : 'Order could not be saved. Please try again.',
    })
  }
})

// Direct Paystack checkout & order confirmation with WhatsApp notification
app.post('/api/orders/paystack-checkout', async (req, res) => {
  const {
    customer_name,
    customer_phone,
    customer_email,
    delivery_address,
    product_id,
    customer_id,
    agreed_price,
    delivery_fee,
    payment_reference,
  } = req.body

  if (!customer_name || !customer_phone || !product_id) {
    return res.status(400).json({ error: 'Customer name, phone, and product are required' })
  }

  let isVerified = false
  if (payment_reference) {
    try {
      const secretKey = process.env.PAYSTACK_SECRET_KEY || ''
      const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(payment_reference)}`, {
        headers: { Authorization: `Bearer ${secretKey}` },
      })
      const verifyData = await verifyRes.json()
      const expectedAmountKobo = Math.round(
        (Number(agreed_price) + Number(delivery_fee || 800)) * 100
      )
      if (
        verifyData.status &&
        verifyData.data?.status === 'success' &&
        verifyData.data.currency === 'NGN' &&
        verifyData.data.amount === expectedAmountKobo
      ) {
        isVerified = true
      }
    } catch (e) {
      console.warn('Paystack auto-verify check error:', e.message)
    }
  }

  if (payment_reference && !isVerified) {
    return res.status(400).json({ error: 'Payment has not been verified. Please check the transaction and try again.' })
  }

  try {
    const order = await db.createOrder({
      customer_id,
      customer_name,
      customer_phone,
      customer_email,
      delivery_address: delivery_address || 'Address provided during Paystack checkout',
      product_id,
      agreed_price: Number(agreed_price),
      delivery_fee: Number(delivery_fee || 800),
      payment_status: isVerified ? 'PAID' : 'PENDING',
      status: isVerified ? 'CONFIRMED' : 'PENDING',
      payment_reference,
    })

    const whatsappInfo = isVerified ? await db.markOrderPaid(order.id, payment_reference) : null

    res.status(201).json({
      order,
      isVerified,
      ...(whatsappInfo || {}),
    })
  } catch (error) {
    console.error('Failed to save checkout order:', error)
    res.status(500).json({ error: 'Order could not be saved. Please try again.' })
  }
})

// Verify Paystack transaction directly with Paystack API
app.get('/api/paystack/verify/:reference', async (req, res) => {
  const { reference } = req.params
  const secretKey = process.env.PAYSTACK_SECRET_KEY || ''
  try {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
    })
    const data = await response.json()
    if (data.status && data.data && data.data.status === 'success') {
      res.json({
        success: true,
        data: data.data,
      })
    } else {
      res.status(400).json({
        success: false,
        message: data.message || 'Payment verification failed',
        data: data.data,
      })
    }
  } catch (err) {
    console.error('Paystack verification error:', err)
    res.status(500).json({ success: false, error: 'Could not contact Paystack verification servers' })
  }
})

// Mark order as paid via Paystack & generate WhatsApp message for owner
app.post('/api/orders/:id/paid', requireAdmin, async (req, res) => {
  const { payment_reference } = req.body
  try {
    const result = await db.markOrderPaid(req.params.id, payment_reference)
    if (!result) return res.status(404).json({ error: 'Order not found' })
    res.json(result)
  } catch (error) {
    console.error('Failed to update paid order:', error)
    res.status(500).json({ error: 'Could not update payment status.' })
  }
})

// Admin update order status
app.patch('/api/admin/orders/:id/status', async (req, res) => {
  const { status } = req.body
  try {
    const updated = await db.updateOrderStatus(req.params.id, status)
    if (!updated) return res.status(404).json({ error: 'Order not found' })
    res.json(updated)
  } catch (error) {
    console.error('Failed to update order status:', error)
    res.status(500).json({ error: 'Could not update order status. Check that the latest orders migration has been run in Supabase.' })
  }
})


// --- AI CHAT & NEGOTIATION ENDPOINT ---
app.post('/api/chat', requireCustomer, async (req, res) => {
  try {
    const { message, history, currentProductId } = req.body || {}
    if (typeof message !== 'string' || !message.trim() || message.length > 4000) {
      return res.status(400).json({ error: 'A message of 1–4000 characters is required.' })
    }
    if (
      history !== undefined &&
      (!Array.isArray(history) ||
        history.length > 20 ||
        history.some((entry) =>
          !entry ||
          !['user', 'assistant'].includes(entry.role) ||
          typeof entry.content !== 'string' ||
          entry.content.length > 4000
        ))
    ) {
      return res.status(400).json({ error: 'Chat history is invalid or too large.' })
    }

    await db.syncFromSupabase()
    const result = await processChat({ message, history, currentProductId })
    res.json({
      ...result,
      products: result.products?.map(toPublicProduct),
    })
  } catch (err) {
    console.error('Chat error:', err)
    res.status(500).json({ error: 'Internal chat error' })
  }
})

app.all(['/api/auth/login', '/api/auth/register'], (_req, res) => {
  res.status(410).json({ error: 'Use the SHOPLY TOWN Supabase sign-in page.' })
})

// --- AUTH & ACCOUNTS ---
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body
  const user = db.getUserByEmail(email)
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid email or password' })
  }
  const { password: _, ...safeUser } = user
  res.json(safeUser)
})

app.post('/api/auth/register', (req, res) => {
  const { name, email, phone, address, password } = req.body
  if (!name || !email || !password || !phone) {
    return res.status(400).json({ error: 'Name, email, phone, and password are required' })
  }
  const existing = db.getUserByEmail(email)
  if (existing) {
    return res.status(409).json({ error: 'Email already registered' })
  }

  const newUser = db.createUser({
    name,
    email,
    phone,
    address: address || '',
    password,
  })

  const { password: _, ...safeUser } = newUser
  res.status(201).json(safeUser)
})

// --- STATS ---
app.get('/api/admin/stats', async (req, res) => {
  try {
    await db.syncFromSupabase()
    res.json(await db.getStats())
  } catch (error) {
    console.error('Failed to load admin stats:', error)
    res.status(500).json({ error: 'Could not load admin stats.' })
  }
})

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`SHOPLY TOWN Marketplace Backend running on port ${PORT}`)
  })
}

export default app
