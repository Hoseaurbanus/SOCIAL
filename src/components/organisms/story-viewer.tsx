import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router'
import { X, ChevronLeft, ChevronRight, Music, Eye, Send, Pause, Play, Trash2 } from 'lucide-react'
import { Avatar } from '@/components/atoms/avatar'
import { timeAgo } from '@/lib/timeago'
import { cn } from '@/lib/utils'
import { useMarkStoryViewed, useStoryReaction, useStoryViews, useDeleteStory } from '@/hooks/use-stories'
import { useAuthStore } from '@/stores/auth-store'
import { useToast } from '@/hooks/use-toast'
import type { Story } from '@/types/api'

interface StoryViewerProps {
  stories: Story[]
  initialIndex?: number
  onClose: () => void
  onReply?: (storyId: string, message: string) => void
}

const QUICK_REACTIONS = ['❤️', '😂', '😮', '😢', '🔥', '👏']

export function StoryViewer({ stories, initialIndex = 0, onClose, onReply }: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [progress, setProgress] = useState(0)
  const [replyText, setReplyText] = useState('')
  const [showReply, setShowReply] = useState(false)
  const [showViewers, setShowViewers] = useState(false)
  const [musicPlaying, setMusicPlaying] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  const touchDeltaRef = useRef(0)
  const user = useAuthStore((s) => s.user)
  const markViewed = useMarkStoryViewed()
  const addReaction = useStoryReaction()
  const deleteStory = useDeleteStory()
  const toast = useToast((s) => s.toast)
  const navigate = useNavigate()
  const replyInputRef = useRef<HTMLTextAreaElement>(null)

  const story = stories[currentIndex]
  const isLast = currentIndex === stories.length - 1
  const isOwn = story?.user_id === user?.id
  const isPaused = showReply || showViewers || showDeleteConfirm

  const goNext = useCallback(() => {
    if (isLast) {
      onClose()
    } else {
      setCurrentIndex((i) => i + 1)
      setProgress(0)
      setShowReply(false)
      setReplyText('')
    }
  }, [isLast, onClose])

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1)
      setProgress(0)
      setShowReply(false)
      setReplyText('')
    }
  }, [currentIndex])

  useEffect(() => {
    if (story) {
      markViewed.mutate(story.id)
    }
    // Only run when story changes index
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story?.id])

  // Auto-advance timer — pauses when reply/viewers/delete confirm is open
  useEffect(() => {
    if (isPaused) return
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
  }, [currentIndex, goNext, isPaused])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showReply || showViewers || showDeleteConfirm) {
          setShowReply(false)
          setShowViewers(false)
          setShowDeleteConfirm(false)
        } else {
          onClose()
        }
      }
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft') goPrev()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose, goNext, goPrev, showReply, showViewers, showDeleteConfirm])

  // Music sync — play/pause audio when musicPlaying changes
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    if (musicPlaying) {
      audio.play().catch(() => setMusicPlaying(false))
    } else {
      audio.pause()
    }
  }, [musicPlaying])

  // Reset music state on story change
  useEffect(() => {
    setMusicPlaying(false)
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
  }, [currentIndex])

  // Touch swipe handlers for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    touchDeltaRef.current = 0
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return
    const dx = e.touches[0].clientX - touchStartRef.current.x
    touchDeltaRef.current = dx
  }, [])

  const handleTouchEnd = useCallback(() => {
    const dx = touchDeltaRef.current
    if (Math.abs(dx) > 60) {
      if (dx < 0) goNext()
      else goPrev()
    }
    touchStartRef.current = null
    touchDeltaRef.current = 0
  }, [goNext, goPrev])

  const handleReaction = (emoji: string) => {
    if (!story) return
    addReaction.mutate({ storyId: story.id, emoji })
  }

  const handleReply = () => {
    if (!story || !replyText.trim()) return
    onReply?.(story.id, replyText.trim())
    setReplyText('')
    setShowReply(false)
  }

  const handleDelete = async () => {
    if (!story) return
    try {
      await deleteStory.mutateAsync(story.id)
      toast({ title: 'Story deleted', variant: 'success' })
      setShowDeleteConfirm(false)
      if (stories.length <= 1) {
        onClose()
      } else {
        goNext()
      }
    } catch {
      toast({ title: 'Failed to delete story', variant: 'error' })
    }
  }

  const handleViewProfile = (username: string) => {
    onClose()
    navigate(`/profile/${username}`)
  }

  if (!story) return null

  return (
    <div
      className="fixed inset-0 z-modal bg-black flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Story viewer"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Hidden audio element for music playback */}
      {story.music_url && (
        <audio
          ref={audioRef}
          src={story.music_url}
          loop
          preload="auto"
          onError={() => setMusicPlaying(false)}
        />
      )}

      <button onClick={onClose} className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors" aria-label="Close story">
        <X className="h-6 w-6" />
      </button>

      {/* Progress bars */}
      <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-2">
        {stories.map((_, i) => (
          <div key={i} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full"
              style={{
                width: i < currentIndex ? '100%' : i === currentIndex ? `${progress}%` : '0%',
                transition: isPaused ? 'none' : undefined,
              }}
            />
          </div>
        ))}
      </div>

      {/* User info */}
      <div className="absolute top-6 left-0 right-0 z-20 flex items-center gap-3 px-4">
        <button onClick={() => handleViewProfile(story.user.username)} className="flex items-center gap-3 min-w-0">
          <Avatar src={story.user.avatar} alt={story.user.name} size="sm" />
          <div className="flex-1 min-w-0 text-left">
            <span className="text-sm font-semibold text-white">{story.user.name}</span>
            <span className="text-xs text-white/60 ml-2">{timeAgo(story.created_at)}</span>
          </div>
        </button>
        {isOwn && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowViewers(!showViewers)}
              className="flex items-center gap-1 text-xs text-white/70 hover:text-white"
              aria-label={`${story.view_count || 0} views`}
            >
              <Eye className="h-4 w-4" />
              {story.view_count || 0}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-1.5 rounded-full bg-black/30 hover:bg-red-500/50 text-white/70 hover:text-white transition-colors"
              aria-label="Delete story"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Story Content */}
      {story.media_type === 'text' && story.background_style ? (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ background: story.background_style.value }}
        >
          <p
            className={cn(
              'text-center px-12 text-3xl font-bold whitespace-pre-wrap break-words',
              getFontClass(story.font_style)
            )}
            style={{ color: story.text_color }}
          >
            {story.text_content}
          </p>
        </div>
      ) : story.media_url && story.media_type === 'video' ? (
        <video
          src={story.media_url}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
        />
      ) : story.media_url ? (
        <img src={story.media_url} alt={`Story by ${story.user.name}`} className="absolute inset-0 w-full h-full object-cover" />
      ) : null}

      {/* Text overlay on media */}
      {story.media_url && story.text_content && story.media_type !== 'text' && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <p
            className={cn(
              'text-center px-8 text-2xl font-bold whitespace-pre-wrap break-words drop-shadow-lg',
              getFontClass(story.font_style)
            )}
            style={{ color: story.text_color }}
          >
            {story.text_content}
          </p>
        </div>
      )}

      {/* Stickers */}
      {story.stickers && story.stickers.length > 0 && (
        <div className="absolute inset-0 z-10 pointer-events-none">
          {story.stickers.map((s) => (
            <div
              key={s.id}
              className="absolute text-4xl"
              style={{
                left: `${s.x}%`,
                top: `${s.y}%`,
                transform: `translate(-50%, -50%) scale(${s.scale}) rotate(${s.rotation}deg)`,
              }}
            >
              {s.content}
            </div>
          ))}
        </div>
      )}

      {/* Music bar */}
      {story.music_url && (
        <div className="absolute bottom-20 left-4 right-4 z-20">
          <div className="flex items-center gap-3 bg-black/50 backdrop-blur-sm rounded-full px-4 py-2.5">
            <button
              onClick={() => setMusicPlaying(!musicPlaying)}
              className="p-1 rounded-full bg-white/20"
              aria-label={musicPlaying ? 'Pause music' : 'Play music'}
            >
              {musicPlaying ? <Pause className="h-3 w-3 text-white" /> : <Play className="h-3 w-3 text-white" />}
            </button>
            <Music className="h-4 w-4 text-white flex-shrink-0" />
            <span className="text-xs text-white truncate flex-1">{story.music_title || 'Music'}</span>
          </div>
        </div>
      )}

      {/* Viewers panel (own stories) */}
      {showViewers && isOwn && (
        <StoryViewersPanel storyId={story.id} onClose={() => setShowViewers(false)} onViewProfile={handleViewProfile} />
      )}

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-bg-primary rounded-2xl p-6 mx-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-semibold text-text-primary mb-2">Delete story?</h3>
            <p className="text-sm text-text-secondary mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 h-11 rounded-2xl border-2 border-border text-text-secondary font-medium hover:bg-bg-tertiary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteStory.isPending}
                className="flex-1 h-11 rounded-2xl bg-error text-white font-medium hover:bg-error-hover transition-colors disabled:opacity-50"
              >
                {deleteStory.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation arrows */}
      {currentIndex > 0 && (
        <button onClick={goPrev} className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors" aria-label="Previous story">
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}
      {!isLast && (
        <button onClick={goNext} className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors" aria-label="Next story">
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      {/* Tap zones */}
      <div className="absolute inset-0 z-5 flex">
        <div className="w-1/3 h-full" onClick={goPrev} />
        <div className="w-1/3 h-full" />
        <div className="w-1/3 h-full" onClick={goNext} />
      </div>

      {/* Bottom bar: reactions + reply */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-4" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}>
        <div className="flex items-center gap-2 mb-2">
          {QUICK_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleReaction(emoji)}
              className="h-10 w-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 text-xl transition-colors active:scale-125"
              aria-label={`React with ${emoji}`}
            >
              {emoji}
            </button>
          ))}
          <button
            onClick={() => {
              setShowReply(!showReply)
              setTimeout(() => replyInputRef.current?.focus(), 100)
            }}
            className="ml-auto px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white text-sm font-medium transition-colors"
            aria-label="Reply to story"
          >
            Reply
          </button>
        </div>

        {/* Reply input */}
        {showReply && (
          <div className="flex items-center gap-2">
            <textarea
              ref={replyInputRef}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleReply()
                }
              }}
              placeholder="Send a reply..."
              rows={1}
              className="flex-1 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2.5 text-sm text-white placeholder:text-white/50 resize-none focus:outline-none focus:ring-2 focus:ring-white/30"
              aria-label="Reply text"
            />
            <button
              onClick={handleReply}
              disabled={!replyText.trim()}
              className="p-2.5 rounded-full bg-accent text-white disabled:opacity-50 transition-opacity"
              aria-label="Send reply"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function StoryViewersPanel({ storyId, onClose, onViewProfile }: { storyId: string; onClose: () => void; onViewProfile: (username: string) => void }) {
  const { data: viewers = [] } = useStoryViews(storyId)

  return (
    <div className="absolute bottom-20 left-4 right-4 z-30 bg-bg-primary rounded-2xl shadow-xl max-h-[50vh] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-text-primary">Viewers ({viewers.length})</h3>
        <button onClick={onClose} className="p-1 rounded-full hover:bg-bg-tertiary text-text-secondary" aria-label="Close viewers">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="overflow-y-auto max-h-[40vh]">
        {viewers.length === 0 ? (
          <p className="text-center text-text-tertiary text-sm py-8">No viewers yet</p>
        ) : (
          viewers.map((v: any, i: number) => (
            <button
              key={i}
              onClick={() => v.user?.username && onViewProfile(v.user.username)}
              className="flex items-center gap-3 px-4 py-3 w-full hover:bg-bg-tertiary transition-colors text-left"
            >
              <Avatar src={v.user?.avatar} alt={v.user?.name} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary">{v.user?.name}</p>
                <p className="text-xs text-text-tertiary">@{v.user?.username}</p>
              </div>
              <span className="text-xs text-text-tertiary">{timeAgo(v.viewed_at)}</span>
            </button>
          ))
        )}
      </div>
    </div>
  )
}

function getFontClass(fontStyle?: string): string {
  switch (fontStyle) {
    case 'serif': return 'font-serif'
    case 'mono': return 'font-mono'
    case 'display': return 'font-sans font-black tracking-tight text-4xl'
    default: return 'font-sans'
  }
}
