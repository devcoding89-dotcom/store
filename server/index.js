import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { db } from './db.js'
import { processChat } from './ai.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json({ limit: '25mb' }))
app.use(express.urlencoded({ extended: true, limit: '25mb' }))

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
        p.category.toLowerCase().includes(q) ||
        p.vendor_name.toLowerCase().includes(q)
    )
  }

  // Hide confidential vendor_cost and floor_price from public buyers
  const safeProducts = products.map(({ vendor_cost, floor_price, ...rest }) => rest)
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
  const ok = await db.deleteProduct(req.params.id)
  if (!ok) return res.status(404).json({ error: 'Product not found' })
  res.json({ success: true })
})

// --- ORDERS API ---

// Admin list of all orders with net profit calculation
app.get('/api/admin/orders', (req, res) => {
  res.json(db.getOrders())
})

// Customer's personal orders
app.get('/api/orders/my', (req, res) => {
  const customerId = req.query.customer_id
  if (!customerId) return res.json([])
  res.json(db.getOrdersByCustomer(customerId))
})

// Public tracking lookup
app.get('/api/orders/track/:code', (req, res) => {
  const order = db.getOrderById(req.params.code.trim().toUpperCase())
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
    status: order.status,
    delivery_signature: order.delivery_signature,
    delivered_at: order.delivered_at,
    delivered_by: order.delivered_by,
    created_at: order.created_at,
  })
})

// QR Code Delivery Confirmation & Signature
app.post('/api/orders/:id/deliver', (req, res) => {
  const { signature, delivered_by } = req.body
  const order = db.getOrderById(req.params.id.trim().toUpperCase())
  if (!order) return res.status(404).json({ error: 'Order not found' })

  order.status = 'DELIVERED'
  order.payment_status = 'PAID'
  order.delivered_at = new Date().toISOString()
  if (signature) order.delivery_signature = signature
  if (delivered_by) order.delivered_by = delivered_by

  db.save()
  res.json({ success: true, order })
})

// Create order (from checkout or AI chat)
app.post('/api/orders', (req, res) => {
  const { customer_name, customer_phone, customer_email, delivery_address, product_id, agreed_price, delivery_fee, delivery_zone, customer_id } = req.body

  if (!customer_name || !customer_phone || !product_id) {
    return res.status(400).json({ error: 'Missing required order fields' })
  }

  const order = db.createOrder({
    customer_id,
    customer_name,
    customer_phone,
    customer_email,
    delivery_address: delivery_address || 'Central District Landmark',
    delivery_zone,
    product_id,
    agreed_price,
    delivery_fee,
  })

  res.status(201).json(order)
})

// Direct Paystack checkout & order confirmation with WhatsApp notification
app.post('/api/orders/paystack-checkout', async (req, res) => {
  const {
    customer_name,
    customer_phone,
    customer_email,
    delivery_address,
    product_id,
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
      if (verifyData.status && verifyData.data?.status === 'success') {
        isVerified = true
      }
    } catch (e) {
      console.warn('Paystack auto-verify check error:', e.message)
    }
  }

  const order = db.createOrder({
    customer_name,
    customer_phone,
    customer_email,
    delivery_address: delivery_address || 'Address provided during Paystack checkout',
    product_id,
    agreed_price: Number(agreed_price),
    delivery_fee: Number(delivery_fee || 800),
    payment_status: payment_reference ? 'PAID' : 'PENDING',
    status: payment_reference ? 'CONFIRMED' : 'PENDING',
    payment_reference,
  })

  let whatsappInfo = null
  if (payment_reference) {
    whatsappInfo = db.markOrderPaid(order.id, payment_reference)
  }

  res.status(201).json({
    order,
    isVerified,
    ...(whatsappInfo || {}),
  })
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
app.post('/api/orders/:id/paid', (req, res) => {
  const { payment_reference } = req.body
  const result = db.markOrderPaid(req.params.id, payment_reference)
  if (!result) return res.status(404).json({ error: 'Order not found' })
  res.json(result)
})

// Admin update order status
app.patch('/api/admin/orders/:id/status', (req, res) => {
  const { status } = req.body
  const updated = db.updateOrderStatus(req.params.id, status)
  if (!updated) return res.status(404).json({ error: 'Order not found' })
  res.json(updated)
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
app.get('/api/admin/stats', (req, res) => {
  res.json(db.getStats())
})

app.listen(PORT, () => {
  console.log(`TownSquare Marketplace Backend running on port ${PORT}`)
})
