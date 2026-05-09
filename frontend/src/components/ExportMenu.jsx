import { useState, useRef, useEffect } from 'react'
import { Download, FileText, FileJson, FileDown } from 'lucide-react'
import { useToast } from '../utils/toastContext'
import { briefToMarkdown } from '../utils/exportMarkdown'
import { exportPdf } from '../utils/exportPdf'

export default function ExportMenu({ brief, enrichedData }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const { showToast } = useToast()

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleMarkdown() {
    const md = briefToMarkdown(brief, enrichedData)
    await navigator.clipboard.writeText(md)
    showToast('Copied as Markdown')
    setOpen(false)
  }

  function handleJson() {
    const blob = new Blob([JSON.stringify({ brief, enrichedData }, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${brief.company_name.replace(/[^a-zA-Z0-9]/g, '-')}-research.json`
    a.click()
    URL.revokeObjectURL(url)
    showToast('JSON downloaded')
    setOpen(false)
  }

  async function handlePdf() {
    try {
      await exportPdf(brief, enrichedData)
      showToast('PDF downloaded')
    } catch {
      showToast('PDF export failed', 'error')
    }
    setOpen(false)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-slate-200
                   rounded-lg text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
      >
        <Download className="w-4 h-4" />
        Export
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg
                        shadow-lg z-10 py-1 animate-fade-in">
          <button
            onClick={handleMarkdown}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700
                       hover:bg-slate-50 cursor-pointer"
          >
            <FileText className="w-4 h-4 text-slate-400" />
            Copy as Markdown
          </button>
          <button
            onClick={handleJson}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700
                       hover:bg-slate-50 cursor-pointer"
          >
            <FileJson className="w-4 h-4 text-slate-400" />
            Download JSON
          </button>
          <button
            onClick={handlePdf}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700
                       hover:bg-slate-50 cursor-pointer"
          >
            <FileDown className="w-4 h-4 text-slate-400" />
            Download PDF
          </button>
        </div>
      )}
    </div>
  )
}
