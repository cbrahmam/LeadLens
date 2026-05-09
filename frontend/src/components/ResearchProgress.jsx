import { useEffect, useState } from 'react'
import { Globe, Database, Brain, FileText, Check, Loader2 } from 'lucide-react'

const STEPS = [
  { label: 'Scraping website...', icon: Globe, delay: 0 },
  { label: 'Enriching company data...', icon: Database, delay: 3000 },
  { label: 'AI is analyzing...', icon: Brain, delay: 6000 },
  { label: 'Generating research brief...', icon: FileText, delay: 9000 },
]

export default function ResearchProgress({ isComplete, error }) {
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    if (isComplete) {
      setActiveStep(STEPS.length)
      return
    }

    const timers = STEPS.map((step, i) => {
      if (i === 0) return null
      return setTimeout(() => setActiveStep(i), step.delay)
    })

    return () => timers.forEach(t => t && clearTimeout(t))
  }, [isComplete])

  if (error) {
    return (
      <div className="w-full max-w-md mx-auto animate-fade-in">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700 font-medium mb-2">Research Failed</p>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-3 animate-fade-in">
      {STEPS.map((step, i) => {
        const Icon = step.icon
        const completed = isComplete || i < activeStep
        const active = !isComplete && i === activeStep

        return (
          <div
            key={i}
            className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300
                       ${completed ? 'bg-emerald-50' : active ? 'bg-indigo-50' : 'bg-slate-50 opacity-40'}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                           ${completed ? 'bg-emerald-500 text-white' : active ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-400'}`}>
              {completed ? (
                <Check className="w-4 h-4" />
              ) : active ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Icon className="w-4 h-4" />
              )}
            </div>
            <span className={`text-sm font-medium
                            ${completed ? 'text-emerald-700' : active ? 'text-indigo-700' : 'text-slate-400'}`}>
              {completed ? step.label.replace('...', '') + ' ✓' : step.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
