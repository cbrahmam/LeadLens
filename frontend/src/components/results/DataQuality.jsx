import { Info } from 'lucide-react'

export default function DataQuality({ brief, enrichedData, researchedAt }) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mt-6">
      <h3 className="text-sm font-medium text-slate-500 flex items-center gap-1.5 mb-3">
        <Info className="w-4 h-4" />
        Data Quality & Sources
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Confidence</p>
          <p className="text-slate-600 capitalize">{brief.research_confidence}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Researched</p>
          <p className="text-slate-600">
            {researchedAt ? new Date(researchedAt).toLocaleString() : 'Unknown'}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Pages Scraped</p>
          <p className="text-slate-600">
            {(enrichedData?.raw_scraped?.subpages_scraped?.length || 0) + 1}
          </p>
        </div>
      </div>

      {brief.data_gaps?.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-200">
          <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Data Gaps</p>
          <ul className="space-y-1">
            {brief.data_gaps.map((gap, i) => (
              <li key={i} className="text-sm text-slate-500 flex items-start gap-1.5">
                <span className="text-slate-300 mt-1">•</span>
                {gap}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
