import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Kanban, Loader2, Trash2, ArrowRight, ChevronRight } from 'lucide-react'
import { getPipeline, updatePipelineStage, removeFromPipeline } from '../api/client'
import { useToast } from '../utils/toastContext'

const STAGES = [
  { key: 'new', label: 'New', color: 'bg-slate-100 text-slate-700 border-slate-300' },
  { key: 'contacted', label: 'Contacted', color: 'bg-blue-50 text-blue-700 border-blue-300' },
  { key: 'replied', label: 'Replied', color: 'bg-amber-50 text-amber-700 border-amber-300' },
  { key: 'meeting', label: 'Meeting', color: 'bg-purple-50 text-purple-700 border-purple-300' },
  { key: 'closed_won', label: 'Won', color: 'bg-emerald-50 text-emerald-700 border-emerald-300' },
  { key: 'closed_lost', label: 'Lost', color: 'bg-red-50 text-red-700 border-red-300' },
]

export default function PipelinePage() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { showToast } = useToast()

  useEffect(() => {
    getPipeline()
      .then(setEntries)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleStageChange(domain, newStage) {
    try {
      const updated = await updatePipelineStage(domain, newStage)
      setEntries(prev => prev.map(e => e.domain === domain ? updated : e))
      showToast(`Moved to ${STAGES.find(s => s.key === newStage)?.label}`)
    } catch {
      showToast('Failed to update stage', 'error')
    }
  }

  async function handleRemove(domain) {
    try {
      await removeFromPipeline(domain)
      setEntries(prev => prev.filter(e => e.domain !== domain))
      showToast('Removed from pipeline')
    } catch {
      showToast('Failed to remove', 'error')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
        <span className="ml-2 text-slate-500">Loading pipeline...</span>
      </div>
    )
  }

  const grouped = {}
  for (const stage of STAGES) {
    grouped[stage.key] = entries.filter(e => e.stage === stage.key)
  }

  const totalCount = entries.length

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Kanban className="w-6 h-6 text-indigo-600" />
            Outreach Pipeline
          </h1>
          <p className="text-sm text-slate-500 mt-1">{totalCount} leads in pipeline</p>
        </div>
        <Link to="/" className="text-sm text-indigo-600 hover:underline">
          Back to Search
        </Link>
      </div>

      {totalCount === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <Kanban className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-600 font-medium mb-2">Pipeline is empty</p>
          <p className="text-sm text-slate-400 mb-4">
            Add companies to the pipeline from the research results page
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white
                       rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            Start Researching
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {STAGES.map(stage => (
            <div key={stage.key} className="min-h-[200px]">
              <div className={`rounded-t-lg border-t-4 ${stage.color} px-3 py-2 mb-2`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{stage.label}</span>
                  <span className="text-xs font-medium opacity-70">
                    {grouped[stage.key].length}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                {grouped[stage.key].map(entry => (
                  <div
                    key={entry.domain}
                    className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm
                               hover:shadow-md transition-shadow"
                  >
                    <button
                      onClick={() => navigate(`/results/${entry.domain}`)}
                      className="text-left w-full cursor-pointer"
                    >
                      <p className="text-sm font-medium text-slate-800 hover:text-indigo-600
                                    transition-colors truncate">
                        {entry.company_name}
                      </p>
                      <p className="text-xs text-slate-400 truncate">{entry.domain}</p>
                    </button>

                    {entry.notes && (
                      <p className="text-xs text-slate-500 mt-1.5 bg-slate-50 rounded px-2 py-1 truncate">
                        {entry.notes}
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                      <select
                        value={entry.stage}
                        onChange={(e) => handleStageChange(entry.domain, e.target.value)}
                        className="text-xs border border-slate-200 rounded px-1.5 py-0.5
                                   focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                      >
                        {STAGES.map(s => (
                          <option key={s.key} value={s.key}>{s.label}</option>
                        ))}
                      </select>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => navigate(`/results/${entry.domain}`)}
                          className="p-1 text-slate-400 hover:text-indigo-600 rounded
                                     transition-colors cursor-pointer"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleRemove(entry.domain)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded
                                     transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
