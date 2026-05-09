import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, ArrowRight } from 'lucide-react'
import { getRecentSearches } from '../api/client'

export default function RecentSearches() {
  const [searches, setSearches] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    getRecentSearches()
      .then(setSearches)
      .catch(() => {})
  }, [])

  if (searches.length === 0) return null

  return (
    <div className="w-full max-w-4xl mx-auto mt-16 animate-fade-in">
      <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <Clock className="w-5 h-5 text-slate-400" />
        Recent Research
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {searches.map((s) => (
          <button
            key={s.domain}
            onClick={() => navigate(`/results/${s.domain}`)}
            className="bg-white border border-slate-200 rounded-xl p-4 text-left
                       hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group"
          >
            <p className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">
              {s.company_name || s.domain}
            </p>
            <p className="text-sm text-slate-500 mt-1">{s.domain}</p>
            {s.one_liner && (
              <p className="text-xs text-slate-400 mt-2 line-clamp-2">{s.one_liner}</p>
            )}
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-slate-400">
                {s.researched_at ? new Date(s.researched_at).toLocaleDateString() : ''}
              </span>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
