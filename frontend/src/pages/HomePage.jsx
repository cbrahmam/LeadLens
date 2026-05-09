import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import SearchBar from '../components/SearchBar'
import BatchInput from '../components/BatchInput'
import ResearchProgress from '../components/ResearchProgress'
import RecentSearches from '../components/RecentSearches'
import { researchCompany, researchBatch } from '../api/client'

export default function HomePage() {
  const [mode, setMode] = useState('single')
  const [isLoading, setIsLoading] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function handleSingleSubmit(url) {
    setIsLoading(true)
    setError('')
    setIsComplete(false)

    try {
      const result = await researchCompany(url)
      setIsComplete(true)
      setTimeout(() => {
        navigate(`/results/${result.domain}`, { state: { data: result } })
      }, 800)
    } catch (err) {
      setError(err.message || 'Research failed')
      setIsLoading(false)
    }
  }

  async function handleBatchSubmit(urls) {
    setIsLoading(true)
    setError('')
    setIsComplete(false)

    try {
      const results = await researchBatch(urls)
      setIsComplete(true)
      const firstSuccess = results.find(r => r.status === 'success')
      if (firstSuccess) {
        setTimeout(() => {
          navigate(`/results/${firstSuccess.data.domain}`, { state: { data: firstSuccess.data } })
        }, 800)
      } else {
        setError('All URLs failed to research')
        setIsLoading(false)
      }
    } catch (err) {
      setError(err.message || 'Batch research failed')
      setIsLoading(false)
    }
  }

  return (
    <div className="px-4 sm:px-6">
      <section className="max-w-4xl mx-auto pt-16 pb-12 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700
                        rounded-full text-sm font-medium mb-6">
          <Sparkles className="w-4 h-4" />
          AI-Powered Lead Research
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight mb-4">
          Know everything about a company
          <br />
          <span className="text-indigo-600">in 30 seconds</span>
        </h1>

        <p className="text-lg text-slate-600 mb-10 max-w-xl mx-auto">
          Paste a company URL and get a comprehensive research brief with pain points,
          outreach angles, and personalized talking points.
        </p>

        {isLoading ? (
          <ResearchProgress isComplete={isComplete} error={error} />
        ) : (
          <>
            {mode === 'single' ? (
              <SearchBar
                onSubmit={handleSingleSubmit}
                isLoading={isLoading}
                onSwitchToBatch={() => setMode('batch')}
              />
            ) : (
              <BatchInput
                onSubmit={handleBatchSubmit}
                isLoading={isLoading}
                onSwitchToSingle={() => setMode('single')}
              />
            )}
            {error && !isLoading && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
                <button
                  onClick={() => setError('')}
                  className="mt-2 text-sm text-red-700 font-medium hover:underline cursor-pointer"
                >
                  Try again
                </button>
              </div>
            )}
          </>
        )}
      </section>

      <RecentSearches />
    </div>
  )
}
