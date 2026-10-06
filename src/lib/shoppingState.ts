import type { CartItem, Product } from '@/types/marketplace'

export type ShoppingState = {
  cart: CartItem[]
  query: string
  category: string
}

const emptyState: ShoppingState = {
  cart: [],
  query: '',
  category: 'All',
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isProduct(value: unknown): value is Product {
  return isRecord(value)
    && typeof value.id === 'string'
    && typeof value.name === 'string'
    && typeof value.category === 'string'
    && typeof value.image === 'string'
    && typeof value.listing_price === 'number'
    && typeof value.vendor_name === 'string'
    && typeof value.vendor_stall_location === 'string'
    && typeof value.in_stock === 'boolean'
}

function isCartItem(value: unknown): value is CartItem {
  return isRecord(value)
    && isProduct(value.product)
    && typeof value.qty === 'number'
    && Number.isInteger(value.qty)
    && value.qty > 0
}

function storageKey(userId: string) {
  return `townsquare:shopping-state:${encodeURIComponent(userId)}`
}

export function loadShoppingState(userId: string): ShoppingState {
  try {
    const saved = localStorage.getItem(storageKey(userId))
    if (!saved) return emptyState

    const parsed: unknown = JSON.parse(saved)
    if (!isRecord(parsed)) return emptyState

    return {
      cart: Array.isArray(parsed.cart) ? parsed.cart.filter(isCartItem) : [],
      query: typeof parsed.query === 'string' ? parsed.query : '',
      category: typeof parsed.category === 'string' ? parsed.category : 'All',
    }
  } catch (error) {
    console.warn('Could not restore this account’s saved shopping state:', error)
    return emptyState
  }
}

export function saveShoppingState(userId: string, state: ShoppingState): void {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(state))
  } catch (error) {
    console.warn('Could not save this account’s shopping state:', error)
  }
}
