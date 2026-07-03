import { Link, useLocation } from 'react-router-dom'
import { ScanSearch, BarChart3, Star, GitCompareArrows, Kanban, Sun, Moon } from 'lucide-react'
import { useTheme } from '../utils/themeContext'

const NAV_ITEMS = [
  { to: '/pipeline', icon: Kanban, label: 'Pipeline' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/compare', icon: GitCompareArrows, label: 'Compare' },
  { to: '/favorites', icon: Star, label: 'Saved' },
]

export default function Header() {
  const location = useLocation()
  const { dark, toggle } = useTheme()

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xl no-underline">
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
                             ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-medium'
                             : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                           }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            )
          })}

          <button
            onClick={toggle}
            className="ml-2 p-2 rounded-lg text-slate-500 dark:text-slate-400
                       hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </nav>
      </div>
    </header>
  )
}
