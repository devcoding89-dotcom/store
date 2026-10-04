import type { Product, Order, User, AdminStats } from '@/types/marketplace'

const API_BASE = '/api'

export async function fetchProducts(category?: string, search?: string): Promise<Product[]> {
  try {
    const params = new URLSearchParams()
    if (category && category !== 'All') params.append('category', category)
    if (search) params.append('search', search)
    const res = await fetch(`${API_BASE}/products?${params.toString()}`)
    if (!res.ok) throw new Error('Failed to fetch products')
    return await res.json()
  } catch (err) {
    console.error('fetchProducts error:', err)
    return []
  }
}

export async function fetchAdminProducts(): Promise<Product[]> {
  const res = await fetch(`${API_BASE}/admin/products`)
  if (!res.ok) throw new Error('Failed to fetch admin products')
  return await res.json()
}

export async function createAdminProduct(productData: Partial<Product>): Promise<Product> {
  const res = await fetch(`${API_BASE}/admin/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(productData),
  })
  if (!res.ok) throw new Error('Failed to create product')
  return await res.json()
}

export async function updateAdminProduct(id: string, productData: Partial<Product>): Promise<Product> {
  const res = await fetch(`${API_BASE}/admin/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(productData),
  })
  if (!res.ok) throw new Error('Failed to update product')
  return await res.json()
}

export async function deleteAdminProduct(id: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/admin/products/${id}`, {
    method: 'DELETE',
  })
  return res.ok
}

export async function confirmOrderDelivery(id: string, signature?: string, deliveredBy?: string): Promise<{ success: boolean; order: Order }> {
  const res = await fetch(`${API_BASE}/orders/${id}/deliver`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ signature, delivered_by: deliveredBy }),
  })
  if (!res.ok) throw new Error('Failed to confirm delivery')
  return await res.json()
}

export async function fetchAdminOrders(): Promise<Order[]> {
  const res = await fetch(`${API_BASE}/admin/orders`)
  if (!res.ok) throw new Error('Failed to fetch admin orders')
  return await res.json()
}

export async function updateOrderStatus(id: string, status: string): Promise<Order> {
  const res = await fetch(`${API_BASE}/admin/orders/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
  if (!res.ok) throw new Error('Failed to update order status')
  return await res.json()
}

export async function fetchAdminStats(): Promise<AdminStats> {
  const res = await fetch(`${API_BASE}/admin/stats`)
  if (!res.ok) throw new Error('Failed to fetch admin stats')
  return await res.json()
}

export async function trackOrder(code: string): Promise<Order | null> {
  try {
    const res = await fetch(`${API_BASE}/orders/track/${encodeURIComponent(code)}`)
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export async function createOrder(orderData: Partial<Order>): Promise<Order> {
  const res = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData),
  })
  if (!res.ok) throw new Error('Failed to place order')
  return await res.json()
}

export async function sendChatMessage(message: string, history: any[] = [], currentProductId?: string) {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history, currentProductId }),
  })
  if (!res.ok) throw new Error('Chat failed')
  return await res.json()
}

export async function paystackCheckout(orderData: {
  customer_name: string
  customer_phone: string
  customer_email?: string
  delivery_address: string
  product_id: string
  agreed_price: number
  delivery_fee?: number
  payment_reference?: string
}) {
  const res = await fetch(`${API_BASE}/orders/paystack-checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData),
  })
  if (!res.ok) throw new Error('Paystack checkout initialization failed')
  return await res.json()
}

export async function markOrderPaid(orderId: string, paymentReference: string) {
  const res = await fetch(`${API_BASE}/orders/${orderId}/paid`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ payment_reference: paymentReference }),
  })
  if (!res.ok) throw new Error('Failed to mark order paid')
  return await res.json()
}

export async function verifyPaystackPayment(reference: string) {
  const res = await fetch(`${API_BASE}/paystack/verify/${encodeURIComponent(reference)}`)
  return await res.json()
}


export async function loginUser(email: string, password: string): Promise<User> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Login failed')
  }
  return await res.json()
}

export async function registerUser(userData: {
  name: string
  email: string
  phone: string
  address?: string
  password: string
}): Promise<User> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Registration failed')
  }
  return await res.json()
}
