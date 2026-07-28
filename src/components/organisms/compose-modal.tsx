import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { X, Image, Smile, MapPin } from 'lucide-react'
import { Avatar } from '@/components/atoms/avatar'
import { Button } from '@/components/atoms/button'
import { EmojiPicker } from '@/components/molecules/emoji-picker'
import { useCreatePost } from '@/hooks/use-posts'
import { useAuthStore } from '@/stores/auth-store'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/config/supabase'
import { cn } from '@/lib/utils'

function ImagePreviews({ files, onRemove }: { files: File[]; onRemove: (i: number) => void }) {
  const urls = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files])
  useEffect(() => {
    return () => urls.forEach((u) => URL.revokeObjectURL(u))
  }, [urls])
  return (
    <div className="flex gap-2 overflow-x-auto mb-3">
      {urls.map((url, i) => (
        <div key={i} className="relative flex-shrink-0">
          <img src={url} alt="" className="h-20 w-20 object-cover rounded-lg" />
          <button onClick={() => onRemove(i)} className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-bg-primary border border-border flex items-center justify-center" aria-label="Remove image">
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
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
  const [uploading, setUploading] = useState(false)
  const [showEmoji, setShowEmoji] = useState(false)
  const [location, setLocation] = useState<string | null>(null)
  const [loadingLocation, setLoadingLocation] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const createPost = useCreatePost()
  const user = useAuthStore((s) => s.user)
  const toast = useToast((s) => s.toast)

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 100)
    }
  }, [isOpen])

  const handleClose = useCallback(() => {
    setContent('')
    setError('')
    setSelectedImages([])
    setLocation(null)
    onClose()
  }, [onClose])

  useEffect(() => {
    if (!isOpen) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, handleClose])

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles = files.slice(0, 4 - selectedImages.length)
    setSelectedImages((prev) => [...prev, ...validFiles])
  }

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index))
  }

  const uploadImages = async (): Promise<string[]> => {
    if (selectedImages.length === 0) return []
    setUploading(true)
    try {
      const urls: string[] = []
      for (const file of selectedImages) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
        const filePath = `posts/${fileName}`
        const { error } = await supabase.storage.from('posts').upload(filePath, file)
        if (error) throw error
        const { data: urlData } = supabase.storage.from('posts').getPublicUrl(filePath)
        urls.push(urlData.publicUrl)
      }
      return urls
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async () => {
    if (!content.trim()) return
    setError('')
    try {
      const imageUrls = await uploadImages()
      createPost.mutate(
        { content: content.trim(), images: imageUrls.length > 0 ? imageUrls : undefined },
        {
          onSuccess: () => {
            setContent('')
            setSelectedImages([])
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
      setError(err.message || 'Failed to upload images')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newContent = content.slice(0, start) + emoji + content.slice(end)
      setContent(newContent)
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length
        textarea.focus()
      }, 0)
    } else {
      setContent((prev) => prev + emoji)
    }
    setShowEmoji(false)
  }

  const handleLocationClick = () => {
    if (location) {
      setLocation(null)
      return
    }
    if (!navigator.geolocation) {
      toast({ title: 'Geolocation not supported', variant: 'error' })
      return
    }
    setLoadingLocation(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords
          const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
          const data = await resp.json()
          const city = data.address?.city || data.address?.town || data.address?.village || ''
          const country = data.address?.country || ''
          const loc = [city, country].filter(Boolean).join(', ')
          setLocation(loc || `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`)
        } catch {
          const { latitude, longitude } = position.coords
          setLocation(`${latitude.toFixed(2)}, ${longitude.toFixed(2)}`)
        } finally {
          setLoadingLocation(false)
        }
      },
      () => {
        setLoadingLocation(false)
        toast({ title: 'Location access denied', variant: 'error' })
      }
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-label="Create post">
      <div className="absolute inset-0 bg-overlay" onClick={handleClose} />
      <div className="relative w-full sm:max-w-[520px] bg-bg-primary rounded-t-2xl sm:rounded-2xl animate-slide-up max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <button onClick={handleClose} className="p-1 rounded-full hover:bg-bg-tertiary text-text-secondary">
            <X className="h-5 w-5" />
          </button>
          <h2 className="text-base font-semibold text-text-primary">New Post</h2>
          <Button
            size="sm"
            disabled={!content.trim()}
            loading={createPost.isPending || uploading}
            onClick={handleSubmit}
          >
            Post
          </Button>
        </div>

        {/* Compose Area */}
        <div className="flex-1 overflow-y-auto p-4">
          {error && (
            <div role="alert" className="mb-3 p-2 rounded-lg bg-error/10 border border-error/20 text-error text-sm">
              {error}
            </div>
          )}

          {/* Image Previews */}
          {selectedImages.length > 0 && (
            <ImagePreviews files={selectedImages} onRemove={removeImage} />
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
                maxLength={500}
                className="w-full bg-transparent text-text-primary text-base resize-none outline-none placeholder:text-text-tertiary min-h-[120px]"
                aria-label="Post content"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative">
          {showEmoji && (
            <div className="absolute bottom-full left-4 mb-2">
              <EmojiPicker onSelect={handleEmojiSelect} />
            </div>
          )}
          {location && (
            <div className="px-4 py-2 border-t border-border flex items-center gap-2">
              <MapPin className="h-4 w-4 text-accent" />
              <span className="text-sm text-text-secondary">{location}</span>
              <button onClick={() => setLocation(null)} className="ml-auto text-text-tertiary hover:text-text-secondary">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <div className="flex items-center gap-1">
              <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded-full hover:bg-bg-tertiary text-accent transition-colors" aria-label="Add image">
                <Image className="h-5 w-5" />
              </button>
              <button onClick={() => setShowEmoji(!showEmoji)} className={cn('p-2 rounded-full hover:bg-bg-tertiary text-accent transition-colors', showEmoji && 'bg-accent/10')} aria-label="Add emoji">
                <Smile className="h-5 w-5" />
              </button>
              <button onClick={handleLocationClick} disabled={loadingLocation} className={cn('p-2 rounded-full hover:bg-bg-tertiary text-accent transition-colors', location && 'bg-accent/10')} aria-label="Add location">
                {loadingLocation ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" /> : <MapPin className="h-5 w-5" />}
              </button>
            </div>
            <span className={cn('text-sm', content.length > 450 ? 'text-error' : 'text-text-tertiary')}>
              {content.length}/500
            </span>
          </div>
        </div>
      </div>
      <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect} />
    </div>
  )
}
