import { useState } from 'react'
import { Search, Loader2, ArrowLeft } from 'lucide-react'

export default function BatchInput({ onSubmit, isLoading, onSwitchToSingle }) {
  const [text, setText] = useState('')
  const [error, setError] = useState('')

  const lines = text.split('\n').filter(l => l.trim())
  const validCount = lines.filter(l => l.trim().startsWith('http')).length

  function handleSubmit(e) {
    e.preventDefault()
    if (lines.length === 0) {
      setError('Enter at least one URL')
      return
    }
    if (lines.length > 5) {
      setError('Maximum 5 URLs per batch')
      return
    }
    const invalid = lines.filter(l => !l.trim().startsWith('http'))
    if (invalid.length > 0) {
      setError('All lines must start with http:// or https://')
      return
    }
    setError('')
    onSubmit(lines.map(l => l.trim()))
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <textarea
        value={text}
        onChange={(e) => { setText(e.target.value); setError('') }}
        placeholder={"Paste one URL per line:\nhttps://stripe.com\nhttps://notion.so\nhttps://linear.app"}
        rows={5}
        disabled={isLoading}
        className="w-full px-4 py-3 text-base border border-slate-300 rounded-lg
                   focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                   disabled:opacity-50 disabled:bg-slate-100 resize-none
                   placeholder:text-slate-400"
      />
      <div className="flex items-center justify-between mt-2">
        <span className="text-sm text-slate-500">
          {validCount} of 5 URLs
        </span>
        <button
          type="submit"
          disabled={isLoading || validCount === 0}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium
                     flex items-center gap-2 hover:bg-indigo-700 transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Search className="w-5 h-5" />
          )}
          Research All
        </button>
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-500 text-left">{error}</p>
      )}
      <button
        type="button"
        onClick={onSwitchToSingle}
        className="mt-3 text-sm text-slate-500 hover:text-indigo-600 transition-colors
                   flex items-center gap-1 mx-auto cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Single company search
      </button>
    </form>
  )
}
