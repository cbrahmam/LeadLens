import { Link } from 'react-router-dom'
import { ScanSearch } from 'lucide-react'

export default function Header() {
  return (
    <header className="bg-white border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center">
        <Link to="/" className="flex items-center gap-2 text-indigo-600 font-bold text-xl no-underline">
          <ScanSearch className="w-6 h-6" />
          LeadLens
        </Link>
      </div>
    </header>
  )
}
