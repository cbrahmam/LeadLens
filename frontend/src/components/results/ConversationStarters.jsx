import { MessageCircle } from 'lucide-react'
import CopyButton from '../ui/CopyButton'

export default function ConversationStarters({ starters }) {
  if (!starters || starters.length === 0) return null

  const allText = starters.map((s, i) => `${i + 1}. ${s}`).join('\n')

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-indigo-500" />
          Conversation Starters
        </h2>
        <CopyButton text={allText} label="Copy all" />
      </div>

      <div className="space-y-2">
        {starters.map((starter, i) => (
          <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
            <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs
                           font-semibold flex items-center justify-center flex-shrink-0">
              {i + 1}
            </span>
            <p className="text-sm text-slate-700">{starter}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
