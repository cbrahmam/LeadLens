import { useState, useEffect } from 'react'
import { Star } from 'lucide-react'
import { getFavorites, addFavorite, removeFavorite } from '../../api/client'
import { useToast } from '../../utils/toastContext'

export default function FavoriteButton({ domain }) {
  const [isFavorite, setIsFavorite] = useState(false)
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    getFavorites()
      .then(favs => setIsFavorite(favs.some(f => f.domain === domain)))
      .catch(() => {})
  }, [domain])

  async function toggle() {
    setLoading(true)
    try {
      if (isFavorite) {
        await removeFavorite(domain)
        setIsFavorite(false)
        showToast('Removed from favorites')
      } else {
        await addFavorite(domain)
        setIsFavorite(true)
        showToast('Added to favorites')
      }
    } catch (err) {
      if (err.status === 409) {
        setIsFavorite(true)
      } else {
        showToast('Failed to update favorites', 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg
                  border transition-colors cursor-pointer disabled:opacity-50
                  ${isFavorite
                    ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
      title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-500' : ''}`} />
      {isFavorite ? 'Saved' : 'Save'}
    </button>
  )
}
