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

app.use(cors())
app.use(express.json({ limit: '25mb' }))
app.use(express.urlencoded({ extended: true, limit: '25mb' }))

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
app.get('/api/products', (req, res) => {
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
  const supplierFields = new Set([
    'vendor_cost',
    'floor_price',
    'vendor_phone',
    'vendor_name',
    'vendor_stall_location',
  ])
  const safeProducts = products.map((product) => ({
    ...Object.fromEntries(Object.entries(product).filter(([key]) => !supplierFields.has(key))),
    vendor_name: 'TownSquare Marketplace',
    vendor_stall_location: 'Online store',
  }))
  res.json(safeProducts)
})

// Admin products list (includes vendor_cost, floor_price, vendor phone & profit potential)
app.get('/api/admin/products', (req, res) => {
  res.json(db.getProducts())
})

// Admin add new product
app.post('/api/admin/products', async (req, res) => {
  const {
    name,
    category,
    image,
    description,
    vendor_cost,
    listing_price,
    floor_price,
    vendor_name,
    vendor_phone,
    vendor_stall_location,
  } = req.body

  if (!name || !listing_price) {
    return res.status(400).json({ error: 'Name and listing price are required' })
  }

  const newProduct = await db.addProduct({
    name,
    category: category || 'General',
    image: image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=700',
    description: description || '',
    vendor_cost: Number(vendor_cost || Math.round(Number(listing_price) * 0.82)),
    listing_price: Number(listing_price),
    floor_price: Number(floor_price || Math.round(Number(listing_price) * 0.9)),
    vendor_name: vendor_name || 'Marketplace Seller',
    vendor_phone: vendor_phone || db.data.settings.owner_phone,
    vendor_stall_location: vendor_stall_location || 'Central Market Plaza',
  })

  res.status(201).json(newProduct)
})

// Admin update product
app.put('/api/admin/products/:id', (req, res) => {
  const updated = db.updateProduct(req.params.id, req.body)
  if (!updated) return res.status(404).json({ error: 'Product not found' })
  res.json(updated)
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

// Customer's personal orders
app.get('/api/orders/my', async (req, res) => {
  const customerId = req.query.customer_id
  if (!customerId) return res.json([])
  try {
    res.json(await db.getOrdersByCustomer(customerId))
  } catch (error) {
    console.error('Failed to load customer orders:', error)
    res.status(500).json({ error: 'Could not load customer orders.' })
  }
})

// Public tracking lookup
app.get('/api/orders/track/:code', async (req, res) => {
  try {
    const order = await db.getOrderById(req.params.code.trim().toUpperCase())
    if (!order) return res.status(404).json({ error: 'Order not found' })
    res.json({
      id: order.id,
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
      product_name: order.product_name,
      agreed_price: order.agreed_price,
      delivery_fee: order.delivery_fee,
      total_amount: order.total_amount,
      delivery_address: order.delivery_address,
      delivery_zone: order.delivery_zone,
      payment_status: order.payment_status,
      payment_verified_at: order.payment_verified_at,
      status: order.status,
      delivery_signature: order.delivery_signature,
      delivered_at: order.delivered_at,
      delivered_by: order.delivered_by,
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
app.post('/api/orders', async (req, res) => {
  const {
    customer_name,
    customer_phone,
    customer_email,
    delivery_address,
    product_id,
    items,
    agreed_price,
    delivery_fee,
    delivery_zone,
    customer_id,
  } = req.body

  if (!customer_name || !customer_phone || (!product_id && !Array.isArray(items))) {
    return res.status(400).json({ error: 'Missing required order fields' })
  }

  try {
    const order = await db.createOrder({
      customer_id,
      customer_name,
      customer_phone,
      customer_email,
      delivery_address: delivery_address || 'Central District Landmark',
      delivery_zone,
      product_id,
      items,
      agreed_price,
      delivery_fee,
    })
    res.status(201).json(order)
  } catch (error) {
    console.error('Failed to save new order:', error)
    res.status(500).json({ error: 'Order could not be saved. Please try again.' })
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
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history, currentProductId } = req.body
    if (!message) return res.status(400).json({ error: 'Message is required' })

    const result = await processChat({ message, history, currentProductId })
    res.json(result)
  } catch (err) {
    console.error('Chat error:', err)
    res.status(500).json({ error: 'Internal chat error' })
  }
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
    res.json(await db.getStats())
  } catch (error) {
    console.error('Failed to load admin stats:', error)
    res.status(500).json({ error: 'Could not load admin stats.' })
  }
})

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`TownSquare Marketplace Backend running on port ${PORT}`)
  })
}

export default app
