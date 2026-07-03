import { useEffect, useState } from 'react'
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { getResearchByDomain, rerunResearch } from '../api/client'
import { useToast } from '../utils/toastContext'

import CompanyHeader from '../components/results/CompanyHeader'
import ExecutiveSummary from '../components/results/ExecutiveSummary'
import CompanyIntel from '../components/results/CompanyIntel'
import KeyContacts from '../components/results/KeyContacts'
import PainPoints from '../components/results/PainPoints'
import OutreachAngles from '../components/results/OutreachAngles'
import CompetitorsSection from '../components/results/CompetitorsSection'
import ConversationStarters from '../components/results/ConversationStarters'
import DataQuality from '../components/results/DataQuality'
import LeadScore from '../components/results/LeadScore'
import FavoriteButton from '../components/results/FavoriteButton'
import PipelineButton from '../components/results/PipelineButton'
import ExportMenu from '../components/ExportMenu'
import { ResultsSkeleton } from '../components/SkeletonLoader'

export default function ResultsPage() {
  const { domain } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [data, setData] = useState(location.state?.data || null)
  const [loading, setLoading] = useState(!data)
  const [error, setError] = useState('')
  const [rerunning, setRerunning] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    if (data) return
    setLoading(true)
    getResearchByDomain(domain)
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [domain, data])

  async function handleRerun() {
    setRerunning(true)
    try {
      const result = await rerunResearch(`https://${domain}`)
      setData(result)
      showToast('Research refreshed with latest data')
    } catch (err) {
      showToast(err.message || 'Re-research failed', 'error')
    } finally {
      setRerunning(false)
    }
  }

  if (loading) return <ResultsSkeleton />

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 pt-16 text-center">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <p className="text-red-700 font-medium mb-2">Failed to load research</p>
          <p className="text-red-600 text-sm mb-4">{error}</p>
          <Link to="/" className="text-indigo-600 hover:underline text-sm">Back to Search</Link>
        </div>
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
  const enrichedData = data.enriched_data

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Search
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRerun}
            disabled={rerunning}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg
                       bg-white border border-slate-200 text-slate-600 hover:bg-slate-50
                       transition-colors cursor-pointer disabled:opacity-50"
            title="Re-research with fresh data"
          >
            <RefreshCw className={`w-4 h-4 ${rerunning ? 'animate-spin' : ''}`} />
            {rerunning ? 'Refreshing...' : 'Re-research'}
          </button>
          <PipelineButton domain={domain} companyName={brief.company_name} />
          <FavoriteButton domain={domain} />
          <ExportMenu brief={brief} enrichedData={enrichedData} />
        </div>
      </div>

      <CompanyHeader brief={brief} enrichedData={enrichedData} />

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 lg:w-[70%] space-y-6">
          <ExecutiveSummary brief={brief} />
          <PainPoints painPoints={brief.pain_points} />
          <OutreachAngles angles={brief.outreach_angles} brief={brief} />
          <ConversationStarters starters={brief.conversation_starters} />
        </div>

        <div className="lg:w-[30%] space-y-6">
          <div className="lg:sticky lg:top-4 space-y-6 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
            <LeadScore domain={domain} />
            <CompanyIntel brief={brief} enrichedData={enrichedData} />
            <KeyContacts
              contacts={brief.key_contacts}
              companyName={brief.company_name}
              brief={brief}
            />
            <CompetitorsSection competitors={brief.competitors} />
          </div>
        </div>
      </div>

      <DataQuality
        brief={brief}
        enrichedData={enrichedData}
        researchedAt={data.researched_at}
      />
    </div>
  )
}
