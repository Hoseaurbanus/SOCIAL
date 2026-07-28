import { useState, useCallback, useRef, useEffect } from 'react'
import { LayoutGrid, Users, Grid3X3, Clock, Zap, RefreshCw } from 'lucide-react'
import { PostCard } from '@/components/molecules/post-card'
import { Stories } from '@/components/molecules/stories'
import { Button } from '@/components/atoms/button'
import { SkeletonPost } from '@/components/atoms/skeleton'
import { ComposeModal } from '@/components/organisms/compose-modal'
import { cn } from '@/lib/utils'
import { useFeedPosts, useFollowingPosts, useToggleLike, useToggleBookmark, useLikeStatus, useBookmarkStatus, useDeletePost } from '@/hooks/use-posts'
import { useStories, useCreateStory } from '@/hooks/use-stories'
import { useAuthStore } from '@/stores/auth-store'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/config/supabase'

const tabs = [
  { id: 'for-you', label: 'For You', icon: LayoutGrid },
  { id: 'following', label: 'Following', icon: Users },
  { id: 'communities', label: 'Communities', icon: Grid3X3 },
  { id: 'chronological', label: 'Chronological', icon: Clock },
  { id: 'trending', label: 'Trending', icon: Zap },
]

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('for-you')
  const [showCompose, setShowCompose] = useState(false)
  const [showStoryViewer, setShowStoryViewer] = useState<string | null>(null)
  const user = useAuthStore((s) => s.user)
  const feedQuery = useFeedPosts()
  const followingQuery = useFollowingPosts()
  const { data: stories = [] } = useStories()
  const createStory = useCreateStory()

  const activeQuery = activeTab === 'following' ? followingQuery : feedQuery
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error } = activeQuery
  const toggleLike = useToggleLike()
  const toggleBookmark = useToggleBookmark()
  const deletePostMutation = useDeletePost()
  const toast = useToast((s) => s.toast)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const startY = useRef(0)
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const posts = data?.pages.flatMap((p) => p.posts) || []
  const postIds = posts.map((p) => p.id)
  const { data: likedMap } = useLikeStatus(postIds)
  const { data: bookmarkedMap } = useBookmarkStatus(postIds)

  const handleLike = useCallback((postId: string) => {
    toggleLike.mutate(postId, {
      onError: () => toast({ title: 'Something went wrong', variant: 'error' }),
    })
  }, [toggleLike, toast])

  const handleBookmark = useCallback((postId: string) => {
    toggleBookmark.mutate(postId, {
      onError: () => toast({ title: 'Something went wrong', variant: 'error' }),
    })
  }, [toggleBookmark, toast])

  const refetch = activeQuery.refetch

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (containerRef.current && containerRef.current.scrollTop === 0) {
      startY.current = e.touches[0].clientY
    }
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (startY.current === 0) return
    const diff = e.touches[0].clientY - startY.current
    if (diff > 0) setPullDistance(Math.min(diff * 0.5, 80))
  }, [])

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance > 50) {
      setIsRefreshing(true)
      await refetch()
      setIsRefreshing(false)
    }
    setPullDistance(0)
    startY.current = 0
  }, [pullDistance, refetch])

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage()
        }
      },
      { threshold: 0.1 }
    )

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current)
    }

    return () => observerRef.current?.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull to refresh indicator */}
      {(pullDistance > 0 || isRefreshing) && (
        <div
          className="flex items-center justify-center overflow-hidden transition-all"
          style={{ height: isRefreshing ? 48 : pullDistance }}
        >
          <RefreshCw
            className={`h-5 w-5 text-accent ${isRefreshing ? 'animate-spin' : ''}`}
            style={{ transform: isRefreshing ? undefined : `rotate(${pullDistance * 3}deg)` }}
          />
        </div>
      )}
      {/* Feed Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-border scrollbar-none sticky top-16 bg-bg-primary z-10">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2',
              activeTab === tab.id
                ? 'border-accent text-accent'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Stories */}
      <Stories
        stories={stories.map((s) => ({ id: s.id, username: s.user.username, avatar: s.user.avatar, seen: false }))}
        onStoryClick={(id) => setShowStoryViewer(id)}
        onAddStory={async () => {
          const input = document.createElement('input')
          input.type = 'file'
          input.accept = 'image/*'
          input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0]
            if (!file) return
            try {
              const fileExt = file.name.split('.').pop()
              const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
              const filePath = `stories/${fileName}`
              const { error } = await supabase.storage.from('stories').upload(filePath, file)
              if (error) throw error
              const { data: urlData } = supabase.storage.from('stories').getPublicUrl(filePath)
              await createStory.mutateAsync({ mediaUrl: urlData.publicUrl, mediaType: 'image' })
              toast({ title: 'Story added!', variant: 'success' })
            } catch (err: any) {
              toast({ title: err.message || 'Failed to add story', variant: 'error' })
            }
          }
          input.click()
        }}
      />

      {/* Create Post */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center text-text-inverse font-semibold text-sm flex-shrink-0">
            {user?.name?.charAt(0) || 'S'}
          </div>
          <button
            onClick={() => setShowCompose(true)}
            className="flex-1 h-10 rounded-full border border-border bg-bg-secondary flex items-center px-4 text-text-tertiary text-sm cursor-pointer hover:bg-bg-tertiary transition-colors text-left"
          >
            What's on your mind?
          </button>
        </div>
      </div>

      {/* Feed */}
      {activeTab === 'communities' ? (
        <div className="p-8 text-center">
          <p className="text-text-secondary mb-2">No communities yet</p>
          <p className="text-text-tertiary text-sm">Communities are coming soon.</p>
        </div>
      ) : isLoading ? (
        <div className="divide-y divide-border">
          {[1, 2, 3].map((i) => (
            <SkeletonPost key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="p-8 text-center">
          <p className="text-text-secondary">Something went wrong loading posts.</p>
          <Button variant="secondary" size="sm" className="mt-3" onClick={() => window.location.reload()}>
            Try again
          </Button>
        </div>
      ) : posts.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-text-secondary mb-2">No posts yet</p>
          <p className="text-text-tertiary text-sm">Follow people or join communities to see posts here.</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              postId={post.id}
              isOwnPost={post.user_id === user?.id}
              author={post.user}
              content={post.content}
              images={post.images}
              timestamp={post.created_at}
              likes={post.likes_count}
              comments={post.comments_count}
              liked={!!likedMap?.[post.id]}
              saved={!!bookmarkedMap?.[post.id]}
              onLike={() => handleLike(post.id)}
              onComment={() => {}}
              onShare={() => {}}
              onSave={() => handleBookmark(post.id)}
              onDelete={() => deletePostMutation.mutate(post.id)}
            />
          ))}
          <div ref={loadMoreRef} className="py-4">
            {isFetchingNextPage && (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent" />
              </div>
            )}
          </div>
        </div>
      )}

      <ComposeModal isOpen={showCompose} onClose={() => setShowCompose(false)} />
    </div>
  )
}
