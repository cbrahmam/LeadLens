import { useState, useEffect } from 'react'
import { X, Loader2, Copy, Check, Mail, Calendar } from 'lucide-react'
import { generateEmailSequence } from '../../api/client'
import { useToast } from '../../utils/toastContext'

export default function EmailSequenceModal({ brief, angleIndex, onClose }) {
  const [loading, setLoading] = useState(true)
  const [sequence, setSequence] = useState(null)
  const [error, setError] = useState('')
  const [copiedStep, setCopiedStep] = useState(null)
  const { showToast } = useToast()

  useEffect(() => {
    generateEmailSequence(brief, angleIndex)
      .then(setSequence)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [brief, angleIndex])

  async function handleCopy(email, step) {
    const text = `Subject: ${email.subject}\n\n${email.body}`
    await navigator.clipboard.writeText(text)
    setCopiedStep(step)
    showToast(`Email ${step} copied`)
    setTimeout(() => setCopiedStep(null), 2000)
  }

  async function handleCopyAll() {
    if (!sequence) return
    const text = sequence.emails
      .map(e => `--- Email ${e.step}: ${e.purpose} (Day ${e.send_day}) ---\nSubject: ${e.subject}\n\n${e.body}`)
      .join('\n\n')
    await navigator.clipboard.writeText(text)
    showToast('Full sequence copied')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 animate-fade-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-semibold text-slate-800 mb-1 flex items-center gap-2">
          <Mail className="w-5 h-5 text-indigo-600" />
          Email Sequence
        </h3>
        {sequence && (
          <p className="text-sm text-slate-500 mb-4">
            {sequence.total_steps}-step drip for: {sequence.angle_used}
          </p>
        )}

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
            <span className="ml-2 text-sm text-slate-500">Generating sequence...</span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {sequence && (
          <>
            <div className="space-y-5">
              {sequence.emails.map((email) => (
                <div
                  key={email.step}
                  className="border border-slate-200 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700
                                       text-xs font-bold flex items-center justify-center">
                        {email.step}
                      </span>
                      <span className="text-sm font-medium text-slate-700">{email.purpose}</span>
                    </div>
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <Calendar className="w-3.5 h-3.5" />
                      Day {email.send_day}
                    </span>
                  </div>

                  <div className="mb-2">
                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                      Subject
                    </label>
                    <p className="text-sm font-medium text-slate-800 mt-0.5">{email.subject}</p>
                  </div>

                  <div className="mb-3">
                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                      Body
                    </label>
                    <textarea
                      defaultValue={email.body}
                      rows={4}
                      className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg
                                 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    />
                  </div>

                  <button
                    onClick={() => handleCopy(email, email.step)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium
                               border border-indigo-200 rounded-md text-indigo-600
                               hover:bg-indigo-50 transition-colors cursor-pointer"
                  >
                    {copiedStep === email.step
                      ? <><Check className="w-3.5 h-3.5" /> Copied</>
                      : <><Copy className="w-3.5 h-3.5" /> Copy</>
                    }
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={handleCopyAll}
              className="mt-4 flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg
                         text-sm font-medium hover:bg-indigo-700 transition-colors cursor-pointer"
            >
              <Copy className="w-4 h-4" />
              Copy Full Sequence
            </button>
          </>
        )}
      </div>
    </div>
  )
}
