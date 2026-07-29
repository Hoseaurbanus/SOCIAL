import { useState, useCallback, useRef, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { LayoutGrid, Users, Grid3X3, Clock, Zap, RefreshCw } from 'lucide-react'
import { PostCard } from '@/components/molecules/post-card'
import { Stories } from '@/components/molecules/stories'
import { Button } from '@/components/atoms/button'
import { SkeletonPost } from '@/components/atoms/skeleton'
import { ComposeModal } from '@/components/organisms/compose-modal'
import { StoryViewer } from '@/components/organisms/story-viewer'
import { StoryCreator } from '@/components/organisms/story-creator'
import { cn } from '@/lib/utils'
import { useFeedPosts, useForYouPosts, useFollowingPosts, useTrendingPosts, useCommunityPosts, useToggleLike, useToggleBookmark, useLikeStatus, useBookmarkStatus, useDeletePost } from '@/hooks/use-posts'
import { useStories, useCreateStory, useReplyToStory } from '@/hooks/use-stories'
import { useAuthStore } from '@/stores/auth-store'
import { useToast } from '@/hooks/use-toast'
import { useScrollDirection } from '@/hooks/use-scroll-direction'
import type { StoryDraft } from '@/components/organisms/story-creator'

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
  const [showStoryCreator, setShowStoryCreator] = useState(false)
  const [viewingStoryIndex, setViewingStoryIndex] = useState<number | null>(null)
  const user = useAuthStore((s) => s.user)
  const { direction, scrollY } = useScrollDirection(5)
  const feedQuery = useFeedPosts()
  const forYouQuery = useForYouPosts()
  const followingQuery = useFollowingPosts()
  const trendingQuery = useTrendingPosts()
  const communityQuery = useCommunityPosts()
  const { data: stories = [], refetch: refetchStories } = useStories()
  const createStory = useCreateStory()
  const replyToStory = useReplyToStory()

  const activeQuery = activeTab === 'for-you' ? forYouQuery : activeTab === 'following' ? followingQuery : activeTab === 'trending' ? trendingQuery : activeTab === 'communities' ? communityQuery : feedQuery
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

  const handleShare = useCallback((_postId: string) => {
    const url = `${window.location.origin}/home`
    if (navigator.share) {
      navigator.share({ url, title: 'Check out this post on SMUGFLEX' }).catch(() => {})
    } else {
      navigator.clipboard.writeText(url).then(
        () => toast({ title: 'Link copied!', variant: 'success' }),
        () => toast({ title: 'Failed to copy link', variant: 'error' }),
      )
    }
  }, [toast])

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
      await Promise.all([refetch(), refetchStories()])
      setIsRefreshing(false)
    }
    setPullDistance(0)
    startY.current = 0
  }, [pullDistance, refetch, refetchStories])

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
          style={{ height: isRefreshing ? '3rem' : pullDistance }}
        >
          <RefreshCw
            className={`h-5 w-5 text-accent ${isRefreshing ? 'animate-spin' : ''}`}
            style={{ transform: isRefreshing ? undefined : `rotate(${pullDistance * 3}deg)` }}
          />
        </div>
      )}

      {/* Feed Tabs */}
      <div
        className={cn(
          'sticky border-b border-border bg-bg-primary transition-all duration-300 z-20',
          direction === 'down' && scrollY > 100 ? 'top-0' : 'top-16'
        )}
      >
        <div className="flex gap-1 overflow-x-auto scrollbar-none px-2 py-1" role="tablist" aria-label="Feed filters">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-all duration-200 rounded-xl',
                activeTab === tab.id
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-bg-primary to-transparent pointer-events-none md:hidden" />
      </div>

      {/* Stories — Vertical Story Deck */}
      <Stories
        stories={stories}
        onStoryClick={(id) => {
          const idx = stories.findIndex((s) => s.id === id)
          if (idx >= 0) setViewingStoryIndex(idx)
        }}
        userAvatar={user?.avatar}
        currentUserId={user?.id}
        onAddStory={() => setShowStoryCreator(true)}
      />

      {/* Divider */}
      <div className="h-2 bg-bg-secondary" />

      {/* Create Post */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 shadow-sm">
            {user?.name?.charAt(0) || 'S'}
          </div>
          <button
            onClick={() => setShowCompose(true)}
            className="flex-1 h-12 rounded-2xl border-2 border-border bg-bg-secondary flex items-center px-4 text-text-tertiary text-sm cursor-pointer hover:border-accent/30 hover:bg-accent-light/30 transition-all text-left"
          >
            What's on your mind?
          </button>
        </div>
      </div>

      {/* Feed */}
      {activeTab === 'communities' ? (
        communityQuery.isLoading ? (
          <div className="divide-y divide-border">
            {[1, 2, 3].map((i) => (
              <SkeletonPost key={i} />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="p-12 text-center">
            <div className="h-16 w-16 rounded-3xl bg-accent-light flex items-center justify-center mx-auto mb-4">
              <Grid3X3 className="h-8 w-8 text-accent" />
            </div>
            <p className="text-text-primary font-semibold mb-1">No community posts yet</p>
            <p className="text-text-tertiary text-sm">Join communities to see posts from them here.</p>
          </div>
        ) : (
          <div className="divide-y divide-border" aria-live="polite">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                postId={post.id}
                isOwnPost={post.user_id === user?.id}
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
                onLike={() => handleLike(post.id)}
                onComment={() => {}}
                onShare={() => handleShare(post.id)}
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
        )
      ) : isLoading ? (
        <div className="divide-y divide-border">
          {[1, 2, 3].map((i) => (
            <SkeletonPost key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="p-12 text-center">
          <div className="h-16 w-16 rounded-3xl bg-error-light flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">!</span>
          </div>
          <p className="text-text-primary font-semibold mb-1">Something went wrong</p>
          <p className="text-text-tertiary text-sm mb-4">Failed to load posts. Please try again.</p>
          <Button variant="secondary" size="sm" onClick={() => window.location.reload()} className="rounded-2xl">
            Try again
          </Button>
        </div>
      ) : posts.length === 0 ? (
        <div className="p-12 text-center">
          <div className="h-16 w-16 rounded-3xl bg-accent-light flex items-center justify-center mx-auto mb-4">
            <LayoutGrid className="h-8 w-8 text-accent" />
          </div>
          <p className="text-text-primary font-semibold mb-1">Your feed is empty</p>
          <p className="text-text-tertiary text-sm">Follow people or join communities to see posts here.</p>
        </div>
      ) : (
        <div className="divide-y divide-border" aria-live="polite">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              postId={post.id}
              isOwnPost={post.user_id === user?.id}
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
              onLike={() => handleLike(post.id)}
              onComment={() => {}}
              onShare={() => handleShare(post.id)}
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

      <AnimatePresence>
        {showStoryCreator && (
          <StoryCreator
            isOpen={showStoryCreator}
            onClose={() => setShowStoryCreator(false)}
            onPost={async (draft: StoryDraft) => {
              await createStory.mutateAsync(draft)
              toast({ title: 'Story posted!', variant: 'success' })
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingStoryIndex !== null && (
          <StoryViewer
            stories={stories}
            initialIndex={viewingStoryIndex}
            onClose={() => setViewingStoryIndex(null)}
            onReply={async (storyId, message) => {
              try {
                await replyToStory.mutateAsync({ storyId, message })
                toast({ title: 'Reply sent!', variant: 'success' })
              } catch {
                toast({ title: 'Failed to send reply', variant: 'error' })
              }
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
