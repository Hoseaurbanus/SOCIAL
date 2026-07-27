import { useState } from 'react'
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Send } from 'lucide-react'
import { Avatar } from '@/components/atoms/avatar'
import { Card } from '@/components/molecules/card'
import { cn } from '@/lib/utils'
import { timeAgo } from '@/lib/timeago'
import { usePostComments, useAddComment } from '@/hooks/use-posts'

interface PostCardProps {
  postId?: string
  isOwnPost?: boolean
  author: { name: string; username: string; avatar?: string }
  community?: string; content: string; images?: string[]; timestamp: string
  likes: number; comments: number; liked?: boolean; saved?: boolean
  onLike?: () => void; onComment?: () => void; onShare?: () => void; onSave?: () => void
  onDelete?: () => void
}

export function PostCard({ postId, isOwnPost, author, community, content, images, timestamp, likes, comments, liked = false, saved = false, onLike, onComment, onShare, onSave, onDelete }: PostCardProps) {
  const [showComments, setShowComments] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [commentText, setCommentText] = useState('')
  const { data: postComments = [], isLoading: commentsLoading } = usePostComments(postId || '')
  const addCommentMutation = useAddComment()

  const handleSubmitComment = () => {
    if (!postId || !commentText.trim()) return
    addCommentMutation.mutate(
      { postId, content: commentText.trim() },
      { onSuccess: () => setCommentText('') }
    )
  }

  const handleCommentClick = () => {
    if (postId) {
      setShowComments(!showComments)
    } else {
      onComment?.()
    }
  }

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
          <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)} className="p-1 rounded-full hover:bg-bg-tertiary text-text-secondary" aria-label="More options">
              <MoreHorizontal className="h-5 w-5" />
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-full mt-1 z-20 w-40 bg-bg-primary border border-border rounded-lg shadow-lg py-1">
                  {isOwnPost && (
                    <button
                      onClick={() => { setShowMenu(false); onDelete?.() }}
                      className="w-full text-left px-4 py-2 text-sm text-error hover:bg-bg-tertiary transition-colors"
                    >
                      Delete post
                    </button>
                  )}
                  {!isOwnPost && (
                    <button
                      onClick={() => setShowMenu(false)}
                      className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-bg-tertiary transition-colors"
                    >
                      Report post
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
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
        <button onClick={handleCommentClick} className={cn('flex items-center gap-2 text-sm transition-colors', showComments ? 'text-accent' : 'text-text-secondary hover:text-text-primary')} aria-label={`Comment (${comments})`}>
          <MessageCircle className={cn('h-5 w-5', showComments && 'fill-current')} /><span>{comments}</span>
        </button>
        <button onClick={onShare} className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors" aria-label="Share">
          <Share2 className="h-5 w-5" /><span>Share</span>
        </button>
        <button onClick={onSave} className={cn('transition-colors', saved ? 'text-accent' : 'text-text-secondary hover:text-text-primary')} aria-label={saved ? 'Remove from bookmarks' : 'Bookmark'}>
          <Bookmark className={cn('h-5 w-5', saved && 'fill-current')} />
        </button>
      </div>

      {showComments && postId && (
        <div className="border-t border-border">
          <div className="px-4 py-3">
            {commentsLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="h-8 w-8 rounded-full bg-bg-tertiary" />
                    <div className="flex-1 space-y-1">
                      <div className="h-3 w-20 bg-bg-tertiary rounded" />
                      <div className="h-4 w-full bg-bg-tertiary rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : postComments.length === 0 ? (
              <p className="text-sm text-text-tertiary text-center py-2">No comments yet</p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {postComments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar src={comment.user.avatar} alt={comment.user.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-text-primary">{comment.user.name}</span>
                        <span className="text-xs text-text-tertiary">@{comment.user.username}</span>
                        <span className="text-xs text-text-tertiary">·</span>
                        <span className="text-xs text-text-tertiary">{timeAgo(comment.created_at)}</span>
                      </div>
                      <p className="text-sm text-text-primary mt-0.5">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="px-4 pb-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment()}
                placeholder="Write a comment..."
                className="flex-1 px-3 py-2 text-sm bg-bg-secondary border border-border rounded-full text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <button
                onClick={handleSubmitComment}
                disabled={!commentText.trim() || addCommentMutation.isPending}
                className={cn(
                  'p-2 rounded-full transition-colors',
                  commentText.trim() && !addCommentMutation.isPending
                    ? 'text-accent hover:bg-accent/10'
                    : 'text-text-tertiary'
                )}
                aria-label="Send comment"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
