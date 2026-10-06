import { useState } from 'react'
import { Menu, ShoppingBag, X, User, Search, ShieldCheck } from 'lucide-react'

const NAV = [
  { label: 'All Products', href: '#shop' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Track Order', href: '#track' },
]

export function Header({
  cartCount,
  onOpenCart,
  onOpenAccount,
  storeName = 'TownSquare',
  searchQuery = '',
  onSearch,
}: {
  cartCount: number
  onOpenCart: () => void
  onOpenAccount?: () => void
  storeName?: string
  searchQuery?: string
  onSearch?: (q: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState(searchQuery)

  const handleSearchChange = (val: string) => {
    setSearchValue(val)
    onSearch?.(val)
  }

  return (
    <>
      {/* Top green announcement strip */}
      <div className="bg-emerald-700 text-white">
        <div className="mx-auto flex h-8 max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8 text-[11px] sm:text-xs font-medium">
          <div className="flex items-center gap-2 truncate">
            <ShieldCheck size={14} className="text-emerald-300 shrink-0" />
            <span className="truncate">100% Verified Sellers · Order via WhatsApp · Direct Dispatch</span>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-emerald-100 shrink-0">
            <span>Fast Same-Day Delivery</span>
            <span>•</span>
            <span>Bargain with Sales Desk Live</span>
          </div>
        </div>
      </div>

      {/* Main sticky navigation */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md transition-all shadow-xs">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <a href="#top" className="flex items-center gap-2.5 shrink-0 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold text-lg shadow-sm group-hover:bg-emerald-700 transition-colors">
              T
            </div>
            <div>
              <span className="font-display text-xl font-bold tracking-tight text-slate-900 leading-none block">
                {storeName}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 leading-none">
                Marketplace
              </span>
            </div>
          </a>

          {/* Desktop Search Bar */}
          <div className="hidden sm:flex flex-1 max-w-lg items-center relative">
            <Search size={16} className="absolute left-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search books, iPhones, laptops, smart watches..."
              className="w-full rounded-full border border-slate-300 bg-slate-50 pl-10 pr-9 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 focus:outline-none transition-all"
            />
            {searchValue && (
              <button
                onClick={() => handleSearchChange('')}
                className="absolute right-3 text-slate-400 hover:text-slate-600 text-xs p-1"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="navlink hover:text-emerald-600 transition-colors"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {/* Account */}
            {onOpenAccount && (
              <button
                onClick={onOpenAccount}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-emerald-600 transition-colors"
                aria-label="Account"
              >
                <User size={19} />
              </button>
            )}

            {/* Cart Button */}
            <button
              onClick={onOpenCart}
              className="relative flex items-center gap-2 rounded-full bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
              aria-label={`Cart with ${cartCount} items`}
            >
              <ShoppingBag size={16} />
              <span className="hidden sm:inline">Cart</span>
              {cartCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-emerald-800 text-[11px] font-bold">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Mobile menu trigger */}
            <button
              onClick={() => setOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 lg:hidden hover:bg-slate-100"
              aria-label="Menu"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>

        {/* Mobile Full-Width Search Input */}
        <div className="px-4 pb-3 sm:hidden">
          <div className="flex items-center relative">
            <Search size={16} className="absolute left-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search books, iPhones, watches..."
              className="w-full rounded-full border border-slate-300 bg-slate-50 pl-10 pr-9 py-2 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-600 focus:outline-none transition-all shadow-xs"
            />
            {searchValue && (
              <button
                onClick={() => handleSearchChange('')}
                className="absolute right-3 text-slate-400 hover:text-slate-600 text-xs p-1"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs lg:hidden">
          <div className="fixed inset-y-0 right-0 w-full max-w-xs bg-white p-6 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <span className="font-display text-lg font-bold text-slate-900">{storeName}</span>
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mt-6 flex flex-col gap-3">
                {NAV.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-2.5 text-base font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-6 border-t border-slate-100">
              {onOpenAccount && (
                <button
                  onClick={() => {
                    setOpen(false)
                    onOpenAccount()
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700"
                >
                  <User size={16} /> My Account
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
