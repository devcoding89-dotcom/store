import { type FormEvent, useEffect, useState } from 'react'
import {
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  QrCode,
  ShieldCheck,
  Package,
} from 'lucide-react'
import { Reveal } from '@/components/Reveal'
import { trackOrder } from '@/lib/api'
import { formatNaira } from '@/lib/catalog'
import { QRCodeDisplay } from '@/components/QRCodeDisplay'
import type { Order } from '@/types/marketplace'

type Step = { label: string; time?: string; done: boolean; current?: boolean }

function buildTimeline(order: Order): Step[] {
  const status = (order.status || 'PENDING').toUpperCase()
  const created = new Date(order.created_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })

  const isPaid = order.payment_status?.toUpperCase() === 'PAID'
  const isVendorNotified = ['VENDOR_NOTIFIED', 'DISPATCHED', 'DELIVERED'].includes(status)
  const isDispatched = ['DISPATCHED', 'DELIVERED'].includes(status)
  const isDelivered = status === 'DELIVERED'

  return [
    {
      label: 'Order Placed & Logged',
      time: `Today at ${created}`,
      done: true,
    },
    {
      label: 'Payment Received',
      time: isPaid ? 'Payment confirmed by the store' : 'Payment has not been confirmed yet',
      done: isPaid,
      current: !isPaid,
    },
    {
      label: 'Market Vendor Notified & Goods Packaged',
      time: isVendorNotified ? 'Package inspected & prepared' : 'Pending vendor pickup',
      done: isVendorNotified,
      current: isPaid && !isVendorNotified,
    },
    {
      label: 'Dispatch Rider En Route to Delivery Address',
      time: isDispatched ? 'Rider on transit to destination' : 'Queued for dispatch',
      done: isDispatched,
      current: isVendorNotified && !isDispatched,
    },
    {
      label: 'Delivered & QR Verification Completed',
      time: isDelivered
        ? order.delivered_at
          ? `Delivered on ${new Date(order.delivered_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}`
          : 'Delivered to recipient'
        : 'Show delivery QR code to rider on arrival',
      done: isDelivered,
      current: isDispatched && !isDelivered,
    },
  ]
}

