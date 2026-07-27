import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal } from 'lucide-react'
import { Avatar } from '@/components/atoms/avatar'
import { Card } from '@/components/molecules/card'
import { cn } from '@/lib/utils'
import { timeAgo } from '@/lib/timeago'

interface PostCardProps {
  author: { name: string; username: string; avatar?: string }
  community?: string; content: string; images?: string[]; timestamp: string
  likes: number; comments: number; liked?: boolean; saved?: boolean
  onLike?: () => void; onComment?: () => void; onShare?: () => void; onSave?: () => void
}

export function PostCard({ author, community, content, images, timestamp, likes, comments, liked = false, saved = false, onLike, onComment, onShare, onSave }: PostCardProps) {
  return (
    <Card padding="none">
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <Avatar src={author.avatar} alt={author.name} />
            <div>
              <div className="font-semibold text-text-primary">{author.name}</div>
              <div className="text-sm text-text-secondary">
                {community && <span>in {community} · </span>}{timeAgo(timestamp)}
              </div>
            </div>
          </div>
          <button className="p-1 rounded-full hover:bg-bg-tertiary text-text-secondary" aria-label="More options"><MoreHorizontal className="h-5 w-5" /></button>
        </div>
        <p className="text-text-primary whitespace-pre-wrap">{content}</p>
        {images && images.length > 0 && (
          <div className={`mt-3 grid gap-1 rounded-lg overflow-hidden ${images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
            {images.map((img, i) => (
              <img key={i} src={img} alt={`Post image ${i + 1}`} className="w-full h-auto object-cover max-h-80" loading="lazy" />
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between px-4 py-3 border-t border-border">
        <button onClick={onLike} className={cn('flex items-center gap-2 text-sm transition-colors', liked ? 'text-accent' : 'text-text-secondary hover:text-text-primary')} aria-label={liked ? 'Unlike' : 'Like'}>
          <Heart className={cn('h-5 w-5', liked && 'fill-current')} /><span>{likes}</span>
        </button>
        <button onClick={onComment} className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors" aria-label={`Comment (${comments})`}>
          <MessageCircle className="h-5 w-5" /><span>{comments}</span>
        </button>
        <button onClick={onShare} className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors" aria-label="Share">
          <Share2 className="h-5 w-5" /><span>Share</span>
        </button>
        <button onClick={onSave} className={cn('transition-colors', saved ? 'text-accent' : 'text-text-secondary hover:text-text-primary')} aria-label={saved ? 'Remove from bookmarks' : 'Bookmark'}>
          <Bookmark className={cn('h-5 w-5', saved && 'fill-current')} />
        </button>
      </div>
    </Card>
  )
}
