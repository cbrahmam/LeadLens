import { useEffect, useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { GitCompareArrows, Loader2, Plus, X, ArrowRight } from 'lucide-react'
import { compareCompanies, getRecentSearches } from '../api/client'

const GRADE_COLORS = {
  A: 'text-emerald-700 bg-emerald-100',
  B: 'text-blue-700 bg-blue-100',
  C: 'text-amber-700 bg-amber-100',
  D: 'text-red-700 bg-red-100',
}

export default function ComparePage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [domains, setDomains] = useState(() => {
    const d = searchParams.get('domains')
    return d ? d.split(',').filter(Boolean) : []
  })
  const [inputValue, setInputValue] = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [recentDomains, setRecentDomains] = useState([])

  useEffect(() => {
    getRecentSearches()
      .then(searches => setRecentDomains(searches.map(s => s.domain)))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (domains.length >= 2) {
      setLoading(true)
      setError('')
      compareCompanies(domains)
        .then(setResults)
        .catch(err => setError(err.message))
        .finally(() => setLoading(false))
    }
  }, [domains])

  function addDomain() {
    const d = inputValue.trim()
    if (d && !domains.includes(d) && domains.length < 5) {
      setDomains(prev => [...prev, d])
      setInputValue('')
    }
  }

  function removeDomain(d) {
    setDomains(prev => prev.filter(x => x !== d))
    setResults(null)
  }

  const found = results?.filter(r => r.status === 'found') || []

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <GitCompareArrows className="w-6 h-6 text-indigo-600" />
            Compare Companies
          </h1>
          <p className="text-sm text-slate-500 mt-1">Side-by-side comparison of researched leads</p>
        </div>
        <Link to="/" className="text-sm text-indigo-600 hover:underline">
          Back to Search
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
        <div className="flex flex-wrap gap-2 mb-3">
          {domains.map(d => (
            <span
              key={d}
              className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-700
                         text-sm rounded-full"
            >
              {d}
              <button
                onClick={() => removeDomain(d)}
                className="ml-1 text-indigo-400 hover:text-indigo-700 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addDomain()}
            placeholder="Enter a domain (e.g. stripe.com)"
            className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={addDomain}
            disabled={!inputValue.trim() || domains.length >= 5}
            className="inline-flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white
                       rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>

        {recentDomains.length > 0 && domains.length < 5 && (
          <div className="mt-3">
            <p className="text-xs text-slate-400 mb-1.5">Quick add from recent research:</p>
            <div className="flex flex-wrap gap-1.5">
              {recentDomains
                .filter(d => !domains.includes(d))
                .slice(0, 6)
                .map(d => (
                  <button
                    key={d}
                    onClick={() => setDomains(prev => [...prev, d])}
                    className="px-2.5 py-1 text-xs bg-slate-100 text-slate-600 rounded-md
                               hover:bg-indigo-100 hover:text-indigo-700 transition-colors cursor-pointer"
                  >
                    {d}
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>

      {domains.length < 2 && (
        <div className="text-center py-12">
          <GitCompareArrows className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-500">Add at least 2 domains to compare</p>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
          <span className="ml-2 text-slate-500">Comparing companies...</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {found.length >= 2 && !loading && (
        <div className="overflow-x-auto">
          <table className="w-full bg-white border border-slate-200 rounded-xl overflow-hidden">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide w-40">
                  Metric
                </th>
                {found.map(r => (
                  <th key={r.domain} className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wide">
                    <button
                      onClick={() => navigate(`/results/${r.domain}`)}
                      className="hover:text-indigo-600 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      {r.brief.company_name}
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <CompareRow label="Lead Score" values={found.map(r => (
                <span className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 text-xs font-bold rounded ${GRADE_COLORS[r.lead_score.grade]}`}>
                    {r.lead_score.grade}
                  </span>
                  <span className="font-semibold">{r.lead_score.total_score}/100</span>
                </span>
              ))} />
              <CompareRow label="Stage" values={found.map(r => r.brief.company_stage)} />
              <CompareRow label="Industry" values={found.map(r => r.enriched_data.industry || 'Unknown')} />
              <CompareRow label="Size" values={found.map(r => r.enriched_data.estimated_size || 'Unknown')} />
              <CompareRow label="HQ" values={found.map(r => r.enriched_data.headquarters || 'Unknown')} />
              <CompareRow label="Funding" values={found.map(r =>
                r.enriched_data.funding?.total_raised || 'No data'
              )} />
              <CompareRow label="Confidence" values={found.map(r => (
                <span className="capitalize">{r.brief.research_confidence}</span>
              ))} />
              <CompareRow label="Pain Points" values={found.map(r => (
                <span>{r.brief.pain_points.length} identified</span>
              ))} />
              <CompareRow label="Contacts" values={found.map(r => (
                <span>{r.brief.key_contacts.length} found</span>
              ))} />
              <CompareRow label="Tech Stack" values={found.map(r => (
                <div className="flex flex-wrap gap-1">
                  {(r.enriched_data.tech_stack || []).slice(0, 5).map(t => (
                    <span key={t} className="px-1.5 py-0.5 text-xs bg-slate-100 rounded">
                      {t}
                    </span>
                  ))}
                  {(r.enriched_data.tech_stack || []).length > 5 && (
                    <span className="text-xs text-slate-400">
                      +{r.enriched_data.tech_stack.length - 5}
                    </span>
                  )}
                </div>
              ))} />
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function CompareRow({ label, values }) {
  return (
    <tr>
      <td className="px-4 py-3 text-sm font-medium text-slate-500">{label}</td>
      {values.map((val, i) => (
        <td key={i} className="px-4 py-3 text-sm text-slate-700">{val}</td>
      ))}
    </tr>
  )
}
