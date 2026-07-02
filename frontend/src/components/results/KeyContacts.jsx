import { useState } from 'react'
import { UserCircle, Globe, MessageCircle } from 'lucide-react'
import CopyButton from '../ui/CopyButton'
import LinkedInModal from './LinkedInModal'

export default function KeyContacts({ contacts, companyName, brief }) {
  const [linkedinModalIndex, setLinkedinModalIndex] = useState(null)
  if (!contacts || contacts.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Key Contacts</h2>
        <div className="text-center py-4">
          <Globe className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">
            No contacts identified from public data.
            <br />
            Try searching on LinkedIn directly.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <h2 className="text-lg font-semibold text-slate-800 mb-4">Key Contacts</h2>
      <div className="space-y-3">
        {contacts.map((contact, i) => (
          <div key={i} className="p-3 bg-slate-50 rounded-lg">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <UserCircle className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-800">{contact.name}</p>
                  <p className="text-xs text-slate-500">{contact.title}</p>
                </div>
              </div>
              <CopyButton
                text={`${contact.name} ${companyName}`}
                label="LinkedIn"
              />
            </div>
            <div className="flex items-center gap-2 mt-2 ml-7">
              <p className="text-xs text-slate-600 flex-1">{contact.relevance}</p>
              {brief && (
                <button
                  onClick={() => setLinkedinModalIndex(i)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium
                             border border-blue-200 rounded-md text-blue-600
                             hover:bg-blue-50 transition-colors cursor-pointer flex-shrink-0"
                >
                  <MessageCircle className="w-3 h-3" />
                  Message
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {linkedinModalIndex !== null && brief && (
        <LinkedInModal
          brief={brief}
          contactIndex={linkedinModalIndex}
          onClose={() => setLinkedinModalIndex(null)}
        />
      )}
    </div>
  )
}
