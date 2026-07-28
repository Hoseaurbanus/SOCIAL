import { Plus } from 'lucide-react'
import { Avatar } from '@/components/atoms/avatar'
import { cn } from '@/lib/utils'

interface Story { id: string; username: string; avatar?: string; seen?: boolean }
interface StoriesProps { stories: Story[]; onStoryClick: (id: string) => void; onAddStory: () => void; userAvatar?: string }

export function Stories({ stories, onStoryClick, onAddStory, userAvatar }: StoriesProps) {
  return (
    <div className="flex gap-4 p-4 overflow-x-auto">
      <button onClick={onAddStory} className="flex flex-col items-center gap-1" aria-label="Add to your story">
        <div className="relative">
          <Avatar size="lg" src={userAvatar} alt="Your Story" />
          <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-accent flex items-center justify-center border-2 border-bg-primary">
            <Plus className="h-3 w-3 text-text-inverse" />
          </div>
        </div>
        <span className="text-xs text-text-secondary">Your Story</span>
      </button>
      {stories.map((story) => (
        <button key={story.id} onClick={() => onStoryClick(story.id)} className="flex flex-col items-center gap-1" aria-label={`View ${story.username}'s story`}>
          <div className={cn('rounded-full p-0.5', story.seen ? 'bg-border' : 'bg-gradient-to-br from-accent to-accent-hover')}>
            <div className="rounded-full p-0.5 bg-bg-primary">
              <Avatar size="lg" src={story.avatar} alt={story.username} />
            </div>
          </div>
          <span className="text-xs text-text-secondary truncate max-w-[64px]">{story.username}</span>
        </button>
      ))}
    </div>
  )
}
