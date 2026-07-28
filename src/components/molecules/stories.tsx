import { Plus } from 'lucide-react'
import { Avatar } from '@/components/atoms/avatar'
import { cn } from '@/lib/utils'
import type { Story } from '@/types/api'

interface StoriesProps {
  stories: Story[]
  onStoryClick: (id: string) => void
  onAddStory: () => void
  userAvatar?: string
  currentUserId?: string
}

export function Stories({ stories, onStoryClick, onAddStory, userAvatar, currentUserId }: StoriesProps) {
  return (
    <div className="flex gap-4 p-4 overflow-x-auto scrollbar-none">
      <button onClick={onAddStory} className="flex flex-col items-center gap-1 flex-shrink-0" aria-label="Add to your story">
        <div className="relative">
          <Avatar size="lg" src={userAvatar} alt="Your Story" />
          <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-accent flex items-center justify-center border-2 border-bg-primary">
            <Plus className="h-3 w-3 text-text-inverse" />
          </div>
        </div>
        <span className="text-xs font-medium text-accent">Your Story</span>
      </button>
      {stories.map((story) => {
        const isOwn = story.user_id === currentUserId
        return (
          <button
            key={story.id}
            onClick={() => onStoryClick(story.id)}
            className="flex flex-col items-center gap-1 flex-shrink-0"
            aria-label={`View ${story.user.username}'s story`}
          >
            <div className={cn(
              'rounded-full p-0.5',
              story.has_viewed ? 'bg-border' : 'bg-gradient-to-br from-accent to-accent-hover'
            )}>
              <div className="rounded-full p-0.5 bg-bg-primary">
                {story.media_type === 'text' && story.background_style ? (
                  <div
                    className="h-12 w-12 rounded-full flex items-center justify-center"
                    style={{ background: story.background_style.value }}
                  >
                    <span className="text-xs font-bold text-white truncate max-w-[40px]">
                      {story.text_content?.charAt(0) || '?'}
                    </span>
                  </div>
                ) : (
                  <Avatar size="lg" src={story.user.avatar} alt={story.user.username} />
                )}
              </div>
            </div>
            <span className={cn(
              'text-xs truncate max-w-[64px]',
              isOwn ? 'font-medium text-accent' : 'text-text-secondary'
            )}>
              {isOwn ? 'Your Story' : story.user.username}
            </span>
          </button>
        )
      })}
    </div>
  )
}
