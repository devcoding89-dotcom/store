import { useCallback, useEffect, useState } from 'react'
import { Package, Receipt, RefreshCw, X } from 'lucide-react'
import { formatNaira } from '@/lib/catalog'
import type { Order, User } from '@/types/marketplace'

type CustomerOrdersProps = {
  currentUser: User
  onTrackOrder: (code: string) => void
  onClose: () => void
}

export function CustomerOrders({ currentUser, onTrackOrder, onClose }: CustomerOrdersProps) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [openReceiptId, setOpenReceiptId] = useState<string | null>(null)

  const loadOrders = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`/api/orders/my?customer_id=${encodeURIComponent(currentUser.id)}`)
      if (!response.ok) throw new Error('Could not load your orders. Please try again.')
      setOrders(await response.json() as Order[])
    } catch (loadError) {
      console.error('Failed to load customer orders:', loadError)
      setError(loadError instanceof Error ? loadError.message : 'Could not load your orders.')
    } finally {
      setLoading(false)
    }
  }, [currentUser.id])

  useEffect(() => {
    void loadOrders()
  }, [loadOrders])

  return (
    <div
      className="fixed inset-0 z-[65] flex items-center justify-center bg-slate-900/50 px-3 py-4 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="orders-title"
        className="w-full max-w-2xl max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-2xl sm:max-h-[90vh] sm:p-6"
      >
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <Package size={19} />
            </div>
            <div>
              <h2 id="orders-title" className="font-display text-xl font-bold sm:text-2xl">My Orders</h2>
              <p className="text-xs text-slate-500">Orders and confirmed payment receipts for {currentUser.name}</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close orders" className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-red-500">
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <p className="text-sm font-bold text-slate-900">Order history ({orders.length})</p>
          <button onClick={() => void loadOrders()} disabled={loading} className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 underline disabled:opacity-50">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {error && <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {loading ? (
          <p className="py-10 text-center text-sm text-slate-500">Loading your orders…</p>
        ) : orders.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
            <Package size={26} className="mx-auto mb-2 text-slate-400" />
            <p className="font-display font-semibold text-slate-700">No orders yet</p>
            <p className="mt-1 text-xs text-slate-500">Your orders and confirmed payment receipts will be saved here.</p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {orders.map((order) => {
              const isPaid = order.payment_status?.toUpperCase() === 'PAID'
              const receiptOpen = openReceiptId === order.id
              const items = order.items?.length ? order.items : [{
                product_id: order.product_id,
                name: order.product_name,
                price: order.agreed_price,
                quantity: 1,
                line_total: order.agreed_price,
              }]

              return (
                <article key={order.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900">{order.id}</span>
                    <span className={`rounded px-2 py-1 font-mono text-[10px] font-bold uppercase ${
                      order.status === 'DELIVERED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : order.status === 'DISPATCHED'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                    }`}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="mt-2 font-display text-sm font-semibold">{order.product_name}</p>
                  <div className="mt-2 flex items-center justify-between gap-2 text-xs">
                    <span className={`font-semibold ${isPaid ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {isPaid ? 'Payment verified' : 'Payment pending'}
                    </span>
                    {isPaid && (
                      <button
                        type="button"
                        onClick={() => setOpenReceiptId((current) => current === order.id ? null : order.id)}
                        className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-900"
                        aria-expanded={receiptOpen}
                      >
                        <Receipt size={14} />
                        {receiptOpen ? 'Hide receipt' : 'View receipt'}
                      </button>
                    )}
                  </div>

                  {receiptOpen && isPaid && (
                    <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50/70 p-3 text-xs">
                      <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                        <span className="font-bold uppercase tracking-wide text-emerald-900">TownSquare payment receipt</span>
                        <span className="text-[10px] font-semibold text-emerald-800">VERIFIED</span>
                      </div>
                      <div className="mt-2 space-y-1.5 text-slate-700">
                        <p>Receipt / order code: <strong className="font-mono">{order.payment_reference || order.id}</strong></p>
                        <p>Paid by: <strong>{order.customer_name}</strong></p>
                        <p>Verified: <strong>{order.payment_verified_at ? new Date(order.payment_verified_at).toLocaleString() : 'Confirmed by TownSquare'}</strong></p>
                        <div className="border-t border-emerald-200 pt-2">
                          {items.map((item, index) => (
                            <div key={`${item.product_id}-${index}`} className="flex justify-between gap-3 py-0.5">
                              <span>{item.name} × {item.quantity}</span>
                              <span>{formatNaira(item.line_total ?? item.price * item.quantity)}</span>
                            </div>
                          ))}
                          <div className="mt-1 flex justify-between border-t border-emerald-200 pt-1.5 font-bold text-slate-900">
                            <span>Total paid</span>
                            <span>{formatNaira(order.total_amount)}</span>
                          </div>
                        </div>
                      </div>
                      <p className="mt-2 text-[10px] text-emerald-900">This verified receipt remains saved as your order record.</p>
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                    <span>Total: {formatNaira(order.total_amount)}</span>
                    <button
                      onClick={() => {
                        onClose()
                        onTrackOrder(order.id)
                      }}
                      className="font-semibold text-emerald-700 hover:text-emerald-900"
                    >
                      Track order →
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
