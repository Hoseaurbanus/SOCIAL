import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { ChevronLeft, Camera, X } from 'lucide-react'
import { Button } from '@/components/atoms/button'
import { Avatar } from '@/components/atoms/avatar'
import { useProfile, useUpdateProfile } from '@/hooks/use-profile'
import { useAuthStore } from '@/stores/auth-store'
import { supabase } from '@/config/supabase'
import { deleteOldAvatar } from '@/api/profile'
import { useToast } from '@/hooks/use-toast'

export default function AccountSettingsPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { data: profile } = useProfile(user?.username || '')
  const updateProfile = useUpdateProfile()
  const toast = useToast((s) => s.toast)

  const [name, setName] = useState(profile?.name || '')
  const [username, setUsername] = useState(profile?.username || '')
  const [bio, setBio] = useState(profile?.bio || '')
  const [website, setWebsite] = useState(profile?.website || '')
  const [location, setLocation] = useState(profile?.location || '')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

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
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: 'Image must be under 5MB', variant: 'error' })
        return
      }
      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: 'Image must be under 10MB', variant: 'error' })
        return
      }
      setCoverFile(file)
      setCoverPreview(URL.createObjectURL(file))
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      let avatarUrl = profile?.avatar
      if (avatarFile) {
        await deleteOldAvatar(profile?.avatar)
        const fileExt = avatarFile.name.split('.').pop()
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
        const filePath = `avatars/${fileName}`
        const { error } = await supabase.storage.from('avatars').upload(filePath, avatarFile)
        if (error) throw error
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath)
        avatarUrl = urlData.publicUrl
      }

      let coverUrl = profile?.cover_image
      if (coverFile) {
        const fileExt = coverFile.name.split('.').pop()
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
        const filePath = `covers/${fileName}`
        const { error } = await supabase.storage.from('avatars').upload(filePath, coverFile)
        if (error) throw error
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath)
        coverUrl = urlData.publicUrl
      }

      await updateProfile.mutateAsync({ name, username, bio, website, location, avatar: avatarUrl, cover_image: coverUrl })
      toast({ title: 'Account updated!', variant: 'success' })
      navigate(-1)
    } catch (err: any) {
      toast({ title: err.message || 'Failed to update account', variant: 'error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-bg-tertiary text-text-secondary">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold text-text-primary">Account</h1>
      </div>

      {/* Cover Image */}
      <div className="relative h-40 bg-gradient-to-br from-accent via-accent-dark to-accent overflow-hidden">
        {(coverPreview || profile?.cover_image) ? (
          <img src={coverPreview || profile?.cover_image || ''} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-4 left-8 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute bottom-4 right-8 w-40 h-40 rounded-full bg-white/10 blur-3xl" />
          </div>
        )}
        <button
          onClick={() => coverInputRef.current?.click()}
          className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 hover:bg-black/70 text-white text-xs font-medium backdrop-blur-sm transition-colors"
        >
          <Camera className="h-3.5 w-3.5" />
          {profile?.cover_image || coverPreview ? 'Change cover' : 'Add cover'}
        </button>
        {(coverPreview || profile?.cover_image) && (
          <button
            onClick={() => { setCoverFile(null); setCoverPreview(null) }}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="p-4 space-y-5">
        {/* Avatar */}
        <div className="flex justify-center -mt-12 relative z-10">
          <div className="relative">
            <Avatar src={avatarPreview || profile?.avatar} alt="Avatar" size="2xl" className="border-4 border-bg-primary shadow-xl" />
            <button
              onClick={() => avatarInputRef.current?.click()}
              className="absolute bottom-1 right-1 h-8 w-8 rounded-full bg-accent text-white flex items-center justify-center shadow-lg hover:bg-accent-dark transition-colors"
            >
              <Camera className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
          />
        </div>

        {/* Username */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">Username</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
          />
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            maxLength={160}
            className="w-full bg-bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/20 resize-none transition-colors"
          />
          <p className="text-xs text-text-tertiary text-right mt-1">{bio.length}/160</p>
        </div>

        {/* Website */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">Website</label>
          <input
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://"
            className="w-full bg-bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
          />
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">Location</label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full bg-bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
          />
        </div>

        <Button fullWidth loading={saving} onClick={handleSave}>Save Changes</Button>
      </div>

      <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarSelect} />
      <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverSelect} />
    </div>
  )
}
