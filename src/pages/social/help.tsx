import { useState } from 'react'
import { useNavigate } from 'react-router'
import { ChevronLeft, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const faqs = [
  { q: 'How do I create a post?', a: 'Tap the compose button on the Home tab. You can add text, images, and emojis to your post.' },
  { q: 'How do I follow someone?', a: 'Visit their profile and tap the Follow button. You can also follow suggested users from the Discover tab.' },
  { q: 'How do I change my profile picture?', a: 'Go to Settings > Account and tap the Edit button on your avatar.' },
  { q: 'Is my account private?', a: 'By default, accounts are public. You can make your account private in Settings > Privacy.' },
  { q: 'How do I reset my password?', a: 'Go to the login page and tap "Forgot Password". You\'ll receive an email with a reset link.' },
]

export default function HelpPage() {
  const navigate = useNavigate()
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div>
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-bg-tertiary text-text-secondary">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold text-text-primary">Help & Support</h1>
      </div>

      <div className="p-4 space-y-6">
        <div>
          <h3 className="text-sm font-medium text-text-primary mb-3">Frequently Asked Questions</h3>
          <div className="divide-y divide-border border border-border rounded-xl overflow-hidden">
            {faqs.map((faq, i) => (
              <div key={i}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-bg-tertiary transition-colors"
                >
                  <span className="text-sm text-text-primary">{faq.q}</span>
                  <ChevronDown className={cn('h-4 w-4 text-text-tertiary transition-transform', openFaq === i && 'rotate-180')} />
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-3">
                    <p className="text-sm text-text-secondary">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-text-primary mb-3">Contact</h3>
          <div className="border border-border rounded-xl divide-y divide-border">
            <div className="px-4 py-3">
              <div className="text-sm text-text-primary">Email</div>
              <div className="text-sm text-accent">smugflexventures@gmail.com</div>
            </div>
          </div>
        </div>

        <div className="text-center text-xs text-text-tertiary">
          <p>SmugFlex v1.0.0</p>
          <p className="mt-1">Made with care for the community</p>
        </div>
      </div>
    </div>
  )
}
