import { useState, useRef } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/atoms/button'
import { Avatar } from '@/components/atoms/avatar'
import { cn } from '@/lib/utils'
import { useToggleFollow, useFollowStatus } from '@/hooks/use-profile'
import { useAuthStore } from '@/stores/auth-store'
import { supabase } from '@/config/supabase'

const INTERESTS = [
  'Technology', 'Design', 'Photography', 'Music', 'Sports', 'Travel',
  'Food', 'Art', 'Science', 'Business', 'Gaming', 'Books', 'Fashion', 'Fitness',
]

const steps = [
  { title: 'Choose your interests', description: 'Select topics you care about' },
  { title: 'Follow people', description: 'Find friends and creators' },
  { title: 'Set up your profile', description: 'Add a photo and bio' },
]

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-bg-secondary flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-primary">{steps[currentStep].title}</h1>
          <p className="text-text-secondary mt-2">{steps[currentStep].description}</p>
        </div>
        <div className="flex gap-2 justify-center">
          {steps.map((_, i) => (
            <div key={i} className={cn('h-2 w-8 rounded-full transition-colors', i === currentStep ? 'bg-accent' : 'bg-bg-tertiary')} />
          ))}
        </div>
        {currentStep === 0 && <InterestsStep />}
        {currentStep === 1 && <FollowStep />}
        {currentStep === 2 && <ProfileStep />}
        <div className="space-y-3">
          <Button fullWidth onClick={() => {
            if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1)
            else navigate('/home')
          }}>
            {currentStep === steps.length - 1 ? 'Get Started' : 'Continue'}
          </Button>
          {currentStep < steps.length - 1 && (
            <Button variant="ghost" fullWidth onClick={() => navigate('/home')}>Skip</Button>
          )}
        </div>
      </div>
    </div>
  )
}

function InterestsStep() {
  const [selected, setSelected] = useState<string[]>([])

  const toggle = (interest: string) => {
    setSelected((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    )
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {INTERESTS.map((interest) => (
        <button
          key={interest}
          onClick={() => toggle(interest)}
          className={cn(
            'px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors',
            selected.includes(interest)
              ? 'bg-accent text-white border-accent'
              : 'bg-bg-primary text-text-primary border-border hover:bg-bg-tertiary'
          )}
        >
          {interest}
        </button>
      ))}
    </div>
  )
}

function FollowStep() {
  const [users, setUsers] = useState<Array<{ id: string; name: string; username: string; avatar?: string; bio?: string }>>([])
  const [loading, setLoading] = useState(true)
  const toggleFollow = useToggleFollow()
  const { data: followingMap } = useFollowStatus(users.map((u) => u.id))
  const currentUser = useAuthStore((s) => s.user)

  useState(() => {
    const loadUsers = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, username, avatar, bio')
        .neq('id', currentUser?.id || '')
        .limit(8)
      if (!error && data) setUsers(data)
      setLoading(false)
    }
    loadUsers()
  })

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
            <div className="h-10 w-10 rounded-full bg-bg-tertiary" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-24 bg-bg-tertiary rounded" />
              <div className="h-3 w-32 bg-bg-tertiary rounded" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {users.map((u) => {
        const isFollowing = followingMap?.[u.id] || false
        return (
          <div key={u.id} className="flex items-center gap-3 p-3 rounded-lg">
            <Avatar src={u.avatar} alt={u.name} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">{u.name}</p>
              <p className="text-xs text-text-secondary truncate">@{u.username}</p>
            </div>
            <Button
              variant={isFollowing ? 'secondary' : 'primary'}
              size="sm"
              onClick={() => toggleFollow.mutate(u.id)}
              loading={toggleFollow.isPending}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </Button>
          </div>
        )
      })}
    </div>
  )
}

function ProfileStep() {
  const [bio, setBio] = useState('')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const user = useAuthStore((s) => s.user)

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <div className="relative">
          <Avatar src={avatarPreview || user?.avatar} alt="Avatar" size="xl" />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-accent text-white flex items-center justify-center text-xs font-medium"
          >
            Edit
          </button>
        </div>
      </div>
      <textarea
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        placeholder="Write a bio..."
        rows={3}
        maxLength={160}
        className="w-full bg-bg-primary border border-border rounded-lg px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:ring-2 focus:ring-accent/20 resize-none"
      />
      <p className="text-xs text-text-tertiary text-right">{bio.length}/160</p>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarSelect} />
    </div>
  )
}
