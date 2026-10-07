import { Link } from 'react-router'
import { HiddenAdminAccess } from '@/components/HiddenAdminAccess'
import { MARKETPLACE_CONFIG } from '@/lib/config'

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white px-4 py-5 sm:px-8 lg:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <Link to="/marketplace" className="font-display text-sm font-bold text-slate-800">
          {MARKETPLACE_CONFIG.name}
        </Link>
        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <p>© {new Date().getFullYear()} {MARKETPLACE_CONFIG.name}</p>
          <HiddenAdminAccess />
        </div>
      </div>
    </footer>
  )
}
