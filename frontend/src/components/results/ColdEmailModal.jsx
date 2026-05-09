import { useState, useEffect } from 'react'
import { X, Loader2, Copy, Check } from 'lucide-react'
import { generateColdEmail } from '../../api/client'
import { useToast } from '../../utils/toastContext'

export default function ColdEmailModal({ brief, angleIndex, onClose }) {
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    generateColdEmail(brief, angleIndex)
      .then(setEmail)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [brief, angleIndex])

  async function handleCopy() {
    if (!email) return
    const text = `Subject: ${email.subject}\n\n${email.body}`
    await navigator.clipboard.writeText(text)
    setCopied(true)
    showToast('Email copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
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

        <h3 className="text-lg font-semibold text-slate-800 mb-4">Generated Cold Email</h3>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
            <span className="ml-2 text-sm text-slate-500">Generating email...</span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {email && (
          <>
            <div className="mb-3">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Subject
              </label>
              <p className="text-sm font-medium text-slate-800 mt-1">{email.subject}</p>
            </div>

            <div className="mb-4">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Body
              </label>
              <textarea
                defaultValue={email.body}
                rows={6}
                className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg
                         text-sm font-medium hover:bg-indigo-700 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy Email'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
