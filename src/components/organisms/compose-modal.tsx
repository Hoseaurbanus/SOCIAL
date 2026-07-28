import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Image, Smile, MapPin, Video, Link2, Loader2 } from 'lucide-react'
import { Avatar } from '@/components/atoms/avatar'
import { Button } from '@/components/atoms/button'
import { EmojiPicker } from '@/components/molecules/emoji-picker'
import { useCreatePost } from '@/hooks/use-posts'
import { useAuthStore } from '@/stores/auth-store'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/config/supabase'
import { cn } from '@/lib/utils'
import { extractUrls, fetchLinkPreview } from '@/lib/link-preview'
import type { LinkPreview as LinkPreviewType } from '@/types/api'

const MAX_IMAGES = 4
const MAX_CHARS = 500

function CircularCount({ current, max }: { current: number; max: number }) {
  const pct = Math.min(current / max, 1)
  const r = 10
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - pct)
  const color = current > max * 0.9 ? 'var(--color-error)' : current > max * 0.7 ? 'var(--color-secondary)' : 'var(--color-accent)'
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" className="flex-shrink-0">
      <circle cx="14" cy="14" r={r} fill="none" stroke="var(--color-bg-tertiary)" strokeWidth="2.5" />
      <circle cx="14" cy="14" r={r} fill="none" stroke={color} strokeWidth="2.5" strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" transform="rotate(-90 14 14)" className="transition-all duration-300" />
      {current > max * 0.9 && <text x="14" y="14" textAnchor="middle" dominantBaseline="central" fill={color} fontSize="8" fontWeight="600">{max - current}</text>}
    </svg>
  )
}

