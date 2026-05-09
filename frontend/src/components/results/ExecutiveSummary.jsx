import { Briefcase, Users, DollarSign } from 'lucide-react'

export default function ExecutiveSummary({ brief }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <h2 className="text-lg font-semibold text-slate-800 mb-3">Executive Summary</h2>
      <p className="text-slate-700 leading-relaxed">{brief.executive_summary}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
            <Briefcase className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Business Model</p>
            <p className="text-sm text-slate-700 mt-0.5">{brief.business_model}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Target Market</p>
            <p className="text-sm text-slate-700 mt-0.5">{brief.target_market}</p>
          </div>
        </div>
      </div>

      {brief.estimated_arr && (
        <div className="mt-4 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-emerald-500" />
          <span className="text-sm font-medium text-slate-700">
            Est. ARR: <span className="text-emerald-600">{brief.estimated_arr}</span>
          </span>
        </div>
      )}
    </div>
  )
}
