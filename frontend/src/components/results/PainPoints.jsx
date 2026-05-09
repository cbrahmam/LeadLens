import { AlertTriangle } from 'lucide-react'

const CONFIDENCE_STYLES = {
  high: 'border-solid border-emerald-300 bg-emerald-50/50',
  medium: 'border-dashed border-amber-300 bg-amber-50/30',
  low: 'border-dotted border-slate-300 bg-slate-50/50',
}

const CONFIDENCE_BADGE = {
  high: 'bg-emerald-100 text-emerald-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-slate-100 text-slate-600',
}

export default function PainPoints({ painPoints }) {
  const sorted = [...(painPoints || [])].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 }
    return (order[a.confidence] ?? 3) - (order[b.confidence] ?? 3)
  })

  if (sorted.length === 0) return null

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-amber-500" />
        Identified Pain Points
      </h2>

      <div className="space-y-3">
        {sorted.map((point, i) => (
          <div
            key={i}
            className={`p-4 rounded-lg border-2 ${CONFIDENCE_STYLES[point.confidence]}`}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-slate-800">{point.pain}</p>
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0 ${CONFIDENCE_BADGE[point.confidence]}`}>
                {point.confidence}
              </span>
            </div>
            <p className="text-sm text-slate-600 mt-2">{point.evidence}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
