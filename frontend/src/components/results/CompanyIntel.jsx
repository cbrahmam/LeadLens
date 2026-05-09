import { Building2, MapPin, Users, TrendingUp, Cpu } from 'lucide-react'

export default function CompanyIntel({ brief, enrichedData }) {
  const funding = enrichedData?.funding

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <h2 className="text-lg font-semibold text-slate-800 mb-4">Company Intel</h2>

      <div className="space-y-3">
        {enrichedData?.industry && (
          <div className="flex items-center gap-2 text-sm">
            <Building2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <span className="text-slate-500">Industry:</span>
            <span className="text-slate-700">{enrichedData.industry}</span>
          </div>
        )}

        {enrichedData?.headquarters && (
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <span className="text-slate-500">HQ:</span>
            <span className="text-slate-700">{enrichedData.headquarters}</span>
          </div>
        )}

        {enrichedData?.estimated_size && (
          <div className="flex items-center gap-2 text-sm">
            <Users className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <span className="text-slate-500">Size:</span>
            <span className="text-slate-700">{enrichedData.estimated_size}</span>
          </div>
        )}

        {funding && (
          <div className="flex items-start gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-slate-500">Funding: </span>
              {funding.total_raised && (
                <span className="text-slate-700 font-medium">{funding.total_raised}</span>
              )}
              {funding.last_round && (
                <span className="text-slate-600"> ({funding.last_round})</span>
              )}
            </div>
          </div>
        )}
      </div>

      {enrichedData?.tech_stack?.length > 0 && (
        <div className="mt-5">
          <div className="flex items-center gap-2 mb-2">
            <Cpu className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Tech Stack</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {enrichedData.tech_stack.map(tech => (
              <span
                key={tech}
                className="px-2 py-0.5 text-xs bg-slate-100 text-slate-600 rounded-md"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      )}

      {brief.tech_stack_analysis && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
            Tech Analysis
          </p>
          <p className="text-sm text-slate-600">{brief.tech_stack_analysis}</p>
        </div>
      )}
    </div>
  )
}
