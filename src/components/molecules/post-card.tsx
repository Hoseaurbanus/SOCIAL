import { useState } from 'react'
import { Link } from 'react-router'
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Send } from 'lucide-react'
import { Avatar } from '@/components/atoms/avatar'
import { cn } from '@/lib/utils'
import { timeAgo } from '@/lib/timeago'
import { usePostComments, useAddComment } from '@/hooks/use-posts'
import type { LinkPreview } from '@/types/api'

interface PostCardProps {
  postId?: string
  isOwnPost?: boolean
  author: { name: string; username: string; avatar?: string }
  community?: string; content: string; images?: string[]; videoUrl?: string | null; linkPreview?: LinkPreview | null; timestamp: string
  likes: number; comments: number; liked?: boolean; saved?: boolean
  onLike?: () => void; onComment?: () => void; onShare?: () => void; onSave?: () => void
  onDelete?: () => void
}

export function PostCard({ postId, isOwnPost, author, community, content, images, videoUrl, linkPreview, timestamp, likes, comments, liked = false, saved = false, onLike, onComment, onShare, onSave, onDelete }: PostCardProps) {
  const [showComments, setShowComments] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [commentText, setCommentText] = useState('')
  const { data: postComments = [], isLoading: commentsLoading } = usePostComments(showComments && postId ? postId : '')
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
    <div className="bg-bg-primary">
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <Link to={`/profile/${author.username}`}>
              <Avatar src={author.avatar} alt={author.name} />
            </Link>
            <div>
              <Link to={`/profile/${author.username}`} className="font-semibold text-text-primary hover:text-accent transition-colors">{author.name}</Link>
              <div className="flex items-center gap-1 text-sm text-text-secondary">
                {community && <span className="text-accent font-medium">in {community}</span>}
                {community && <span>·</span>}
                <span>{timeAgo(timestamp)}</span>
              </div>
            </div>
          </div>
          <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)} className="p-2 rounded-xl hover:bg-bg-tertiary text-text-secondary transition-colors" aria-label="More options">
              <MoreHorizontal className="h-5 w-5" />
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-full mt-1 z-20 w-48 bg-bg-primary border border-border rounded-2xl shadow-xl py-2">
                  {isOwnPost && (
                    <button
                      onClick={() => { setShowMenu(false); onDelete?.() }}
                      className="w-full text-left px-4 py-2.5 text-sm text-error hover:bg-error-light transition-colors flex items-center gap-2"
                    >
                      Delete post
                    </button>
                  )}
                  {!isOwnPost && (
                    <button
                      onClick={() => setShowMenu(false)}
                      className="w-full text-left px-4 py-2.5 text-sm text-text-primary hover:bg-bg-tertiary transition-colors flex items-center gap-2"
                    >
                      Report post
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
        <p className="text-text-primary whitespace-pre-wrap text-[15px] leading-relaxed">{content}</p>
        {images && images.length > 0 && (
          <div className={`mt-3 grid gap-1 rounded-2xl overflow-hidden ${images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
            {images.map((img, i) => (
              <img key={i} src={img} alt={`Post image ${i + 1}`} className="w-full h-auto object-cover max-h-96" loading="lazy" />
            ))}
          </div>
        )}
        {videoUrl && (
          <div className="mt-3 rounded-2xl overflow-hidden">
            <video src={videoUrl} controls playsInline className="w-full max-h-[512px] object-contain bg-black" />
          </div>
        )}
        {linkPreview && (
          <a href={linkPreview.url} target="_blank" rel="noopener noreferrer" className="mt-3 block rounded-2xl border border-border overflow-hidden hover:bg-bg-secondary transition-colors">
            <div className="flex">
              {linkPreview.image && (
                <img src={linkPreview.image} alt="" className="w-32 h-32 object-cover flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0 p-3">
                <p className="text-xs text-text-tertiary truncate">{linkPreview.domain}</p>
                <p className="text-sm font-medium text-text-primary line-clamp-2 mt-0.5">{linkPreview.title}</p>
                {linkPreview.description && <p className="text-xs text-text-secondary line-clamp-2 mt-1">{linkPreview.description}</p>}
              </div>
            </div>
          </a>
        )}
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-border">
        <div className="flex items-center gap-1">
          <button
            onClick={onLike}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-200',
              liked
                ? 'text-accent bg-accent-light'
                : 'text-text-secondary hover:text-accent hover:bg-accent-light/50'
            )}
            aria-label={liked ? 'Unlike' : 'Like'}
          >
            <Heart className={cn('h-4 w-4', liked && 'fill-current')} />
            <span>{likes}</span>
          </button>
          <button
            onClick={handleCommentClick}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-200',
              showComments
                ? 'text-accent bg-accent-light'
                : 'text-text-secondary hover:text-accent hover:bg-accent-light/50'
            )}
            aria-label={`Comment (${comments})`}
          >
            <MessageCircle className={cn('h-4 w-4', showComments && 'fill-current')} />
            <span>{comments}</span>
          </button>
          <button
            onClick={onShare}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium text-text-secondary hover:text-accent hover:bg-accent-light/50 transition-all duration-200"
            aria-label="Share"
          >
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline">Share</span>
          </button>
        </div>
        <button
          onClick={onSave}
          className={cn(
            'p-2 rounded-xl transition-all duration-200',
            saved
              ? 'text-secondary bg-secondary-light'
              : 'text-text-secondary hover:text-secondary hover:bg-secondary-light/50'
          )}
          aria-label={saved ? 'Remove from bookmarks' : 'Bookmark'}
        >
          <Bookmark className={cn('h-4 w-4', saved && 'fill-current')} />
        </button>
      </div>

      {/* Comments section */}
      {showComments && postId && (
        <div className="border-t border-border bg-bg-secondary/50">
          <div className="px-4 py-3">
            {commentsLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="h-8 w-8 rounded-2xl bg-bg-tertiary" />
                    <div className="flex-1 space-y-1">
                      <div className="h-3 w-20 bg-bg-tertiary rounded" />
                      <div className="h-4 w-full bg-bg-tertiary rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : postComments.length === 0 ? (
              <p className="text-sm text-text-tertiary text-center py-4">No comments yet. Be the first to comment!</p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {postComments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <Link to={`/profile/${comment.user.username}`}>
                      <Avatar src={comment.user.avatar} alt={comment.user.name} size="sm" />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Link to={`/profile/${comment.user.username}`} className="text-sm font-semibold text-text-primary hover:text-accent transition-colors">{comment.user.name}</Link>
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
                aria-label="Write a comment"
                className="flex-1 px-4 py-2.5 text-sm bg-bg-primary border border-border rounded-2xl text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent focus:ring-0 transition-colors"
              />
              <button
                onClick={handleSubmitComment}
                disabled={!commentText.trim() || addCommentMutation.isPending}
                className={cn(
                  'p-2.5 rounded-2xl transition-all duration-200',
                  commentText.trim() && !addCommentMutation.isPending
                    ? 'text-accent bg-accent-light hover:bg-accent hover:text-white'
                    : 'text-text-tertiary bg-bg-tertiary'
                )}
                aria-label="Send comment"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
