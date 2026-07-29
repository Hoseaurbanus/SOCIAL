import { useNavigate } from 'react-router'
import { ChevronLeft } from 'lucide-react'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useProfile, useUpdateProfile } from '@/hooks/use-profile'
import { useAuthStore } from '@/stores/auth-store'
import { useToast } from '@/hooks/use-toast'

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
        checked ? 'bg-accent' : 'bg-bg-tertiary'
      )}
    >
      <span className={cn(
        'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
        checked ? 'translate-x-6' : 'translate-x-1'
      )} />
    </button>
  )
}

export default function PrivacyPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { data: profile } = useProfile(user?.username || '')
  const updateProfile = useUpdateProfile()
  const toast = useToast((s) => s.toast)

  const [privateAccount, setPrivateAccount] = useState(false)
  const [showActivity, setShowActivity] = useState(true)
  const [allowMentions, setAllowMentions] = useState(true)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (profile && !initialized) {
      setPrivateAccount(profile.is_private ?? false)
      setShowActivity(profile.show_activity ?? true)
      setAllowMentions(profile.allow_mentions ?? true)
      setInitialized(true)
    }
  }, [profile, initialized])

  const handleTogglePrivate = () => {
    const newValue = !privateAccount
    setPrivateAccount(newValue)
    updateProfile.mutate(
      { is_private: newValue },
      { onError: () => toast({ title: 'Failed to update', variant: 'error' }) }
    )
  }

  const handleToggleActivity = () => {
    const newValue = !showActivity
    setShowActivity(newValue)
    updateProfile.mutate(
      { show_activity: newValue },
      { onError: () => toast({ title: 'Failed to update', variant: 'error' }) }
    )
  }

  const handleToggleMentions = () => {
    const newValue = !allowMentions
    setAllowMentions(newValue)
    updateProfile.mutate(
      { allow_mentions: newValue },
      { onError: () => toast({ title: 'Failed to update', variant: 'error' }) }
    )
  }

  return (
    <div className="max-w-[600px] mx-auto">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-bg-tertiary text-text-secondary">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold text-text-primary">Privacy</h1>
      </div>

      <div className="bg-bg-primary divide-y divide-border">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-text-primary font-medium">Private Account</div>
              <div className="text-sm text-text-secondary">Only followers can see your posts</div>
            </div>
            <Toggle checked={privateAccount} onChange={handleTogglePrivate} />
          </div>
        </div>
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-text-primary font-medium">Show Activity Status</div>
              <div className="text-sm text-text-secondary">Let others see when you are active</div>
            </div>
            <Toggle checked={showActivity} onChange={handleToggleActivity} />
          </div>
        </div>
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-text-primary font-medium">Allow Mentions</div>
              <div className="text-sm text-text-secondary">Let people mention you in comments</div>
            </div>
            <Toggle checked={allowMentions} onChange={handleToggleMentions} />
          </div>
        </div>
      </div>
    </div>
  )
}
