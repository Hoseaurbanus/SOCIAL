import { useState, useRef, useEffect } from 'react'
import { X, Image, Smile, MapPin } from 'lucide-react'
import { Avatar } from '@/components/atoms/avatar'
import { Button } from '@/components/atoms/button'
import { useCreatePost } from '@/hooks/use-posts'
import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils'

interface ComposeModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ComposeModal({ isOpen, onClose }: ComposeModalProps) {
  const [content, setContent] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const createPost = useCreatePost()
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 100)
    }
  }, [isOpen])

  const handleSubmit = () => {
    if (!content.trim()) return
    createPost.mutate(
      { content: content.trim() },
      {
        onSuccess: () => {
          setContent('')
          onClose()
        },
      }
    )
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full sm:max-w-[520px] bg-bg-primary rounded-t-2xl sm:rounded-2xl animate-slide-up max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <button onClick={onClose} className="p-1 rounded-full hover:bg-bg-tertiary text-text-secondary">
            <X className="h-5 w-5" />
          </button>
          <h2 className="text-base font-semibold text-text-primary">New Post</h2>
          <Button
            size="sm"
            disabled={!content.trim()}
            loading={createPost.isPending}
            onClick={handleSubmit}
          >
            Post
          </Button>
        </div>

        {/* Compose Area */}
        <div className="flex-1 overflow-y-auto p-4">
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
            <button className="p-2 rounded-full hover:bg-bg-tertiary text-accent transition-colors" aria-label="Add image">
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
    </div>
  )
}
