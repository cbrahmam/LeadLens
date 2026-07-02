import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BarChart3, Building2, Target, TrendingUp, ArrowRight, Loader2 } from 'lucide-react'
import { getAnalytics } from '../api/client'

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    getAnalytics()
      .then(setAnalytics)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
        <span className="ml-2 text-slate-500">Loading analytics...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 pt-16 text-center">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <p className="text-red-700 font-medium mb-2">Failed to load analytics</p>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  if (!analytics) return null

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
            Research Analytics
          </h1>
          <p className="text-sm text-slate-500 mt-1">Insights across all your company research</p>
        </div>
        <Link
          to="/"
          className="text-sm text-indigo-600 hover:underline"
        >
          Back to Search
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={Building2}
          label="Companies Researched"
          value={analytics.total_researched}
          color="indigo"
        />
        <StatCard
          icon={Target}
          label="Avg Confidence"
          value={analytics.avg_confidence}
          color="emerald"
        />
        <StatCard
          icon={TrendingUp}
          label="Avg Lead Score"
          value={analytics.avg_lead_score != null ? analytics.avg_lead_score : 'N/A'}
          color="blue"
        />
        <StatCard
          icon={BarChart3}
          label="Industries Covered"
          value={analytics.top_industries.length}
          color="amber"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {analytics.stage_distribution.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Company Stage Distribution</h3>
            <div className="space-y-3">
              {analytics.stage_distribution.map(({ stage, count }) => {
                const pct = analytics.total_researched > 0
                  ? Math.round((count / analytics.total_researched) * 100)
                  : 0
                return (
                  <div key={stage}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">{stage}</span>
                      <span className="text-slate-400">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {analytics.top_industries.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Top Industries</h3>
            <div className="space-y-3">
              {analytics.top_industries.map(({ name, count }) => {
                const maxCount = analytics.top_industries[0]?.count || 1
                const pct = Math.round((count / maxCount) * 100)
                return (
                  <div key={name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600 truncate mr-2">{name}</span>
                      <span className="text-slate-400 flex-shrink-0">{count}</span>
                    </div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {analytics.recent_activity.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Recent Activity</h3>
          <div className="divide-y divide-slate-100">
            {analytics.recent_activity.map((item) => (
              <button
                key={item.domain}
                onClick={() => navigate(`/results/${item.domain}`)}
                className="w-full flex items-center justify-between py-3 text-left
                           hover:bg-slate-50 -mx-2 px-2 rounded-lg transition-colors cursor-pointer"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {item.company_name || item.domain}
                  </p>
                  <p className="text-xs text-slate-400">{item.domain}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">
                    {item.researched_at ? new Date(item.researched_at).toLocaleDateString() : ''}
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-300" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }) {
  const colorClasses = {
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${colorClasses[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-sm text-slate-500 mt-0.5">{label}</p>
    </div>
  )
}
