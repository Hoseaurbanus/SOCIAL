import { useParams, useNavigate } from 'react-router'
import { ChevronLeft } from 'lucide-react'
import { PostCard } from '@/components/molecules/post-card'
import { SkeletonPost } from '@/components/atoms/skeleton'
import { Button } from '@/components/atoms/button'
import { usePostById, useToggleLike, useToggleBookmark, useDeletePost } from '@/hooks/use-posts'
import { useLikeStatus, useBookmarkStatus } from '@/hooks/use-posts'
import { useAuthStore } from '@/stores/auth-store'
import { useToast } from '@/hooks/use-toast'

export default function PostDetailPage() {
  const { postId } = useParams<{ postId: string }>()
  const navigate = useNavigate()
  const currentUser = useAuthStore((s) => s.user)
  const { data: post, isLoading, error } = usePostById(postId || '')
  const toggleLike = useToggleLike()
  const toggleBookmark = useToggleBookmark()
  const deletePost = useDeletePost()
  const toast = useToast((s) => s.toast)

  const { data: likedMap } = useLikeStatus(post ? [post.id] : [])
  const { data: bookmarkedMap } = useBookmarkStatus(post ? [post.id] : [])

  if (isLoading) {
    return (
      <div className="max-w-[600px] mx-auto">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-bg-tertiary text-text-secondary transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-bold text-text-primary">Post</h1>
        </div>
        <SkeletonPost />
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="max-w-[600px] mx-auto">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-bg-tertiary text-text-secondary transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-bold text-text-primary">Post</h1>
        </div>
        <div className="p-12 text-center">
          <p className="text-text-primary font-semibold mb-1">Post not found</p>
          <p className="text-text-tertiary text-sm mb-4">This post may have been deleted.</p>
          <Button variant="secondary" size="sm" onClick={() => navigate(-1)} className="rounded-2xl">
            Go back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[600px] mx-auto">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-bg-tertiary text-text-secondary transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold text-text-primary">Post</h1>
      </div>
      <PostCard
        postId={post.id}
        isOwnPost={post.user_id === currentUser?.id}
        author={post.user}
        content={post.content}
        images={post.images}
        videoUrl={post.video_url}
        linkPreview={post.link_preview}
        timestamp={post.created_at}
        likes={post.likes_count}
        comments={post.comments_count}
        liked={!!likedMap?.[post.id]}
        saved={!!bookmarkedMap?.[post.id]}
        onLike={() => toggleLike.mutate(post.id, {
          onError: () => toast({ title: 'Something went wrong', variant: 'error' }),
        })}
        onShare={() => {
          navigator.clipboard.writeText(window.location.href).then(
            () => toast({ title: 'Link copied!', variant: 'success' }),
            () => toast({ title: 'Failed to copy link', variant: 'error' }),
          )
        }}
        onSave={() => toggleBookmark.mutate(post.id, {
          onError: () => toast({ title: 'Something went wrong', variant: 'error' }),
        })}
        onDelete={() => {
          deletePost.mutate(post.id, {
            onSuccess: () => { toast({ title: 'Post deleted', variant: 'success' }); navigate(-1) },
            onError: () => toast({ title: 'Failed to delete post', variant: 'error' }),
          })
        }}
      />
    </div>
  )
}
