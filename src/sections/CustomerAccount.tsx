import { useState, useEffect } from 'react'
import { User, Package, MapPin, Phone, LogOut } from 'lucide-react'
import { loginUser, registerUser } from '@/lib/api'
import { formatNaira } from '@/lib/catalog'
import type { User as UserType, Order } from '@/types/marketplace'

type CustomerAccountProps = {
  currentUser: UserType | null
  onLoginSuccess: (user: UserType) => void
  onLogout: () => void
  onTrackOrder: (code: string) => void
  onClose: () => void
}

export function CustomerAccount({
  currentUser,
  onLoginSuccess,
  onLogout,
  onTrackOrder,
  onClose,
}: CustomerAccountProps) {
  const [isRegister, setIsRegister] = useState(false)
  const [orders, setOrders] = useState<Order[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)

  // Auth form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (currentUser) {
      loadMyOrders()
    }
  }, [currentUser])

  const loadMyOrders = async () => {
    if (!currentUser) return
    setLoadingOrders(true)
    try {
      const res = await fetch(`/api/orders/my?customer_id=${encodeURIComponent(currentUser.id)}`)
      if (res.ok) {
        const data = await res.json()
        setOrders(data)
      }
    } catch (err) {
      console.error('Failed to load my orders:', err)
    } finally {
      setLoadingOrders(false)
    }
  }

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      if (isRegister) {
        const user = await registerUser(formData)
        onLoginSuccess(user)
      } else {
        const user = await loginUser(formData.email, formData.password)
        onLoginSuccess(user)
      }
    } catch (err: any) {
      setError(err.message || 'Authentication error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl text-slate-900 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <User size={18} />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold leading-tight text-slate-900">
                {currentUser ? `Welcome back, ${currentUser.name.split(' ')[0]}` : 'Customer Account'}
              </h2>
              <p className="text-xs text-slate-500">
                {currentUser ? 'Personal Dashboard & Orders' : 'Sign in to track orders & save delivery details'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-sm text-slate-400 hover:text-red-500 transition-colors">
            ✕ Close
          </button>
        </div>

        {/* LOGGED IN VIEW */}
        {currentUser ? (
          <div className="mt-5 space-y-6">
            {/* Profile info card */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-display text-lg font-bold text-slate-900">{currentUser.name}</p>
                  <p className="text-xs text-slate-500">{currentUser.email}</p>
                </div>
                <button
                  onClick={onLogout}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <LogOut size={13} />
                  Sign Out
                </button>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 text-xs">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Phone size={13} />
                  <span>{currentUser.phone || 'No phone set'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500">
                  <MapPin size={13} />
                  <span className="truncate">{currentUser.address || 'Central District'}</span>
                </div>
              </div>
            </div>

            {/* My Orders Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-slate-900">
                  My Orders ({orders.length})
                </p>
                <button
                  onClick={loadMyOrders}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-medium underline"
                >
                  Refresh
                </button>
              </div>

              {loadingOrders ? (
                <p className="font-mono text-xs text-ink/50 text-center py-4">Loading your orders...</p>
              ) : orders.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                  <Package size={24} className="mx-auto text-slate-400 mb-2" />
                  <p className="font-display text-base font-semibold text-slate-700">No orders yet</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Your orders placed with our sales manager or cart will show up here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map((ord) => (
                    <div
                      key={ord.id}
                      className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-slate-900">{ord.id}</span>
                        <span
                          className={`rounded px-2 py-0.5 font-mono text-[9px] font-bold uppercase ${
                            ord.status === 'DELIVERED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ord.status === 'DISPATCHED'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {ord.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="font-display text-sm font-semibold mt-1">{ord.product_name}</p>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs">
                        <span>Total: {formatNaira(ord.total_amount)}</span>
                        <button
                          onClick={() => {
                            onClose()
                            onTrackOrder(ord.id)
                          }}
                          className="font-semibold text-emerald-600 hover:text-emerald-700"
                        >
                          Track Live →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* LOGIN / REGISTRATION FORM */
          <div className="mt-5">
            <div className="flex rounded-lg border border-slate-200 p-1 bg-slate-50 mb-5">
              <button
                type="button"
                onClick={() => setIsRegister(false)}
                className={`flex-1 py-2 text-xs font-semibold rounded-md transition-colors ${
                  !isRegister ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setIsRegister(true)}
                className={`flex-1 py-2 text-xs font-semibold rounded-md transition-colors ${
                  isRegister ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Create Account
              </button>
            </div>

            {error && (
              <p className="mb-4 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-600 font-medium">
                {error}
              </p>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-3">
              {isRegister && (
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Babatunde Alao"
                    className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:outline-none transition-all"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:outline-none transition-all"
                />
              </div>

              {isRegister && (
                <>
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">
                      Phone Number (for Delivery) *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="08012345678"
                      className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm font-mono focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">
                      Default Delivery Landmark / Address
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Street, Landmark, District"
                      className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:outline-none transition-all"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm font-mono focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 shadow-sm"
              >
                {submitting ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}
              </button>
            </form>

            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 text-center">
              💡 Demo Accounts available:
              <br />
              <span className="font-bold">admin@townsquare.market</span> / pass: <span className="font-bold">admin</span> (Admin)
              <br />
              <span className="font-bold">babatunde@example.com</span> / pass: <span className="font-bold">password123</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
