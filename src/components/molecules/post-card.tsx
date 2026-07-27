import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal } from 'lucide-react'
import { Avatar } from '@/components/atoms/avatar'
import { Card } from '@/components/molecules/card'
import { cn } from '@/lib/utils'

interface PostCardProps {
  author: { name: string; username: string; avatar?: string }
  community?: string; content: string; timestamp: string
  likes: number; comments: number; liked?: boolean; saved?: boolean
  onLike?: () => void; onComment?: () => void; onShare?: () => void; onSave?: () => void
}

export function PostCard({ author, community, content, timestamp, likes, comments, liked = false, saved = false, onLike, onComment, onShare, onSave }: PostCardProps) {
  return (
    <Card padding="none">
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <Avatar src={author.avatar} alt={author.name} />
            <div>
              <div className="font-semibold text-text-primary">{author.name}</div>
              <div className="text-sm text-text-secondary">
                {community && <span>in {community} · </span>}{timestamp}
              </div>
            </div>
          </div>
          <button className="p-1 rounded-full hover:bg-bg-tertiary text-text-secondary"><MoreHorizontal className="h-5 w-5" /></button>
        </div>
        <p className="text-text-primary whitespace-pre-wrap">{content}</p>
      </div>
      <div className="flex items-center justify-between px-4 py-3 border-t border-border">
        <button onClick={onLike} className={cn('flex items-center gap-2 text-sm transition-colors', liked ? 'text-accent' : 'text-text-secondary hover:text-text-primary')}>
          <Heart className={cn('h-5 w-5', liked && 'fill-current')} /><span>{likes}</span>
        </button>
        <button onClick={onComment} className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors">
          <MessageCircle className="h-5 w-5" /><span>{comments}</span>
        </button>
        <button onClick={onShare} className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors">
          <Share2 className="h-5 w-5" /><span>Share</span>
        </button>
        <button onClick={onSave} className={cn('transition-colors', saved ? 'text-accent' : 'text-text-secondary hover:text-text-primary')}>
          <Bookmark className={cn('h-5 w-5', saved && 'fill-current')} />
        </button>
      </div>
    </Card>
  )
}
