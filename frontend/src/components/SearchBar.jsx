import { useState } from 'react'
import { Search, Loader2, List } from 'lucide-react'

export default function SearchBar({ onSubmit, isLoading, onSwitchToBatch }) {
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = url.trim()
    if (!trimmed) {
      setError('Please enter a URL')
      return
    }
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      setError('URL must start with http:// or https://')
      return
    }
    setError('')
    onSubmit(trimmed)
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={url}
            onChange={(e) => { setUrl(e.target.value); setError('') }}
            placeholder="Paste a company URL (e.g., https://stripe.com)"
            disabled={isLoading}
            className="w-full px-4 py-3 text-base border border-slate-300 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                       disabled:opacity-50 disabled:bg-slate-100
                       placeholder:text-slate-400"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium
                     flex items-center gap-2 hover:bg-indigo-700 transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Search className="w-5 h-5" />
          )}
          Research
        </button>
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-500 text-left">{error}</p>
      )}
      <button
        type="button"
        onClick={onSwitchToBatch}
        className="mt-3 text-sm text-slate-500 hover:text-indigo-600 transition-colors
                   flex items-center gap-1 mx-auto cursor-pointer"
      >
        <List className="w-4 h-4" />
        Research multiple companies
      </button>
    </form>
  )
}
