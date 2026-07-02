import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Star, Trash2, Edit3, Check, X, Loader2, ArrowRight } from 'lucide-react'
import { getFavorites, removeFavorite, updateFavorite } from '../api/client'
import { useToast } from '../utils/toastContext'

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingDomain, setEditingDomain] = useState(null)
  const [editNotes, setEditNotes] = useState('')
  const navigate = useNavigate()
  const { showToast } = useToast()

  useEffect(() => {
    getFavorites()
      .then(setFavorites)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleRemove(domain) {
    try {
      await removeFavorite(domain)
      setFavorites(prev => prev.filter(f => f.domain !== domain))
      showToast('Removed from favorites')
    } catch {
      showToast('Failed to remove', 'error')
    }
  }

  async function handleSaveNotes(domain) {
    try {
      await updateFavorite(domain, editNotes)
      setFavorites(prev =>
        prev.map(f => f.domain === domain ? { ...f, notes: editNotes } : f)
      )
      setEditingDomain(null)
      showToast('Notes updated')
    } catch {
      showToast('Failed to update notes', 'error')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
        <span className="ml-2 text-slate-500">Loading favorites...</span>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Star className="w-6 h-6 text-amber-500" />
            Saved Leads
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {favorites.length} {favorites.length === 1 ? 'lead' : 'leads'} saved
          </p>
        </div>
        <Link to="/" className="text-sm text-indigo-600 hover:underline">
          Back to Search
        </Link>
      </div>

      {favorites.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <Star className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-600 font-medium mb-2">No saved leads yet</p>
          <p className="text-sm text-slate-400 mb-4">
            Research a company and click the star to save it here
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white
                       rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            Start Researching
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {favorites.map((fav) => (
            <div
              key={fav.domain}
              className="bg-white border border-slate-200 rounded-xl p-5 hover:border-indigo-200 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <button
                  onClick={() => navigate(`/results/${fav.domain}`)}
                  className="flex-1 text-left cursor-pointer"
                >
                  <p className="font-semibold text-slate-800 hover:text-indigo-600 transition-colors">
                    {fav.company_name}
                  </p>
                  <p className="text-sm text-slate-500">{fav.domain}</p>
                </button>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => {
                      setEditingDomain(fav.domain)
                      setEditNotes(fav.notes || '')
                    }}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-md
                               hover:bg-indigo-50 transition-colors cursor-pointer"
                    title="Edit notes"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleRemove(fav.domain)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-md
                               hover:bg-red-50 transition-colors cursor-pointer"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => navigate(`/results/${fav.domain}`)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-md
                               hover:bg-indigo-50 transition-colors cursor-pointer"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {editingDomain === fav.domain ? (
                <div className="mt-3">
                  <textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Add notes about this lead..."
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg
                               focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => handleSaveNotes(fav.domain)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium
                                 bg-indigo-600 text-white rounded-md hover:bg-indigo-700
                                 transition-colors cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Save
                    </button>
                    <button
                      onClick={() => setEditingDomain(null)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium
                                 border border-slate-200 text-slate-600 rounded-md
                                 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : fav.notes ? (
                <p className="mt-3 text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2">
                  {fav.notes}
                </p>
              ) : null}

              <p className="text-xs text-slate-400 mt-3">
                Saved {new Date(fav.saved_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
