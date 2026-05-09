import { useState } from 'react'
import { Target, Mail, Phone, Globe } from 'lucide-react'
import CopyButton from '../ui/CopyButton'
import ColdEmailModal from './ColdEmailModal'

const CHANNEL_ICONS = {
  email: Mail,
  linkedin: Globe,
  'cold call': Phone,
}

export default function OutreachAngles({ angles, brief }) {
  const [emailModalIndex, setEmailModalIndex] = useState(null)

  if (!angles || angles.length === 0) return null

  return (
    <>
      <div className="bg-indigo-50/50 border border-indigo-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-indigo-600" />
          Recommended Outreach Angles
        </h2>

        <div className="space-y-4">
          {angles.map((angle, i) => {
            const ChannelIcon = CHANNEL_ICONS[angle.best_channel?.toLowerCase()] || Mail

            return (
              <div key={i} className="bg-white rounded-lg p-5 border border-indigo-100">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold text-slate-800">{angle.approach}</h3>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium
                                 bg-indigo-100 text-indigo-700 rounded-full flex-shrink-0">
                    <ChannelIcon className="w-3 h-3" />
                    {angle.best_channel}
                  </span>
                </div>

                <div className="mt-3 pl-4 border-l-4 border-indigo-400 py-2">
                  <p className="text-sm text-slate-700 italic">&ldquo;{angle.message_hook}&rdquo;</p>
                </div>

                <div className="flex items-center justify-between mt-3">
                  <p className="text-sm text-slate-600">{angle.reasoning}</p>
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <CopyButton text={angle.message_hook} label="Copy hook" />
                  <button
                    onClick={() => setEmailModalIndex(i)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium
                               border border-indigo-200 rounded-md text-indigo-600
                               hover:bg-indigo-50 transition-colors cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Generate Cold Email
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {emailModalIndex !== null && brief && (
        <ColdEmailModal
          brief={brief}
          angleIndex={emailModalIndex}
          onClose={() => setEmailModalIndex(null)}
        />
      )}
    </>
  )
}
