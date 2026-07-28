import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'
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
  const [direction, setDirection] = useState(0)
  const [showReply, setShowReply] = useState(false)
  const [showViewers, setShowViewers] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [musicPlaying, setMusicPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
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

  // Drag-to-dismiss
  const dragY = useMotionValue(0)
  const dragOpacity = useTransform(dragY, [0, 200], [1, 0])
  const dragScale = useTransform(dragY, [0, 200], [1, 0.92])

  const goNext = useCallback(() => {
    if (isLast) {
      onClose()
    } else {
      setDirection(1)
      setCurrentIndex((i) => i + 1)
      setShowReply(false)
    }
  }, [isLast, onClose])

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setDirection(-1)
      setCurrentIndex((i) => i - 1)
      setShowReply(false)
    }
  }, [currentIndex])

  // Mark as viewed
  useEffect(() => {
    if (story) markViewed.mutate(story.id)
  }, [story?.id])

  // Progress bar animation
  useEffect(() => {
    if (isPaused || !progressRef.current) return
    const el = progressRef.current
    el.style.transition = 'none'
    el.style.transform = 'scaleX(0)'
    // Force reflow
    void el.offsetHeight
    el.style.transition = 'transform 5s linear'
    el.style.transform = 'scaleX(1)'

    const timer = setTimeout(goNext, 5000)
    return () => {
      clearTimeout(timer)
      el.style.transition = 'none'
    }
  }, [currentIndex, goNext, isPaused])

  // Music sync
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    if (musicPlaying) audio.play().catch(() => setMusicPlaying(false))
    else audio.pause()
  }, [musicPlaying])

  useEffect(() => {
    setMusicPlaying(false)
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0 }
  }, [currentIndex])

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  // Keyboard
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showReply || showViewers || showDeleteConfirm) {
          setShowReply(false); setShowViewers(false); setShowDeleteConfirm(false)
        } else { onClose() }
      }
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft') goPrev()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose, goNext, goPrev, showReply, showViewers, showDeleteConfirm])

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
      if (stories.length <= 1) onClose()
      else goNext()
    } catch {
      toast({ title: 'Failed to delete story', variant: 'error' })
    }
  }

  const handleViewProfile = (username: string) => {
    onClose()
    navigate(`/profile/${username}`)
  }

  const [replyText, setReplyText] = useState('')

  if (!story) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-modal bg-black flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Draggable dismiss layer */}
        <motion.div
          className="absolute inset-0"
          style={{ y: dragY, opacity: dragOpacity, scale: dragScale }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.3}
          onDragEnd={(_, info) => {
            if (info.offset.y > 100 || info.velocity.y > 500) onClose()
          }}
        >
          {/* Hidden audio */}
          {story.music_url && (
            <audio ref={audioRef} src={story.music_url} loop preload="auto" onError={() => setMusicPlaying(false)} />
          )}

          {/* Close button */}
          <motion.button
            onClick={onClose}
            className="absolute top-4 right-4 z-30 p-2 rounded-full bg-black/40 backdrop-blur-sm text-white"
            whileTap={{ scale: 0.85 }}
            aria-label="Close story"
          >
            <X className="h-6 w-6" />
          </motion.button>

          {/* Progress bars */}
          <div className="absolute top-0 left-0 right-0 z-30 flex gap-1 p-3">
            {stories.map((_, i) => (
              <div key={i} className="flex-1 h-[3px] bg-white/20 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full origin-left',
                    i < currentIndex ? 'bg-white scaleX-100' : i === currentIndex ? 'bg-white' : 'bg-white/0'
                  )}
                  style={{
                    transform: i < currentIndex ? 'scaleX(1)' : i === currentIndex ? undefined : 'scaleX(0)',
                    transformOrigin: 'left',
                  }}
                >
                  {i === currentIndex && (
                    <div
                      ref={progressRef}
                      className="h-full bg-white rounded-full origin-left"
                      style={{ transform: 'scaleX(0)' }}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* User info */}
          <motion.div
            className="absolute top-8 left-0 right-0 z-30 flex items-center gap-3 px-4"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <button onClick={() => handleViewProfile(story.user.username)} className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-full bg-white/10 backdrop-blur-sm p-[2px]">
                <Avatar src={story.user.avatar} alt={story.user.name} size="sm" className="h-full w-full" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <span className="text-sm font-semibold text-white drop-shadow-lg">{story.user.name}</span>
                <span className="text-xs text-white/50 ml-2">{timeAgo(story.created_at)}</span>
              </div>
            </button>
            {isOwn && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowViewers(!showViewers)}
                  className="flex items-center gap-1 text-xs text-white/60 hover:text-white bg-black/20 backdrop-blur-sm rounded-full px-2.5 py-1"
                >
                  <Eye className="h-3.5 w-3.5" />
                  {story.view_count || 0}
                </button>
                <motion.button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-1.5 rounded-full bg-black/20 backdrop-blur-sm text-white/60 hover:text-red-400 hover:bg-red-500/20"
                  whileTap={{ scale: 0.85 }}
                  aria-label="Delete story"
                >
                  <Trash2 className="h-4 w-4" />
                </motion.button>
              </div>
            )}
          </motion.div>

          {/* Story Content */}
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={story.id}
              className="absolute inset-0"
              custom={direction}
              variants={{
                enter: (dir: number) => ({ x: dir > 0 ? '80%' : '-80%', opacity: 0, scale: 0.85 }),
                center: { x: 0, opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 30 } },
                exit: (dir: number) => ({ x: dir > 0 ? '-80%' : '80%', opacity: 0, scale: 0.85, transition: { duration: 0.25 } }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
            >
              {/* Content layer */}
              {story.media_type === 'text' && story.background_style ? (
                <div className="absolute inset-0 flex items-center justify-center" style={{ background: story.background_style.value }}>
                  <motion.p
                    className={cn('text-center px-12 text-3xl font-bold whitespace-pre-wrap break-words', getFontClass(story.font_style))}
                    style={{ color: story.text_color }}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
                  >
                    {story.text_content}
                  </motion.p>
                </div>
              ) : story.media_url && story.media_type === 'video' ? (
                <video src={story.media_url} className="absolute inset-0 w-full h-full object-cover" autoPlay muted loop playsInline />
              ) : story.media_url ? (
                <img src={story.media_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
              ) : null}

              {/* Text overlay on media */}
              {story.media_url && story.text_content && story.media_type !== 'text' && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <p
                    className={cn('text-center px-8 text-2xl font-bold whitespace-pre-wrap break-words drop-shadow-lg', getFontClass(story.font_style))}
                    style={{ color: story.text_color }}
                  >
                    {story.text_content}
                  </p>
                </div>
              )}

              {/* Stickers with spring animation */}
              {story.stickers && story.stickers.length > 0 && (
                <div className="absolute inset-0 z-10 pointer-events-none">
                  {story.stickers.map((s, si) => (
                    <motion.div
                      key={s.id}
                      className="absolute text-4xl"
                      style={{ left: `${s.x}%`, top: `${s.y}%`, transform: `translate(-50%, -50%) scale(${s.scale}) rotate(${s.rotation}deg)` }}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: s.scale }}
                      transition={{ delay: 0.3 + si * 0.1, type: 'spring', stiffness: 400, damping: 15 }}
                    >
                      {s.content}
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Music bar */}
              {story.music_url && (
                <motion.div
                  className="absolute bottom-20 left-4 right-4 z-20"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md rounded-full px-4 py-2.5">
                    <motion.button
                      onClick={() => setMusicPlaying(!musicPlaying)}
                      className="p-1 rounded-full bg-white/15"
                      whileTap={{ scale: 0.85 }}
                    >
                      {musicPlaying ? <Pause className="h-3 w-3 text-white" /> : <Play className="h-3 w-3 text-white" />}
                    </motion.button>
                    <Music className="h-4 w-4 text-white/70 flex-shrink-0" />
                    <span className="text-xs text-white/80 truncate flex-1">{story.music_title || 'Music'}</span>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Viewers panel */}
          <AnimatePresence>
            {showViewers && isOwn && (
              <StoryViewersPanel storyId={story.id} onClose={() => setShowViewers(false)} onViewProfile={handleViewProfile} />
            )}
          </AnimatePresence>

          {/* Delete confirmation */}
          <AnimatePresence>
            {showDeleteConfirm && (
              <motion.div
                className="absolute inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="bg-bg-primary rounded-3xl p-6 mx-6 max-w-sm w-full shadow-2xl"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                >
                  <h3 className="text-lg font-semibold text-text-primary mb-2">Delete story?</h3>
                  <p className="text-sm text-text-secondary mb-6">This action cannot be undone.</p>
                  <div className="flex gap-3">
                    <motion.button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 h-12 rounded-2xl border-2 border-border text-text-secondary font-medium"
                      whileTap={{ scale: 0.95 }}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      onClick={handleDelete}
                      disabled={deleteStory.isPending}
                      className="flex-1 h-12 rounded-2xl bg-error text-white font-medium disabled:opacity-50"
                      whileTap={{ scale: 0.95 }}
                    >
                      {deleteStory.isPending ? 'Deleting...' : 'Delete'}
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation arrows */}
          {currentIndex > 0 && (
            <motion.button
              onClick={goPrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/30 backdrop-blur-sm text-white"
              whileTap={{ scale: 0.85 }}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              aria-label="Previous story"
            >
              <ChevronLeft className="h-6 w-6" />
            </motion.button>
          )}
          {!isLast && (
            <motion.button
              onClick={goNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/30 backdrop-blur-sm text-white"
              whileTap={{ scale: 0.85 }}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              aria-label="Next story"
            >
              <ChevronRight className="h-6 w-6" />
            </motion.button>
          )}

          {/* Tap zones */}
          <div className="absolute inset-0 z-5 flex">
            <div className="w-1/3 h-full" onClick={goPrev} />
            <div className="w-1/3 h-full" />
            <div className="w-1/3 h-full" onClick={goNext} />
          </div>

          {/* Bottom bar */}
          <div
            className="absolute bottom-0 left-0 right-0 z-20 p-4"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}
          >
            {/* Reactions */}
            <motion.div
              className="flex items-center gap-2 mb-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {QUICK_REACTIONS.map((emoji) => (
                <motion.button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  className="h-10 w-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm text-xl"
                  whileTap={{ scale: [1, 1.6, 0.8, 1.2, 1] }}
                  transition={{ duration: 0.5 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  aria-label={`React with ${emoji}`}
                >
                  {emoji}
                </motion.button>
              ))}
              <motion.button
                onClick={() => {
                  setShowReply(!showReply)
                  setTimeout(() => replyInputRef.current?.focus(), 150)
                }}
                className="ml-auto px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm font-medium"
                whileTap={{ scale: 0.92 }}
              >
                Reply
              </motion.button>
            </motion.div>

            {/* Reply input */}
            <AnimatePresence>
              {showReply && (
                <motion.div
                  className="flex items-center gap-2"
                  initial={{ opacity: 0, y: 10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: 10, height: 0 }}
                >
                  <textarea
                    ref={replyInputRef}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply() }
                    }}
                    placeholder="Send a reply..."
                    rows={1}
                    className="flex-1 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2.5 text-sm text-white placeholder:text-white/40 resize-none focus:outline-none focus:ring-2 focus:ring-white/20"
                    aria-label="Reply text"
                  />
                  <motion.button
                    onClick={handleReply}
                    disabled={!replyText.trim()}
                    className="p-2.5 rounded-full bg-accent text-white disabled:opacity-40"
                    whileTap={{ scale: 0.85 }}
                  >
                    <Send className="h-4 w-4" />
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ===== Viewers Panel =====

function StoryViewersPanel({ storyId, onClose, onViewProfile }: { storyId: string; onClose: () => void; onViewProfile: (u: string) => void }) {
  const { data: viewers = [] } = useStoryViews(storyId)

  return (
    <motion.div
      className="absolute bottom-20 left-4 right-4 z-30 bg-bg-primary rounded-3xl shadow-2xl max-h-[50vh] overflow-hidden"
      initial={{ opacity: 0, y: 40, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 40, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <h3 className="text-sm font-semibold text-text-primary">Viewers ({viewers.length})</h3>
        <motion.button onClick={onClose} className="p-1.5 rounded-full hover:bg-bg-tertiary text-text-secondary" whileTap={{ scale: 0.85 }}>
          <X className="h-4 w-4" />
        </motion.button>
      </div>
      <div className="overflow-y-auto max-h-[40vh]">
        {viewers.length === 0 ? (
          <p className="text-center text-text-tertiary text-sm py-8">No viewers yet</p>
        ) : (
          viewers.map((v: any, i: number) => (
            <motion.button
              key={v.id ?? v.user?.id ?? i}
              onClick={() => v.user?.username && onViewProfile(v.user.username)}
              className="flex items-center gap-3 px-5 py-3 w-full hover:bg-bg-tertiary transition-colors text-left"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Avatar src={v.user?.avatar} alt={v.user?.name} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary">{v.user?.name}</p>
                <p className="text-xs text-text-tertiary">@{v.user?.username}</p>
              </div>
              <span className="text-xs text-text-tertiary">{timeAgo(v.viewed_at)}</span>
            </motion.button>
          ))
        )}
      </div>
    </motion.div>
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
