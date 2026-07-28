import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { ChevronLeft } from 'lucide-react'

interface ToggleProps {
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}

function Toggle({ label, description, checked, onChange }: ToggleProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border">
      <div>
        <div className="text-text-primary">{label}</div>
        <div className="text-sm text-text-secondary">{description}</div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-accent' : 'bg-bg-tertiary'}`}
        role="switch"
        aria-checked={checked}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  )
}

export default function NotificationSettingsPage() {
  const navigate = useNavigate()
  const [settings, setSettings] = useState({
    push: true,
    email: false,
    likes: true,
    comments: true,
    follows: true,
    messages: true,
  })

  useEffect(() => {
    const saved = localStorage.getItem('notification-settings')
    if (saved) setSettings(JSON.parse(saved))
  }, [])

  const update = (key: keyof typeof settings, value: boolean) => {
    const next = { ...settings, [key]: value }
    setSettings(next)
    localStorage.setItem('notification-settings', JSON.stringify(next))
  }

  return (
    <div>
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-bg-tertiary text-text-secondary">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold text-text-primary">Notifications</h1>
      </div>

      <div className="px-4 pt-4 pb-2">
        <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wider">Channels</h3>
      </div>
      <Toggle label="Push notifications" description="Receive push notifications" checked={settings.push} onChange={(v) => update('push', v)} />
      <Toggle label="Email notifications" description="Receive email updates" checked={settings.email} onChange={(v) => update('email', v)} />

      <div className="px-4 pt-4 pb-2">
        <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wider">Types</h3>
      </div>
      <Toggle label="Likes" description="When someone likes your post" checked={settings.likes} onChange={(v) => update('likes', v)} />
      <Toggle label="Comments" description="When someone comments on your post" checked={settings.comments} onChange={(v) => update('comments', v)} />
      <Toggle label="New followers" description="When someone follows you" checked={settings.follows} onChange={(v) => update('follows', v)} />
      <Toggle label="Messages" description="When you receive a message" checked={settings.messages} onChange={(v) => update('messages', v)} />
    </div>
  )
}
