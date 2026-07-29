import { useState, useRef, useCallback, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router'
import { ChevronLeft, Settings, MapPin, LinkIcon, Calendar, X } from 'lucide-react'
import { Button } from '@/components/atoms/button'
import { Avatar } from '@/components/atoms/avatar'
import { PostCard } from '@/components/molecules/post-card'
import { useProfile, useProfileById, useFollowCounts, useToggleFollow, useFollowStatus, useFollowers, useFollowing } from '@/hooks/use-profile'
import { useUserPosts, useToggleLike, useToggleBookmark, useLikeStatus, useBookmarkStatus, useDeletePost, useLikedPosts, useBookmarkedPosts, useUserReplies } from '@/hooks/use-posts'
import { useAuthStore } from '@/stores/auth-store'
import { useToast } from '@/hooks/use-toast'

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>()
  const navigate = useNavigate()
  const currentUser = useAuthStore((s) => s.user)
  const authLoading = useAuthStore((s) => s.isLoading)
  const { data: profileByUsername, isLoading: profileByUsernameLoading } = useProfile(username || '')
  const { data: profileById, isLoading: profileByIdLoading } = useProfileById(
    !username && currentUser?.id ? currentUser.id : ''
  )
  const isOwnProfile = !username && !!currentUser
  const profile = profileByUsername || (isOwnProfile ? profileById : null)
  const profileLoading = username ? profileByUsernameLoading : (isOwnProfile ? profileByIdLoading : profileByUsernameLoading)
  const { data: followCounts } = useFollowCounts(profile?.id || '')
  const toggleFollow = useToggleFollow()
  const { data: isFollowing } = useFollowStatus(profile?.id ? [profile.id] : [])
  const following = profile ? (isFollowing?.[profile.id] || false) : false
  const { data: postsData, isLoading: postsLoading, error: postsError, fetchNextPage: fetchNextPosts, hasNextPage: hasNextPosts, isFetchingNextPage: isFetchingNextPosts } = useUserPosts(profile?.id || '')
  const toggleLike = useToggleLike()
  const toggleBookmark = useToggleBookmark()
  const deletePostMutation = useDeletePost()
  const [activeTab, setActiveTab] = useState('posts')
  const [showFollowers, setShowFollowers] = useState(false)
  const [showFollowing, setShowFollowing] = useState(false)
  const toast = useToast((s) => s.toast)

  const { data: followersList } = useFollowers(showFollowers ? profile?.id || '' : '')
  const { data: followingList } = useFollowing(showFollowing ? profile?.id || '' : '')

  const posts = postsData?.pages.flatMap((p) => p.posts) || []
  const totalPosts = postsData?.pages[0]?.total || 0
  const postIds = posts.map((p) => p.id)
  const { data: likedMap } = useLikeStatus(postIds)
  const { data: bookmarkedMap } = useBookmarkStatus(postIds)

  const { data: likedPostsData, isLoading: likedLoading, fetchNextPage: fetchNextLiked, hasNextPage: hasNextLiked, isFetchingNextPage: isFetchingNextLiked } = useLikedPosts(profile?.id || '')
  const { data: bookmarkedPostsData, isLoading: bookmarkedLoading, fetchNextPage: fetchNextBookmarked, hasNextPage: hasNextBookmarked, isFetchingNextPage: isFetchingNextBookmarked } = useBookmarkedPosts(profile?.id || '')
  const { data: repliesData, isLoading: repliesLoading, fetchNextPage: fetchNextReplies, hasNextPage: hasNextReplies, isFetchingNextPage: isFetchingNextReplies } = useUserReplies(profile?.id || '')

  const likedPosts = likedPostsData?.pages.flatMap((p) => p.posts) || []
  const bookmarkedPosts = bookmarkedPostsData?.pages.flatMap((p) => p.posts) || []
  const replies = repliesData?.pages.flatMap((p) => p.posts) || []

  const loadMoreRef = useRef<HTMLDivElement>(null)

  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries
    if (entry.isIntersecting) {
      if (activeTab === 'posts' && hasNextPosts && !isFetchingNextPosts) fetchNextPosts()
      if (activeTab === 'likes' && hasNextLiked && !isFetchingNextLiked) fetchNextLiked()
      if (activeTab === 'bookmarks' && hasNextBookmarked && !isFetchingNextBookmarked) fetchNextBookmarked()
      if (activeTab === 'replies' && hasNextReplies && !isFetchingNextReplies) fetchNextReplies()
    }
  }, [activeTab, hasNextPosts, isFetchingNextPosts, fetchNextPosts, hasNextLiked, isFetchingNextLiked, fetchNextLiked, hasNextBookmarked, isFetchingNextBookmarked, fetchNextBookmarked, hasNextReplies, isFetchingNextReplies, fetchNextReplies])

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, { rootMargin: '200px' })
    if (loadMoreRef.current) observer.observe(loadMoreRef.current)
    return () => observer.disconnect()
  }, [handleObserver])

  if (authLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-32 bg-bg-tertiary" />
        <div className="px-4 -mt-12">
          <div className="h-24 w-24 rounded-full bg-bg-tertiary border-4 border-bg-primary" />
          <div className="mt-3 space-y-2">
            <div className="h-5 w-32 bg-bg-tertiary rounded" />
            <div className="h-4 w-24 bg-bg-tertiary rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (profileLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-32 bg-bg-tertiary" />
        <div className="px-4 -mt-12">
          <div className="h-24 w-24 rounded-full bg-bg-tertiary border-4 border-bg-primary" />
          <div className="mt-3 space-y-2">
            <div className="h-5 w-32 bg-bg-tertiary rounded" />
            <div className="h-4 w-24 bg-bg-tertiary rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="p-8 text-center">
        <p className="text-text-secondary">User not found</p>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          {!isOwnProfile && (
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-bg-tertiary text-text-secondary transition-colors" aria-label="Go back">
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          <div>
            <h1 className="text-lg font-bold text-text-primary">{profile.name}</h1>
            <p className="text-sm text-text-tertiary">{totalPosts} posts</p>
          </div>
        </div>
        <Link to="/settings" className="p-2 rounded-full hover:bg-bg-tertiary text-text-secondary transition-colors" aria-label="Settings">
          <Settings className="h-5 w-5" />
        </Link>
      </div>

      {/* Banner */}
      <div className="h-32 bg-gradient-to-br from-accent to-accent-dark" />

      {/* Profile Info */}
      <div className="px-4 pb-4">
        <div className="flex items-end justify-between -mt-12 mb-3">
          <Avatar src={profile.avatar} alt={profile.name} size="2xl" className="border-4 border-bg-primary" />
          {isOwnProfile ? (
            <Button variant="secondary" size="sm" asChild>
              <Link to="/settings/account">Edit Profile</Link>
            </Button>
          ) : (
            <Button
              variant={following ? 'secondary' : 'primary'}
              size="sm"
              onClick={() => toggleFollow.mutate(profile.id, {
                onSuccess: () => toast({ title: following ? 'Unfollowed' : 'Followed', variant: 'success' }),
              })}
              loading={toggleFollow.isPending}
            >
              {following ? 'Following' : 'Follow'}
            </Button>
          )}
        </div>

        <h2 className="text-xl font-bold text-text-primary">{profile.name}</h2>
        <p className="text-text-secondary">@{profile.username}</p>

        {profile.bio && (
          <p className="mt-2 text-text-primary">{profile.bio}</p>
        )}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-sm text-text-tertiary">
          {profile.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {profile.location}
            </span>
          )}
          {profile.website && (
            <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-accent hover:text-accent-hover">
              <LinkIcon className="h-4 w-4" />
              {profile.website.replace(/^https?:\/\//, '')}
            </a>
          )}
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
          </span>
        </div>

        <div className="flex gap-4 mt-3">
          <button className="text-sm hover:underline" onClick={() => setShowFollowing(true)} aria-label={`${followCounts?.following || 0} following`}>
            <strong className="text-text-primary">{followCounts?.following || 0}</strong>{' '}
            <span className="text-text-tertiary">Following</span>
          </button>
          <button className="text-sm hover:underline" onClick={() => setShowFollowers(true)} aria-label={`${followCounts?.followers || 0} followers`}>
            <strong className="text-text-primary">{followCounts?.followers || 0}</strong>{' '}
            <span className="text-text-tertiary">Followers</span>
          </button>
        </div>
      </div>

      {/* Followers/Following Modal */}
      {(showFollowers || showFollowing) && (
        <div className="fixed inset-0 z-modal bg-overlay flex items-end sm:items-center justify-center" onClick={() => { setShowFollowers(false); setShowFollowing(false) }}>
          <div className="bg-bg-primary rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[70vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="font-semibold text-text-primary">{showFollowers ? 'Followers' : 'Following'}</h3>
              <button onClick={() => { setShowFollowers(false); setShowFollowing(false) }} className="p-1 rounded-full hover:bg-bg-tertiary">
                <X className="h-5 w-5 text-text-secondary" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[60vh] divide-y divide-border">
              {(showFollowers ? followersList : followingList)?.map((user) => (
                <Link
                  key={user.id}
                  to={`/profile/${user.username}`}
                  onClick={() => { setShowFollowers(false); setShowFollowing(false) }}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-bg-tertiary transition-colors"
                >
                  <Avatar src={user.avatar} alt={user.name} size="md" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{user.name}</p>
                    <p className="text-sm text-text-secondary truncate">@{user.username}</p>
                  </div>
                </Link>
              )) || (
                <p className="p-8 text-center text-text-secondary text-sm">No users to show</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex" role="tablist" aria-label="Profile content">
          {['posts', 'replies', 'likes', 'bookmarks'].map((tab) => (
            <button
              key={tab}
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-sm font-medium text-center capitalize border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-accent text-accent'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="divide-y divide-border">
        {activeTab === 'posts' && (
          postsLoading ? (
            [1, 2, 3].map((i) => (
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
            ))
          ) : postsError ? (
            <div className="p-8 text-center">
              <p className="text-text-secondary mb-2">Failed to load posts.</p>
              <Button variant="secondary" size="sm" onClick={() => window.location.reload()}>Try again</Button>
            </div>
          ) : posts.length === 0 ? (
            <div className="p-8 text-center"><p className="text-text-secondary">No posts yet</p></div>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post.id}
                postId={post.id}
                isOwnPost={!!isOwnProfile}
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
                onLike={() => toggleLike.mutate(post.id)}
                onSave={() => toggleBookmark.mutate(post.id)}
                onDelete={() => deletePostMutation.mutate(post.id)}
              />
            ))
          )
        )}

        {activeTab === 'replies' && (
          repliesLoading ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="p-4 animate-pulse space-y-3">
                <div className="flex gap-3">
                  <div className="h-10 w-10 rounded-full bg-bg-tertiary" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 bg-bg-tertiary rounded" />
                    <div className="h-3 w-48 bg-bg-tertiary rounded" />
                  </div>
                </div>
              </div>
            ))
          ) : replies && replies.length > 0 ? (
            replies.map((reply: any) => (
              <div key={reply.id} className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Avatar src={reply.commenter?.avatar} alt={reply.commenter?.name} size="sm" />
                  <div>
                    <span className="text-sm font-medium text-text-primary">{reply.commenter?.name}</span>
                    <span className="text-sm text-text-secondary ml-2">@{reply.commenter?.username}</span>
                  </div>
                  <span className="text-xs text-text-tertiary ml-auto">{new Date(reply.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-text-primary mb-2">{reply.content}</p>
                {reply.post && (
                  <div className="pl-4 border-l-2 border-border">
                    <p className="text-sm text-text-tertiary">Replying to {reply.post.user?.name}</p>
                    <p className="text-sm text-text-secondary line-clamp-2">{reply.post.content}</p>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="p-8 text-center"><p className="text-text-secondary">No replies yet</p></div>
          )
        )}

        {activeTab === 'likes' && (
          likedLoading ? (
            [1, 2, 3].map((i) => (
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
            ))
          ) : likedPosts && likedPosts.length > 0 ? (
            likedPosts.map((post) => (
              <PostCard
                key={post.id}
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
                liked={true}
                saved={!!bookmarkedMap?.[post.id]}
                onLike={() => toggleLike.mutate(post.id)}
                onSave={() => toggleBookmark.mutate(post.id)}
              />
            ))
          ) : (
            <div className="p-8 text-center"><p className="text-text-secondary">No likes yet</p></div>
          )
        )}

        {activeTab === 'bookmarks' && (
          bookmarkedLoading ? (
            [1, 2, 3].map((i) => (
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
            ))
          ) : bookmarkedPosts && bookmarkedPosts.length > 0 ? (
            bookmarkedPosts.map((post) => (
              <PostCard
                key={post.id}
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
                saved={true}
                onLike={() => toggleLike.mutate(post.id)}
                onSave={() => toggleBookmark.mutate(post.id)}
              />
            ))
          ) : (
            <div className="p-8 text-center"><p className="text-text-secondary">No bookmarks yet</p></div>
          )
        )}
      </div>
      <div ref={loadMoreRef} className="h-4" />
    </div>
  )
}
