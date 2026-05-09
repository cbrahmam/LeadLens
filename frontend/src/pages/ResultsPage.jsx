import { useEffect, useState } from 'react'
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Loader2, Download } from 'lucide-react'
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
        <button
          disabled
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-slate-200
                     rounded-lg text-slate-400 cursor-not-allowed"
          title="Coming in Block 6"
        >
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      <CompanyHeader brief={brief} enrichedData={enrichedData} />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main content */}
        <div className="flex-1 lg:w-[70%] space-y-6">
          <ExecutiveSummary brief={brief} />
          <PainPoints painPoints={brief.pain_points} />
          <OutreachAngles angles={brief.outreach_angles} />
          <ConversationStarters starters={brief.conversation_starters} />
        </div>

        {/* Sidebar */}
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
