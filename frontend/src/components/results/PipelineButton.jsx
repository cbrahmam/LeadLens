import { useState, useEffect } from 'react'
import { Kanban } from 'lucide-react'
import { getPipeline, addToPipeline } from '../../api/client'
import { useToast } from '../../utils/toastContext'

export default function PipelineButton({ domain, companyName }) {
  const [inPipeline, setInPipeline] = useState(false)
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    getPipeline()
      .then(entries => setInPipeline(entries.some(e => e.domain === domain)))
      .catch(() => {})
  }, [domain])

  async function handleAdd() {
    setLoading(true)
    try {
      await addToPipeline(domain, companyName)
      setInPipeline(true)
      showToast('Added to pipeline')
    } catch {
      showToast('Failed to add to pipeline', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (inPipeline) {
    return (
      <span className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg
                        bg-emerald-50 border border-emerald-200 text-emerald-700">
        <Kanban className="w-4 h-4" />
        In Pipeline
      </span>
    )
  }

  return (
    <button
      onClick={handleAdd}
      disabled={loading}
      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg
                 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50
                 transition-colors cursor-pointer disabled:opacity-50"
    >
      <Kanban className="w-4 h-4" />
      Add to Pipeline
    </button>
  )
}
