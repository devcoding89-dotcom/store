export type Product = {
  id: string
  name: string
  category: string
  image: string
  images?: string[]
  description?: string
  features?: string[]
  listing_price: number
  vendor_cost?: number
  floor_price?: number
  vendor_name: string
  vendor_phone?: string
  vendor_stall_location: string
  in_stock: boolean
  stock?: number
  badge?: string
}

export type Order = {
  id: string
  customer_id?: string
  customer_name: string
  customer_phone: string
  customer_email?: string
  delivery_address: string
  delivery_zone: string
  product_id: string
  product_name: string
  agreed_price: number
  delivery_fee: number
  total_amount: number
  vendor_cost: number
  net_profit: number
  vendor_name: string
  vendor_phone: string
  payment_status?: string
  payment_reference?: string
  delivery_signature?: string
  delivered_at?: string
  delivered_by?: string
  qr_code_data?: string
  status: 'PENDING' | 'CONFIRMED' | 'PAID' | 'VENDOR_NOTIFIED' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED' | string
  created_at: string
}

export type User = {
  id: string
  name: string
  email: string
  phone: string
  address?: string
  role: 'customer' | 'admin'
}

export type CartItem = {
  product: Product
  qty: number
  selectedSize?: string
}

export type DeliveryZone = {
  name: string
  fee: number
  eta: string
}

export type AdminStats = {
  total_orders: number
  total_sales: number
  total_net_profit: number
  pending_orders: number
  dispatched_orders: number
  active_products: number
}