function MediaPreviews({ images, video, onRemoveImage, onRemoveVideo }: { images: File[]; video: File | null; onRemoveImage: (i: number) => void; onRemoveVideo: () => void }) {
  const imageUrls = useMemo(() => images.map((f) => URL.createObjectURL(f)), [images])
  const videoUrl = useMemo(() => video ? URL.createObjectURL(video) : null, [video])
  useEffect(() => {
    return () => { imageUrls.forEach((u) => URL.revokeObjectURL(u)); if (videoUrl) URL.revokeObjectURL(videoUrl) }
  }, [imageUrls, videoUrl])

  if (images.length === 0 && !video) return null

  return (
    <div className="mb-3">
      {images.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {imageUrls.map((url, i) => (
            <div key={i} className="relative flex-shrink-0 group">
              <img src={url} alt="" className="h-24 w-24 object-cover rounded-xl" />
              <button onClick={() => onRemoveImage(i)} className="absolute -top-1.5 -right-1.5 h-6 w-6 rounded-full bg-bg-primary/90 backdrop-blur-sm border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Remove image">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
      {video && videoUrl && (
        <div className="relative inline-block group">
          <video src={videoUrl} className="h-24 w-40 object-cover rounded-xl" muted />
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-xl">
            <Video className="h-8 w-8 text-white/80" />
          </div>
          <button onClick={onRemoveVideo} className="absolute -top-1.5 -right-1.5 h-6 w-6 rounded-full bg-bg-primary/90 backdrop-blur-sm border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Remove video">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}

function LinkPreviewCard({ preview, onRemove }: { preview: LinkPreviewType; onRemove: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mb-3 rounded-xl border border-border overflow-hidden bg-bg-secondary">
      <div className="flex">
        {preview.image && (
          <img src={preview.image} alt="" className="w-28 h-28 object-cover flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0 p-3">
          <p className="text-xs text-text-tertiary truncate">{preview.domain}</p>
          <p className="text-sm font-medium text-text-primary line-clamp-2 mt-0.5">{preview.title}</p>
          {preview.description && <p className="text-xs text-text-secondary line-clamp-2 mt-1">{preview.description}</p>}
        </div>
        <button onClick={onRemove} className="p-2 self-start text-text-tertiary hover:text-text-secondary" aria-label="Remove link preview">
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  )
}

interface ComposeModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ComposeModal({ isOpen, onClose }: ComposeModalProps) {
  const [content, setContent] = useState('')
  const [error, setError] = useState('')
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [showEmoji, setShowEmoji] = useState(false)
  const [location, setLocation] = useState<string | null>(null)
  const [loadingLocation, setLoadingLocation] = useState(false)
  const [linkPreview, setLinkPreview] = useState<LinkPreviewType | null>(null)
  const [loadingLink, setLoadingLink] = useState(false)
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const createPost = useCreatePost()
  const user = useAuthStore((s) => s.user)
  const toast = useToast((s) => s.toast)

  useEffect(() => {
    if (isOpen) setTimeout(() => textareaRef.current?.focus(), 100)
  }, [isOpen])

  const handleClose = useCallback(() => {
    setContent('')
    setError('')
    setSelectedImages([])
    setSelectedVideo(null)
    setLocation(null)
    setLinkPreview(null)
    setShowLinkInput(false)
    setLinkUrl('')
    onClose()
  }, [onClose])

  useEffect(() => {
    if (!isOpen) return
    const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose() }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, handleClose])

  // Auto-detect links in text
  useEffect(() => {
    if (linkPreview || loadingLink) return
    const urls = extractUrls(content)
    if (urls.length > 0) {
      const url = urls[urls.length - 1]
      setLoadingLink(true)
      fetchLinkPreview(url).then((preview) => {
        if (preview) setLinkPreview(preview)
      }).finally(() => setLoadingLink(false))
    }
  }, [content, linkPreview, loadingLink])

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (selectedVideo) {
      if (!confirm('Adding images will remove the video. Continue?')) return
      setSelectedVideo(null)
    }
    const valid = files.slice(0, MAX_IMAGES - selectedImages.length)
    setSelectedImages((prev) => [...prev, ...valid])
    e.target.value = ''
  }

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (selectedImages.length > 0) {
      if (!confirm('Adding a video will remove all images. Continue?')) return
      setSelectedImages([])
    }
    setSelectedVideo(file)
    e.target.value = ''
  }

  const removeImage = (index: number) => setSelectedImages((prev) => prev.filter((_, i) => i !== index))
  const removeVideo = () => setSelectedVideo(null)

  const uploadMedia = async (): Promise<{ images?: string[]; videoUrl?: string }> => {
    setUploading(true)
    try {
      // Upload images
      if (selectedImages.length > 0) {
        const urls: string[] = []
        for (const file of selectedImages) {
          const ext = file.name.split('.').pop()
          const name = `${Math.random().toString(36).substring(2)}-${Date.now()}.${ext}`
          const { error } = await supabase.storage.from('posts').upload(`posts/${name}`, file)
          if (error) throw error
          const { data } = supabase.storage.from('posts').getPublicUrl(`posts/${name}`)
          urls.push(data.publicUrl)
        }
        return { images: urls }
      }
      // Upload video
      if (selectedVideo) {
        const ext = selectedVideo.name.split('.').pop()
        const name = `${Math.random().toString(36).substring(2)}-${Date.now()}.${ext}`
        const { error } = await supabase.storage.from('posts').upload(`posts/${name}`, selectedVideo)
        if (error) throw error
        const { data } = supabase.storage.from('posts').getPublicUrl(`posts/${name}`)
        return { videoUrl: data.publicUrl }
      }
      return {}
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async () => {
    if (!content.trim() && selectedImages.length === 0 && !selectedVideo) return
    setError('')
    try {
      const media = await uploadMedia()
      createPost.mutate(
        {
          content: content.trim(),
          images: media.images,
          videoUrl: media.videoUrl,
          linkPreview: linkPreview || undefined,
        },
        {
          onSuccess: () => {
            setContent('')
            setSelectedImages([])
            setSelectedVideo(null)
            setLinkPreview(null)
            setError('')
            onClose()
            toast({ title: 'Post created!', variant: 'success' })
          },
          onError: (err) => {
            setError(err.message || 'Failed to create post')
            toast({ title: err.message || 'Failed to create post', variant: 'error' })
          },
        }
      )
    } catch (err: any) {
      setError(err.message || 'Failed to upload media')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); handleSubmit() }
  }

  const handleEmojiSelect = (emoji: string) => {
    const ta = textareaRef.current
    if (ta) {
      const s = ta.selectionStart, end = ta.selectionEnd
      setContent(content.slice(0, s) + emoji + content.slice(end))
      setTimeout(() => { ta.selectionStart = ta.selectionEnd = s + emoji.length; ta.focus() }, 0)
    } else {
      setContent((p) => p + emoji)
    }
    setShowEmoji(false)
  }

  const handleLocationClick = () => {
    if (location) { setLocation(null); return }
    if (!navigator.geolocation) { toast({ title: 'Geolocation not supported', variant: 'error' }); return }
    setLoadingLocation(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords
          const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
          const data = await resp.json()
          const city = data.address?.city || data.address?.town || data.address?.village || ''
          const country = data.address?.country || ''
          setLocation([city, country].filter(Boolean).join(', ') || `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`)
        } catch {
          const { latitude, longitude } = pos.coords
          setLocation(`${latitude.toFixed(2)}, ${longitude.toFixed(2)}`)
        } finally { setLoadingLocation(false) }
      },
      () => { setLoadingLocation(false); toast({ title: 'Location access denied', variant: 'error' }) }
    )
  }

  const handleManualLink = () => {
    if (!linkUrl.trim()) return
    const url = linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`
    setLoadingLink(true)
    setShowLinkInput(false)
    setLinkUrl('')
    fetchLinkPreview(url).then((p) => { if (p) setLinkPreview(p) }).finally(() => setLoadingLink(false))
  }

  const canPost = content.trim() || selectedImages.length > 0 || selectedVideo

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-label="Create post">
      <div className="absolute inset-0 bg-overlay backdrop-blur-sm" onClick={handleClose} />
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="relative w-full sm:max-w-[520px] bg-bg-primary/95 backdrop-blur-xl rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[85vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
          <button onClick={handleClose} className="p-1.5 rounded-full hover:bg-bg-tertiary text-text-secondary transition-colors">
            <X className="h-5 w-5" />
          </button>
          <h2 className="text-base font-semibold text-text-primary">New Post</h2>
          <Button size="sm" disabled={!canPost} loading={createPost.isPending || uploading} onClick={handleSubmit}>
            Post
          </Button>
        </div>

        {/* Compose Area */}
        <div className="flex-1 overflow-y-auto p-4">
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} role="alert" className="mb-3 p-2.5 rounded-xl bg-error/10 border border-error/20 text-error text-sm">
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Link Preview */}
          <AnimatePresence>
            {linkPreview && <LinkPreviewCard preview={linkPreview} onRemove={() => setLinkPreview(null)} />}
          </AnimatePresence>

          {/* Media Previews */}
          <MediaPreviews images={selectedImages} video={selectedVideo} onRemoveImage={removeImage} onRemoveVideo={removeVideo} />

          {/* Loading link */}
          {loadingLink && (
            <div className="flex items-center gap-2 mb-3 text-sm text-text-tertiary">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading link preview...</span>
            </div>
          )}

          <div className="flex gap-3">
            <Avatar src={user?.avatar} alt={user?.name} size="md" />
            <div className="flex-1 min-w-0">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="What's happening?"
                rows={4}
                maxLength={MAX_CHARS + 50}
                className="w-full bg-transparent text-text-primary text-base resize-none outline-none placeholder:text-text-tertiary min-h-[120px]"
                aria-label="Post content"
              />
            </div>
          </div>
        </div>

        {/* Link input */}
        <AnimatePresence>
          {showLinkInput && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="px-4 pb-2">
              <div className="flex gap-2">
                <input type="url" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleManualLink()} placeholder="Paste a link..." className="flex-1 px-3 py-2 text-sm bg-bg-secondary border border-border rounded-xl text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent" />
                <Button size="sm" onClick={handleManualLink}>Add</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <div className="relative border-t border-border/50">
          <AnimatePresence>
            {showEmoji && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="absolute bottom-full left-4 mb-2 z-10">
                <EmojiPicker onSelect={handleEmojiSelect} />
              </motion.div>
            )}
          </AnimatePresence>

          {location && (
            <div className="px-4 py-2 border-t border-border/50 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-accent" />
              <span className="text-sm text-text-secondary">{location}</span>
              <button onClick={() => setLocation(null)} className="ml-auto text-text-tertiary hover:text-text-secondary"><X className="h-4 w-4" /></button>
            </div>
          )}

          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-0.5">
              <button onClick={() => imageInputRef.current?.click()} className={cn('p-2 rounded-xl hover:bg-accent/10 text-accent transition-colors', selectedImages.length > 0 && 'bg-accent/10')} aria-label="Add images" title="Add images">
                <Image className="h-5 w-5" />
              </button>
              <button onClick={() => videoInputRef.current?.click()} className={cn('p-2 rounded-xl hover:bg-accent/10 text-accent transition-colors', selectedVideo && 'bg-accent/10')} aria-label="Add video" title="Add video">
                <Video className="h-5 w-5" />
              </button>
              <button onClick={() => setShowEmoji(!showEmoji)} className={cn('p-2 rounded-xl hover:bg-accent/10 text-accent transition-colors', showEmoji && 'bg-accent/10')} aria-label="Add emoji" title="Add emoji">
                <Smile className="h-5 w-5" />
              </button>
              <button onClick={() => { setShowLinkInput(!showLinkInput); if (linkPreview) setLinkPreview(null) }} className={cn('p-2 rounded-xl hover:bg-accent/10 text-accent transition-colors', (showLinkInput || linkPreview) && 'bg-accent/10')} aria-label="Add link" title="Add link">
                <Link2 className="h-5 w-5" />
              </button>
              <button onClick={handleLocationClick} disabled={loadingLocation} className={cn('p-2 rounded-xl hover:bg-accent/10 text-accent transition-colors', location && 'bg-accent/10')} aria-label="Add location" title="Add location">
                {loadingLocation ? <Loader2 className="h-5 w-5 animate-spin" /> : <MapPin className="h-5 w-5" />}
              </button>
            </div>
            <CircularCount current={content.length} max={MAX_CHARS} />
          </div>
        </div>
      </motion.div>
      <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect} />
      <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={handleVideoSelect} />
    </div>
  )
}
