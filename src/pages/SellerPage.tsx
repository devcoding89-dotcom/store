import { Link } from 'react-router'
import { Footer } from '@/sections/Footer'
import { SellWithUs } from '@/sections/SellWithUs'

export default function SellerPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="font-display text-lg font-bold tracking-tight text-slate-900">
            SHOPLY TOWN
          </Link>
          <Link
            to="/marketplace"
            className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
          >
            Shop products
          </Link>
        </div>
      </header>

      <main>
        <SellWithUs />
      </main>

      <Footer />
    </div>
  )
}
