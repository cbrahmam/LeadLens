import { Link, useLocation } from 'react-router-dom'
import { ScanSearch, BarChart3, Star, GitCompareArrows } from 'lucide-react'

const NAV_ITEMS = [
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/compare', icon: GitCompareArrows, label: 'Compare' },
  { to: '/favorites', icon: Star, label: 'Saved' },
]

export default function Header() {
  const location = useLocation()

  return (
    <header className="bg-white border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-indigo-600 font-bold text-xl no-underline">
          <ScanSearch className="w-6 h-6" />
          LeadLens
        </Link>

        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
            const active = location.pathname === to
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg
                           transition-colors no-underline
                           ${active
                             ? 'bg-indigo-50 text-indigo-700 font-medium'
                             : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                           }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
