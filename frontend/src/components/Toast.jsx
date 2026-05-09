import { Check, X, Info } from 'lucide-react'

const STYLES = {
  success: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', Icon: Check },
  error: { bg: 'bg-red-50 border-red-200', text: 'text-red-700', Icon: X },
  info: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', Icon: Info },
}

export default function Toast({ message, type = 'success', onClose }) {
  const style = STYLES[type] || STYLES.success
  const Icon = style.Icon

  return (
    <div className={`flex items-center gap-2 px-4 py-3 rounded-lg border shadow-lg
                     animate-fade-in ${style.bg}`}>
      <Icon className={`w-4 h-4 flex-shrink-0 ${style.text}`} />
      <span className={`text-sm font-medium ${style.text}`}>{message}</span>
      <button
        onClick={onClose}
        className={`ml-2 ${style.text} opacity-60 hover:opacity-100 cursor-pointer`}
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
