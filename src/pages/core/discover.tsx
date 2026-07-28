import { useState } from 'react'
import { TrendingUp, Users, Grid3X3, Compass } from 'lucide-react'
import { Button } from '@/components/atoms/button'
import { PostCard } from '@/components/molecules/post-card'
import { Avatar } from '@/components/atoms/avatar'
import { useTrendingPosts, useSuggestedUsers, useTrendingTopics } from '@/hooks/use-discover'
import { useToggleLike, useToggleBookmark, useLikeStatus, useBookmarkStatus } from '@/hooks/use-posts'
import { useToggleFollow, useFollowStatus } from '@/hooks/use-profile'
import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

const tabs = [
  { id: 'discover', label: 'Discover', icon: Compass },
  { id: 'trending', label: 'Trending', icon: TrendingUp },
  { id: 'people', label: 'People', icon: Users },
  { id: 'communities', label: 'Communities', icon: Grid3X3 },
]

export default function DiscoverPage() {
  const [activeTab, setActiveTab] = useState('discover')
  const { toast } = useToast()
  const currentUser = useAuthStore((s) => s.user)

  return (
    <div className="max-w-[600px] mx-auto">
      <div className="flex gap-1 overflow-x-auto border-b border-border px-4 scrollbar-none">
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

      <div className="p-4">
        {activeTab === 'discover' && <DiscoverTab />}
        {activeTab === 'trending' && <TrendingTab />}
        {activeTab === 'people' && <PeopleTab />}
        {activeTab === 'communities' && (
          <div className="text-center py-12">
            <p className="text-text-secondary">Communities coming soon</p>
          </div>
        )}
      </div>
    </div>
  )
}

function DiscoverTab() {
  const { data: postsData, isLoading, error } = useTrendingPosts()
  const toggleLike = useToggleLike()
  const toggleBookmark = useToggleBookmark()
  const { toast } = useToast()
  const currentUser = useAuthStore((s) => s.user)
  const posts = postsData?.pages.flatMap((p) => p.posts) || []
  const postIds = posts.map((p) => p.id)
  const { data: likedMap } = useLikeStatus(postIds)
  const { data: bookmarkedMap } = useBookmarkStatus(postIds)

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 animate-pulse space-y-3">
            <div className="flex gap-3">
              <div className="h-10 w-10 rounded-full bg-bg-tertiary" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-bg-tertiary rounded" />
                <div className="h-3 w-48 bg-bg-tertiary rounded" />
              </div>
            </div>
            <div className="h-16 bg-bg-tertiary rounded" />
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-text-secondary mb-2">Failed to load trending posts.</p>
        <Button variant="secondary" size="sm" onClick={() => window.location.reload()}>Try again</Button>
      </div>
    )
  }

  return (
    <div className="divide-y divide-border">
      {posts.length === 0 ? (
        <p className="text-center text-text-secondary py-8">No posts yet</p>
      ) : (
        posts.map((post) => (
          <PostCard
            key={post.id}
            postId={post.id}
            isOwnPost={post.user_id === currentUser?.id}
            author={post.user}
            content={post.content}
            images={post.images}
            timestamp={post.created_at}
            likes={post.likes_count}
            comments={post.comments_count}
            liked={!!likedMap?.[post.id]}
            saved={!!bookmarkedMap?.[post.id]}
            onLike={() => toggleLike.mutate(post.id)}
            onSave={() => toggleBookmark.mutate(post.id)}
          />
        ))
      )}
    </div>
  )
}

function TrendingTab() {
  const { data: topics, isLoading: topicsLoading } = useTrendingTopics()
  const { data: postsData, isLoading: postsLoading } = useTrendingPosts()
  const toggleLike = useToggleLike()
  const toggleBookmark = useToggleBookmark()
  const currentUser = useAuthStore((s) => s.user)
  const posts = postsData?.pages.flatMap((p) => p.posts) || []
  const postIds = posts.map((p) => p.id)
  const { data: likedMap } = useLikeStatus(postIds)
  const { data: bookmarkedMap } = useBookmarkStatus(postIds)

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold text-text-primary mb-3">Trending Topics</h3>
        {topicsLoading ? (
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => <div key={i} className="h-8 w-20 bg-bg-tertiary rounded-full animate-pulse" />)}
          </div>
        ) : topics && topics.length > 0 ? (
          <div className="flex gap-2 overflow-x-auto scrollbar-none pb-2">
            {topics.map((t) => (
              <button key={t.tag} className="px-3 py-1.5 text-sm text-text-secondary border border-border rounded-full whitespace-nowrap hover:bg-bg-tertiary transition-colors">
                {t.tag} <span className="text-text-tertiary ml-1">({t.count})</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-tertiary">No trending topics yet</p>
        )}
      </div>

      <div>
        <h3 className="text-base font-semibold text-text-primary mb-3">Top Posts</h3>
        {postsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 animate-pulse space-y-3">
                <div className="flex gap-3">
                  <div className="h-10 w-10 rounded-full bg-bg-tertiary" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 bg-bg-tertiary rounded" />
                    <div className="h-3 w-48 bg-bg-tertiary rounded" />
                  </div>
                </div>
                <div className="h-16 bg-bg-tertiary rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                postId={post.id}
                isOwnPost={post.user_id === currentUser?.id}
                author={post.user}
                content={post.content}
                images={post.images}
                timestamp={post.created_at}
                likes={post.likes_count}
                comments={post.comments_count}
                liked={!!likedMap?.[post.id]}
                saved={!!bookmarkedMap?.[post.id]}
                onLike={() => toggleLike.mutate(post.id)}
                onSave={() => toggleBookmark.mutate(post.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function PeopleTab() {
  const { data: users, isLoading } = useSuggestedUsers()
  const toggleFollow = useToggleFollow()
  const { data: followingMap } = useFollowStatus(users?.map((u) => u.id) || [])
  const { toast } = useToast()

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 p-4 animate-pulse">
            <div className="h-12 w-12 rounded-full bg-bg-tertiary" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 bg-bg-tertiary rounded" />
              <div className="h-3 w-48 bg-bg-tertiary rounded" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {users && users.length > 0 ? (
        users.map((u) => {
          const isFollowing = followingMap?.[u.id] || false
          return (
            <div key={u.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-bg-tertiary transition-colors">
              <Avatar src={u.avatar} alt={u.name} size="md" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">{u.name}</p>
                <p className="text-sm text-text-secondary truncate">@{u.username}</p>
                {u.bio && <p className="text-xs text-text-tertiary truncate mt-0.5">{u.bio}</p>}
              </div>
              <Button
                variant={isFollowing ? 'secondary' : 'primary'}
                size="sm"
                onClick={() => toggleFollow.mutate(u.id)}
                loading={toggleFollow.isPending}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </Button>
            </div>
          )
        })
      ) : (
        <p className="text-center text-text-secondary py-8">No suggestions yet</p>
      )}
    </div>
  )
}
