import type { Product, Order, User, AdminStats } from '@/types/marketplace'
import { requireSupabase, toAppUser } from '@/lib/supabase'

const API_BASE = '/api'
const ADMIN_TOKEN_KEY = 'townsquare_admin_session'

export function getAdminSessionToken(): string | null {
  return window.sessionStorage.getItem(ADMIN_TOKEN_KEY)
}

export function clearAdminSession(): void {
  window.sessionStorage.removeItem(ADMIN_TOKEN_KEY)
}

export async function loginAdmin(password: string): Promise<void> {
  const res = await fetch(`${API_BASE}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })
  if (!res.ok) throw new Error(await getApiError(res, 'Admin sign-in failed.'))
  const data = await res.json() as { token?: string }
  if (!data.token) throw new Error('Admin sign-in did not return a session.')
  window.sessionStorage.setItem(ADMIN_TOKEN_KEY, data.token)
}

async function adminFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = getAdminSessionToken()
  if (!token) throw new Error('Admin sign-in required.')

  const headers = new Headers(init.headers)
  headers.set('Authorization', `Bearer ${token}`)
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers })
  if (res.status === 401) {
    clearAdminSession()
    window.location.assign('/admin')
    throw new Error('Admin session expired. Sign in again.')
  }
  return res
}

async function getApiError(res: Response, fallback: string) {
  const body = await res.json().catch(() => null) as { error?: string } | null
  return body?.error || fallback
}

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
  const res = await adminFetch('/admin/products')
  if (!res.ok) throw new Error('Failed to fetch admin products')
  return await res.json()
}

export async function createAdminProduct(productData: Partial<Product>): Promise<Product> {
  const res = await adminFetch('/admin/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(productData),
  })
  if (!res.ok) throw new Error('Failed to create product')
  return await res.json()
}

export async function updateAdminProduct(id: string, productData: Partial<Product>): Promise<Product> {
  const res = await adminFetch(`/admin/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(productData),
  })
  if (!res.ok) throw new Error('Failed to update product')
  return await res.json()
}

export async function deleteAdminProduct(id: string): Promise<boolean> {
  const res = await adminFetch(`/admin/products/${id}`, {
    method: 'DELETE',
  })
  return res.ok
}

export async function confirmOrderDelivery(id: string, signature?: string, deliveredBy?: string): Promise<{ success: boolean; order: Order }> {
  const res = await adminFetch(`/orders/${id}/deliver`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ signature, delivered_by: deliveredBy }),
  })
  if (!res.ok) throw new Error(await getApiError(res, 'Failed to confirm delivery'))
  return await res.json()
}

export async function fetchAdminOrders(): Promise<Order[]> {
  const res = await adminFetch('/admin/orders')
  if (!res.ok) throw new Error('Failed to fetch admin orders')
  return await res.json()
}

export async function updateOrderStatus(id: string, status: string): Promise<Order> {
  const res = await adminFetch(`/admin/orders/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
  if (!res.ok) throw new Error(await getApiError(res, 'Failed to update order status'))
  return await res.json()
}

export async function fetchAdminStats(): Promise<AdminStats> {
  const res = await adminFetch('/admin/stats')
  if (!res.ok) throw new Error('Failed to fetch admin stats')
  return await res.json()
}

export async function trackOrder(code: string): Promise<Order | null> {
  const res = await fetch(`${API_BASE}/orders/track/${encodeURIComponent(code)}`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error('Order tracking is temporarily unavailable. Please try again.')
  return await res.json()
}

export async function createOrder(orderData: Partial<Order>): Promise<Order> {
  const res = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null) as { error?: string } | null
    throw new Error(body?.error || 'Failed to save your order. Please try again.')
  }
  return await res.json()
}

export async function sendChatMessage(message: string, history: unknown[] = [], currentProductId?: string) {
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

export async function markOrderPaid(orderId: string, paymentReference?: string) {
  const res = await adminFetch(`/orders/${encodeURIComponent(orderId)}/paid`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(paymentReference ? { payment_reference: paymentReference } : {}),
  })
  if (!res.ok) throw new Error('Failed to confirm payment')
  return await res.json()
}

export async function verifyPaystackPayment(reference: string) {
  const res = await fetch(`${API_BASE}/paystack/verify/${encodeURIComponent(reference)}`)
  return await res.json()
}


export async function loginUser(email: string, password: string): Promise<User> {
  const { data, error } = await requireSupabase().auth.signInWithPassword({
    email,
    password,
  })
  if (error) throw error
  if (!data.user) throw new Error('Sign-in did not return a user account.')
  return toAppUser(data.user)
}

export async function registerUser(userData: {
  name: string
  email: string
  phone: string
  address?: string
  password: string
}): Promise<{ user: User; needsEmailConfirmation: boolean }> {
  const { data, error } = await requireSupabase().auth.signUp({
    email: userData.email,
    password: userData.password,
    options: {
      data: {
        name: userData.name,
        phone: userData.phone,
        address: userData.address ?? '',
      },
    },
  })
  if (error) throw error
  if (!data.user) throw new Error('Account registration did not return a user.')

  return {
    user: toAppUser(data.user),
    needsEmailConfirmation: !data.session,
  }
}

export async function logoutUser(): Promise<void> {
  const { error } = await requireSupabase().auth.signOut()
  if (error) throw error
}
