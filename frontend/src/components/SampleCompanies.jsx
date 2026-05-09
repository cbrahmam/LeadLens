import { useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'

const SAMPLES = [
  { domain: 'notion.so', name: 'Notion', description: 'All-in-one workspace for notes, docs, and projects' },
  { domain: 'linear.app', name: 'Linear', description: 'Issue tracking and project management for teams' },
  { domain: 'vercel.com', name: 'Vercel', description: 'Frontend cloud platform for web development' },
]

export default function SampleCompanies() {
  const navigate = useNavigate()

  return (
    <div className="w-full max-w-4xl mx-auto mt-12 mb-16">
      <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-indigo-400" />
        Try a Sample
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {SAMPLES.map(s => (
          <button
            key={s.domain}
            onClick={() => navigate(`/results/${s.domain}`)}
            className="bg-white border border-slate-200 rounded-xl p-4 text-left
                       hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2 mb-2">
              <img
                src={`https://www.google.com/s2/favicons?domain=${s.domain}&sz=32`}
                alt=""
                className="w-6 h-6 rounded"
              />
              <span className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">
                {s.name}
              </span>
            </div>
            <p className="text-sm text-slate-500">{s.description}</p>
            <p className="text-xs text-indigo-500 mt-2 font-medium">View Research →</p>
          </button>
        ))}
      </div>
    </div>
  )
}
