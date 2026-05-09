import { ExternalLink, Globe } from 'lucide-react'

const CONFIDENCE_COLORS = {
  high: 'bg-emerald-100 text-emerald-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-red-100 text-red-700',
}

export default function CompanyHeader({ brief, enrichedData }) {
  const socialLinks = enrichedData?.social_links || {}

  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{brief.company_name}</h1>
          <p className="text-lg text-slate-600 mt-1">{brief.one_liner}</p>

          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span className="px-3 py-1 text-xs font-medium bg-indigo-100 text-indigo-700 rounded-full">
              {brief.company_stage}
            </span>
            <span className={`px-3 py-1 text-xs font-medium rounded-full ${CONFIDENCE_COLORS[brief.research_confidence]}`}>
              {brief.research_confidence} confidence
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {Object.entries(socialLinks).map(([platform, url]) => (
            <a
              key={platform}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-slate-100
                         text-slate-600 rounded-md hover:bg-indigo-100 hover:text-indigo-700 transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              {platform}
            </a>
          ))}
          <a
            href={`https://${enrichedData?.domain}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:underline"
          >
            {enrichedData?.domain}
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  )
}
