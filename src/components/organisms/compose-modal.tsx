import { useState, useRef, useEffect } from 'react'
import { X, Image, Smile, MapPin } from 'lucide-react'
import { Avatar } from '@/components/atoms/avatar'
import { Button } from '@/components/atoms/button'
import { useCreatePost } from '@/hooks/use-posts'
import { useAuthStore } from '@/stores/auth-store'
import { supabase } from '@/config/supabase'
import { cn } from '@/lib/utils'

interface ComposeModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ComposeModal({ isOpen, onClose }: ComposeModalProps) {
  const [content, setContent] = useState('')
  const [error, setError] = useState('')
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const createPost = useCreatePost()
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 100)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  const handleClose = () => {
    setContent('')
    setError('')
    setSelectedImages([])
    onClose()
  }

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
          },
          onError: (err) => setError(err.message || 'Failed to create post'),
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-label="Create post">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
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
            <div role="alert" className="mb-3 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
              {error}
            </div>
          )}

          {/* Image Previews */}
          {selectedImages.length > 0 && (
            <div className="flex gap-2 overflow-x-auto mb-3">
              {selectedImages.map((file, i) => (
                <div key={i} className="relative flex-shrink-0">
                  <img src={URL.createObjectURL(file)} alt="" className="h-20 w-20 object-cover rounded-lg" />
                  <button onClick={() => removeImage(i)} className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-bg-primary border border-border flex items-center justify-center">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
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
                rows={6}
                maxLength={500}
                className="w-full bg-transparent text-text-primary text-base resize-none outline-none placeholder:text-text-tertiary"
                aria-label="Post content"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <div className="flex items-center gap-1">
            <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded-full hover:bg-bg-tertiary text-accent transition-colors" aria-label="Add image">
              <Image className="h-5 w-5" />
            </button>
            <button className="p-2 rounded-full hover:bg-bg-tertiary text-accent transition-colors" aria-label="Add emoji">
              <Smile className="h-5 w-5" />
            </button>
            <button className="p-2 rounded-full hover:bg-bg-tertiary text-accent transition-colors" aria-label="Add location">
              <MapPin className="h-5 w-5" />
            </button>
          </div>
          <span className={cn('text-sm', content.length > 450 ? 'text-red-500' : 'text-text-tertiary')}>
            {content.length}/500
          </span>
        </div>
      </div>
      <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect} />
    </div>
  )
}
