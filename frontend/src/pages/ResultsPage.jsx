import { useEffect, useState } from 'react'
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { getResearchByDomain } from '../api/client'

import CompanyHeader from '../components/results/CompanyHeader'
import ExecutiveSummary from '../components/results/ExecutiveSummary'
import CompanyIntel from '../components/results/CompanyIntel'
import KeyContacts from '../components/results/KeyContacts'
import PainPoints from '../components/results/PainPoints'
import OutreachAngles from '../components/results/OutreachAngles'
import CompetitorsSection from '../components/results/CompetitorsSection'
import ConversationStarters from '../components/results/ConversationStarters'
import DataQuality from '../components/results/DataQuality'
import ExportMenu from '../components/ExportMenu'
import { ResultsSkeleton } from '../components/SkeletonLoader'

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
        <ExportMenu brief={brief} enrichedData={enrichedData} />
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
            <CompanyIntel brief={brief} enrichedData={enrichedData} />
            <KeyContacts
              contacts={brief.key_contacts}
              companyName={brief.company_name}
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
