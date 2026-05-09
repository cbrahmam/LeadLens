import { useEffect, useState } from 'react'
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { getResearchByDomain } from '../api/client'

export default function ResultsPage() {
  const { domain } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [data, setData] = useState(location.state?.data || null)
  const [loading, setLoading] = useState(!data)
  const [error, setError] = useState('')

  useEffect(() => {
    if (data) return
    setLoading(true)
    getResearchByDomain(domain)
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [domain, data])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 pt-16 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <Link to="/" className="text-indigo-600 hover:underline">Back to Search</Link>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="max-w-2xl mx-auto px-4 pt-16 text-center">
        <p className="text-slate-600 mb-4">No research data found for {domain}</p>
        <Link to="/" className="text-indigo-600 hover:underline">Back to Search</Link>
      </div>
    )
  }

  const brief = data.brief

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Search
        </button>
        <div className="text-sm text-slate-400">
          Results for {domain}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">{brief.company_name}</h1>
        <p className="text-lg text-slate-600 mb-6">{brief.one_liner}</p>
        <p className="text-slate-700 max-w-2xl mx-auto">{brief.executive_summary}</p>
        <p className="mt-6 text-sm text-indigo-600 font-medium">
          Full results dashboard coming in Block 5
        </p>
      </div>
    </div>
  )
}