export function TrackOrder({ prefill }: { prefill: string }) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [order, setOrder] = useState<Order | null>(null)
  const [error, setError] = useState('')

  const fetchTrack = async (targetCode: string) => {
    const trimmed = targetCode.trim().toUpperCase()
    if (!trimmed) return

    setLoading(true)
    setError('')

    try {
      const res = await trackOrder(trimmed)
      if (res) {
        setOrder(res)
        setError('')
      } else {
        setOrder(null)
        setError(`We couldn't find order ${trimmed}. Check the code and try again.`)
      }
    } catch (err) {
      setOrder(null)
      setError(err instanceof Error ? err.message : 'Order tracking is temporarily unavailable. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    fetchTrack(code)
  }

  useEffect(() => {
    if (prefill) {
      setCode(prefill)
      fetchTrack(prefill)
    }
  }, [prefill])

  return (
    <section
      id="track"
      className="scroll-mt-24 bg-emerald-600 px-4 py-16 text-white sm:px-8 lg:px-10 lg:py-24"
    >
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
            Live Order Tracking
          </span>
          <h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl">
            Where is my package right now?
          </h2>
          <p className="mt-3 max-w-lg text-base leading-relaxed text-emerald-100">
            Real-time tracking powered by our dispatch network. Every order has a live tracking code
            and QR delivery pass.
          </p>
        </Reveal>

        <Reveal delay={80}>
          <form onSubmit={submit} className="mt-8 flex flex-col sm:flex-row max-w-xl items-stretch sm:items-end gap-3">
            <label className="flex-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-200">
                Order code
              </span>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="ORD-00000"
                className="mt-2 w-full rounded-xl border border-white/30 bg-white/10 px-4 py-3 font-mono text-base tracking-wider text-white placeholder:text-emerald-300 focus:bg-white/20 focus:border-white focus:outline-none focus:ring-2 focus:ring-white/30 backdrop-blur-sm transition-all"
                aria-label="Order code"
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-bold text-emerald-700 shadow-sm transition-all hover:bg-emerald-50 hover:shadow-md disabled:opacity-50 shrink-0"
            >
              {loading ? <RefreshCw size={15} className="animate-spin" /> : 'Track Live'}
              <ArrowRight size={15} strokeWidth={2} />
            </button>
          </form>
        </Reveal>

        {error && (
          <div role="alert" className="mt-6 max-w-xl rounded-xl border border-white/30 bg-white/10 p-4 text-sm backdrop-blur-sm">
            {error}
          </div>
        )}

        {/* LIVE ORDER RESULT CARD */}
        {order && (
          <div className="mt-10 max-w-2xl rounded-2xl bg-white text-slate-900 p-6 sm:p-8 shadow-2xl space-y-6">
            {/* Header info */}
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xl font-bold text-slate-900">{order.id}</span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${
                      order.status === 'DELIVERED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : order.status === 'DISPATCHED'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {order.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Recipient: <strong className="text-slate-800">{order.customer_name}</strong> ·{' '}
                  {order.delivery_address}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="font-display text-xl font-bold text-slate-900">
                    {formatNaira(order.total_amount)}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                    {order.payment_status?.toUpperCase() === 'PAID' ? '✓ Payment received' : 'Payment pending'}
                  </p>
                </div>
                <button
                  onClick={() => fetchTrack(order.id)}
                  className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-emerald-700 hover:bg-slate-50 transition-colors"
                  title="Refresh Live Status"
                >
                  <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            {/* Product summary */}
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3.5 border border-slate-200 text-xs">
              <Package size={18} className="text-emerald-600 shrink-0" />
              <div>
                <p className="font-semibold text-slate-900">{order.product_name}</p>
                <p className="text-slate-500 mt-0.5">
                  Agreed Price: {formatNaira(order.agreed_price)} · Delivery: {formatNaira(order.delivery_fee)}
                </p>
              </div>
            </div>

            {/* Live Timeline */}
            <div className="space-y-4 pt-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Delivery Progress:
              </p>
              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {buildTimeline(order).map((step, idx) => (
                  <div key={idx} className="relative flex items-start gap-3">
                    <div
                      className={`absolute -left-6 mt-0.5 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-white ${
                        step.done
                          ? 'bg-emerald-600 text-white'
                          : step.current
                          ? 'bg-amber-500 animate-pulse text-white'
                          : 'bg-slate-200'
                      }`}
                    >
                      {step.done ? (
                        <CheckCircle2 size={12} />
                      ) : (
                        <div className="h-1.5 w-1.5 rounded-full bg-white" />
                      )}
                    </div>

                    <div>
                      <p
                        className={`text-xs font-semibold ${
                          step.done ? 'text-slate-900' : 'text-slate-400'
                        }`}
                      >
                        {step.label}
                      </p>
                      {step.time && (
                        <p className="text-[11px] text-slate-500 mt-0.5">{step.time}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Verification QR Code */}
            <div className="rounded-xl border border-dashed border-emerald-300 bg-emerald-50/50 p-5 flex flex-col sm:flex-row items-center gap-5">
              <QRCodeDisplay value={order.id} size={130} />
              <div className="space-y-1.5 text-center sm:text-left">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800">
                  <QrCode size={14} />
                  <span>Doorstep Delivery Verification Pass</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Present this QR code to the dispatch rider upon arrival. Once scanned and signed,
                  the order is automatically marked as delivered.
                </p>
                {order.delivery_signature && (
                  <div className="pt-2 text-xs font-semibold text-emerald-800 flex items-center gap-1">
                    <ShieldCheck size={14} />
                    <span>✓ Digital signature recorded on delivery</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
