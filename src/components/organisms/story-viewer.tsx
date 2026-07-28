import { useState, useEffect, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Avatar } from '@/components/atoms/avatar'
import { timeAgo } from '@/lib/timeago'

interface StoryData {
  id: string
  media_url: string
  media_type: 'image' | 'video'
  created_at: string
  user: { name: string; username: string; avatar?: string }
}

interface StoryViewerProps {
  stories: StoryData[]
  initialIndex?: number
  onClose: () => void
}

export function StoryViewer({ stories, initialIndex = 0, onClose }: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [progress, setProgress] = useState(0)

  const story = stories[currentIndex]
  const isLast = currentIndex === stories.length - 1

  const goNext = useCallback(() => {
    if (isLast) {
      onClose()
    } else {
      setCurrentIndex((i) => i + 1)
      setProgress(0)
    }
  }, [isLast, onClose])

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1)
      setProgress(0)
    }
  }, [currentIndex])

  useEffect(() => {
    setProgress(0)
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          goNext()
          return 0
        }
        return p + 2
      })
    }, 100)
    return () => clearInterval(interval)
  }, [currentIndex, goNext])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft') goPrev()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose, goNext, goPrev])

  if (!story) return null

  return (
    <div className="fixed inset-0 z-modal bg-black flex items-center justify-center" role="dialog" aria-modal="true" aria-label="Story viewer">
      <button onClick={onClose} className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors" aria-label="Close story">
        <X className="h-6 w-6" />
      </button>

      {/* Progress bars */}
      <div className="absolute top-0 left-0 right-0 z-10 flex gap-1 p-2">
        {stories.map((_, i) => (
          <div key={i} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-100"
              style={{
                width: i < currentIndex ? '100%' : i === currentIndex ? `${progress}%` : '0%',
              }}
            />
          </div>
        ))}
      </div>

      {/* User info */}
      <div className="absolute top-6 left-0 right-0 z-10 flex items-center gap-3 px-4">
        <Avatar src={story.user.avatar} alt={story.user.name} size="sm" />
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-white">{story.user.name}</span>
          <span className="text-xs text-white/60 ml-2">{timeAgo(story.created_at)}</span>
        </div>
      </div>

      {/* Story image */}
      <img src={story.media_url} alt={`Story by ${story.user.name}`} className="max-h-full max-w-full object-contain" />

      {/* Navigation arrows */}
      {currentIndex > 0 && (
        <button onClick={goPrev} className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors" aria-label="Previous story">
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}
      {!isLast && (
        <button onClick={goNext} className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors" aria-label="Next story">
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      {/* Tap zones */}
      <div className="absolute inset-0 z-5 flex">
        <div className="w-1/3 h-full" onClick={goPrev} />
        <div className="w-1/3 h-full" />
        <div className="w-1/3 h-full" onClick={goNext} />
      </div>
    </div>
  )
}
