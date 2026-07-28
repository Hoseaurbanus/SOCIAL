import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/atoms/button'
import { Avatar } from '@/components/atoms/avatar'
import { useProfile, useUpdateProfile } from '@/hooks/use-profile'
import { useAuthStore } from '@/stores/auth-store'
import { supabase } from '@/config/supabase'
import { useToast } from '@/hooks/use-toast'

export default function AccountSettingsPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { data: profile } = useProfile(user?.username || '')
  const updateProfile = useUpdateProfile()
  const { toast } = useToast()

  const [name, setName] = useState(profile?.name || '')
  const [username, setUsername] = useState(profile?.username || '')
  const [bio, setBio] = useState(profile?.bio || '')
  const [website, setWebsite] = useState(profile?.website || '')
  const [location, setLocation] = useState(profile?.location || '')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (profile) {
      setName(profile.name || '')
      setUsername(profile.username || '')
      setBio(profile.bio || '')
      setWebsite(profile.website || '')
      setLocation(profile.location || '')
    }
  }, [profile])

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      let avatarUrl = profile?.avatar
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop()
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
        const filePath = `avatars/${fileName}`
        const { error } = await supabase.storage.from('avatars').upload(filePath, avatarFile)
        if (error) throw error
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath)
        avatarUrl = urlData.publicUrl
      }
      await updateProfile.mutateAsync({ name, username, bio, website, location, avatar: avatarUrl })
      toast({ title: 'Account updated!', variant: 'success' })
      navigate(-1)
    } catch (err: any) {
      toast({ title: err.message || 'Failed to update account', variant: 'error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-bg-tertiary text-text-secondary">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold text-text-primary">Account</h1>
      </div>

      <div className="p-4 space-y-4">
        <div className="flex justify-center">
          <div className="relative">
            <Avatar src={avatarPreview || profile?.avatar} alt="Avatar" size="xl" />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-accent text-white flex items-center justify-center text-xs font-medium"
            >
              Edit
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-bg-secondary border border-border rounded-lg px-4 py-2.5 text-sm text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Username</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-bg-secondary border border-border rounded-lg px-4 py-2.5 text-sm text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            maxLength={160}
            className="w-full bg-bg-secondary border border-border rounded-lg px-4 py-2.5 text-sm text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/20 resize-none"
          />
          <p className="text-xs text-text-tertiary text-right mt-1">{bio.length}/160</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Website</label>
          <input
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://"
            className="w-full bg-bg-secondary border border-border rounded-lg px-4 py-2.5 text-sm text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Location</label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full bg-bg-secondary border border-border rounded-lg px-4 py-2.5 text-sm text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </div>

        <Button fullWidth loading={saving} onClick={handleSave}>Save Changes</Button>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarSelect} />
    </div>
  )
}
