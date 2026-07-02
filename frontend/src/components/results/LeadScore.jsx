import { useEffect, useState } from 'react'
import { TrendingUp, Zap } from 'lucide-react'
import { getLeadScore } from '../../api/client'

const GRADE_COLORS = {
  A: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  B: 'text-blue-600 bg-blue-50 border-blue-200',
  C: 'text-amber-600 bg-amber-50 border-amber-200',
  D: 'text-red-600 bg-red-50 border-red-200',
}

const BAR_COLORS = {
  pain_points: 'bg-rose-500',
  data_richness: 'bg-blue-500',
  contacts: 'bg-amber-500',
  engagement_potential: 'bg-emerald-500',
}

const LABELS = {
  pain_points: 'Pain Points',
  data_richness: 'Data Richness',
  contacts: 'Contacts',
  engagement_potential: 'Engagement',
}

const MAX_SCORES = {
  pain_points: 25,
  data_richness: 25,
  contacts: 20,
  engagement_potential: 30,
}

export default function LeadScore({ domain }) {
  const [score, setScore] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getLeadScore(domain)
      .then(setScore)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [domain])

  if (loading || !score) return null

  const gradeColor = GRADE_COLORS[score.grade] || GRADE_COLORS.D

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-indigo-600" />
        Lead Score
      </h2>

      <div className="flex items-center gap-4 mb-5">
        <div className={`w-16 h-16 rounded-xl border-2 flex items-center justify-center ${gradeColor}`}>
          <span className="text-2xl font-bold">{score.grade}</span>
        </div>
        <div>
          <p className="text-3xl font-bold text-slate-900">{score.total_score}</p>
          <p className="text-sm text-slate-500">out of 100</p>
        </div>
      </div>

      <div className="space-y-3 mb-5">
        {Object.entries(score.breakdown).map(([key, value]) => (
          <div key={key}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-600">{LABELS[key]}</span>
              <span className="text-slate-400">{value}/{MAX_SCORES[key]}</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${BAR_COLORS[key]}`}
                style={{ width: `${(value / MAX_SCORES[key]) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {score.top_signals.length > 0 && (
        <div className="border-t border-slate-100 pt-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5" />
            Key Signals
          </p>
          <ul className="space-y-1.5">
            {score.top_signals.map((signal, i) => (
              <li key={i} className="text-sm text-slate-600 flex items-start gap-1.5">
                <span className="text-emerald-500 mt-0.5">+</span>
                {signal}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
