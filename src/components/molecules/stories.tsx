import { motion } from 'framer-motion'
import { Plus, Eye, Flame, Clock } from 'lucide-react'
import { Avatar } from '@/components/atoms/avatar'
import { cn } from '@/lib/utils'
import { timeAgo } from '@/lib/timeago'
import type { Story } from '@/types/api'

interface StoriesProps {
  stories: Story[]
  onStoryClick: (id: string) => void
  onAddStory: () => void
  userAvatar?: string
  currentUserId?: string
}

export function Stories({ stories, onStoryClick, onAddStory, userAvatar, currentUserId }: StoriesProps) {
  // Group stories by user — show one card per user, latest story
  const groupedStories = groupByUser(stories)

  return (
    <div className="px-4 py-3 space-y-3">
      {/* Your Story — Create Card */}
      <motion.button
        onClick={onAddStory}
        className={cn(
          'w-full flex items-center gap-4 p-4 rounded-2xl',
          'bg-bg-primary border-2 border-dashed border-accent/30',
          'hover:border-accent/60 hover:bg-accent-light/20',
          'transition-colors duration-200 group'
        )}
        whileTap={{ scale: 0.98 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        <div className="relative flex-shrink-0">
          <Avatar size="lg" src={userAvatar} alt="Your Story" />
          <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-accent flex items-center justify-center border-2 border-bg-primary">
            <Plus className="h-3.5 w-3.5 text-white" />
          </div>
          {/* Pulse ring behind the + */}
          <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-accent/40 animate-pulse-ring" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-semibold text-text-primary">Create your story</p>
          <p className="text-xs text-text-tertiary mt-0.5">Share what's on your mind</p>
        </div>
      </motion.button>

      {/* Story Cards */}
      {groupedStories.map((item, i) => (
        <StoryCard
          key={item.userId}
          story={item.latestStory}
          storyCount={item.count}
          isOwn={item.userId === currentUserId}
          hasUnviewed={item.hasUnviewed}
          index={i}
          onClick={() => onStoryClick(item.latestStory.id)}
        />
      ))}
    </div>
  )
}

// ===== Story Card =====

interface StoryCardProps {
  story: Story
  storyCount: number
  isOwn: boolean
  hasUnviewed: boolean
  index: number
  onClick: () => void
}

function StoryCard({ story, storyCount, isOwn, hasUnviewed, index, onClick }: StoryCardProps) {
  return (
    <motion.button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-4 p-3 rounded-2xl text-left',
        'bg-bg-primary shadow-sm',
        'hover:shadow-md active:scale-[0.98]',
        'transition-shadow duration-200',
        hasUnviewed && 'animate-breathe'
      )}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: (index + 1) * 0.08,
        type: 'spring',
        stiffness: 260,
        damping: 24,
      }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
    >
      {/* Thumbnail with organic clip */}
      <div className="relative flex-shrink-0">
        {/* Rotating gradient ring for unviewed */}
        {hasUnviewed && (
          <div className="absolute -inset-1 rounded-full story-ring-unviewed" />
        )}
        <div className={cn(
          'relative h-14 w-14 rounded-full overflow-hidden',
          hasUnviewed ? 'p-[3px]' : 'p-0'
        )}>
          {hasUnviewed && (
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-accent to-accent-hover" />
          )}
          <div className="relative h-full w-full rounded-full bg-bg-primary overflow-hidden">
            {story.media_type === 'text' && story.background_style ? (
              <div
                className="h-full w-full flex items-center justify-center"
                style={{ background: story.background_style.value }}
              >
                <span className="text-lg font-bold text-white">
                  {story.text_content?.charAt(0) || '?'}
                </span>
              </div>
            ) : story.media_url ? (
              <img
                src={story.media_url}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <Avatar size="lg" src={story.user.avatar} alt={story.user.username} />
            )}
          </div>
        </div>
        {/* Story count badge */}
        {storyCount > 1 && (
          <div className="absolute -top-1 -right-1 h-5 min-w-[20px] rounded-full bg-accent flex items-center justify-center px-1">
            <span className="text-[10px] font-bold text-white">{storyCount}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-text-primary truncate">
            {isOwn ? 'Your Story' : story.user.name}
          </p>
          {isOwn && (
            <span className="flex-shrink-0 text-[10px] font-medium text-accent bg-accent/10 px-1.5 py-0.5 rounded-full">
              YOU
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-text-tertiary flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {timeAgo(story.created_at)}
          </span>
          {(story.view_count ?? 0) > 0 && (
            <span className="text-xs text-text-tertiary flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {story.view_count}
            </span>
          )}
          {(story.reaction_count ?? 0) > 0 && (
            <span className="text-xs text-text-tertiary flex items-center gap-1">
              <Flame className="h-3 w-3" />
              {story.reaction_count}
            </span>
          )}
        </div>
        {/* Mini progress dots */}
        {storyCount > 1 && (
          <div className="flex gap-1 mt-2">
            {Array.from({ length: Math.min(storyCount, 5) }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'h-1 rounded-full flex-1 max-w-[24px]',
                  i === 0 ? 'bg-accent' : 'bg-border'
                )}
              />
            ))}
            {storyCount > 5 && (
              <span className="text-[10px] text-text-tertiary ml-1">+{storyCount - 5}</span>
            )}
          </div>
        )}
      </div>

      {/* Chevron */}
      <div className="flex-shrink-0 text-text-tertiary">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </motion.button>
  )
}

// ===== Helpers =====

function groupByUser(stories: Story[]) {
  const map = new Map<string, { userId: string; stories: Story[]; hasUnviewed: boolean }>()

  for (const story of stories) {
    const existing = map.get(story.user_id)
    if (existing) {
      existing.stories.push(story)
      if (!story.has_viewed) existing.hasUnviewed = true
    } else {
      map.set(story.user_id, {
        userId: story.user_id,
        stories: [story],
        hasUnviewed: !story.has_viewed,
      })
    }
  }

  return Array.from(map.values())
    .map((group) => ({
      userId: group.userId,
      latestStory: group.stories[0], // already sorted by created_at DESC
      count: group.stories.length,
      hasUnviewed: group.hasUnviewed,
    }))
    .sort((a, b) => {
      // Unviewed first, then by time
      if (a.hasUnviewed !== b.hasUnviewed) return a.hasUnviewed ? -1 : 1
      return new Date(b.latestStory.created_at).getTime() - new Date(a.latestStory.created_at).getTime()
    })
}
