import { useState, useEffect } from 'react'
import { X, Loader2, Copy, Check, Globe } from 'lucide-react'
import { generateLinkedInMessage } from '../../api/client'
import { useToast } from '../../utils/toastContext'

export default function LinkedInModal({ brief, contactIndex, onClose }) {
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState('')
  const [copiedField, setCopiedField] = useState(null)
  const { showToast } = useToast()

  useEffect(() => {
    generateLinkedInMessage(brief, contactIndex)
      .then(setMessage)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [brief, contactIndex])

  async function handleCopy(text, field) {
    await navigator.clipboard.writeText(text)
    setCopiedField(field)
    showToast(`${field === 'note' ? 'Connection note' : 'Follow-up message'} copied`)
    setTimeout(() => setCopiedField(null), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full p-6 animate-fade-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-semibold text-slate-800 mb-1 flex items-center gap-2">
          <Globe className="w-5 h-5 text-blue-600" />
          LinkedIn Outreach
        </h3>
        {message && (
          <p className="text-sm text-slate-500 mb-4">For {message.contact_name}</p>
        )}

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            <span className="ml-2 text-sm text-slate-500">Generating messages...</span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {message && (
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Connection Request Note
                </label>
                <span className="text-xs text-slate-400">
                  {message.connection_note.length}/300 chars
                </span>
              </div>
              <textarea
                defaultValue={message.connection_note}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <button
                onClick={() => handleCopy(message.connection_note, 'note')}
                className="mt-2 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium
                           border border-blue-200 rounded-md text-blue-600
                           hover:bg-blue-50 transition-colors cursor-pointer"
              >
                {copiedField === 'note' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedField === 'note' ? 'Copied!' : 'Copy Note'}
              </button>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Follow-up Message
              </label>
              <textarea
                defaultValue={message.follow_up_message}
                rows={5}
                className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <button
                onClick={() => handleCopy(message.follow_up_message, 'followup')}
                className="mt-2 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium
                           border border-blue-200 rounded-md text-blue-600
                           hover:bg-blue-50 transition-colors cursor-pointer"
              >
                {copiedField === 'followup' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedField === 'followup' ? 'Copied!' : 'Copy Message'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
