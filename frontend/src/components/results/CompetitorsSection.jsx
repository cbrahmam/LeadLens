import { Swords } from 'lucide-react'

export default function CompetitorsSection({ competitors }) {
  if (!competitors || competitors.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Competitors</h2>
        <p className="text-sm text-slate-500">No direct competitors identified</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <Swords className="w-5 h-5 text-slate-400" />
        Competitors
      </h2>
      <div className="space-y-2">
        {competitors.map((c, i) => (
          <div key={i} className="flex items-start gap-2 text-sm">
            <span className="font-medium text-slate-700 flex-shrink-0">{c.competitor}</span>
            <span className="text-slate-400">—</span>
            <span className="text-slate-600">{c.relationship}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
