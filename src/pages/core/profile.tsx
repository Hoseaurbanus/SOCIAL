import { useState, useRef, useCallback, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router'
import { ChevronLeft, Settings, MapPin, LinkIcon, Calendar, X, MessageCircle, UserPlus, UserCheck, MoreHorizontal, Shield, Crown, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/atoms/button'
import { Avatar } from '@/components/atoms/avatar'
import { PostCard } from '@/components/molecules/post-card'
import { ContentCard } from '@/components/molecules/content-card'
import { useProfile, useProfileById, useFollowCounts, useToggleFollow, useFollowStatus, useFollowers, useFollowing } from '@/hooks/use-profile'
import { useUserPosts, useToggleLike, useToggleBookmark, useLikeStatus, useBookmarkStatus, useDeletePost, useLikedPosts, useBookmarkedPosts, useUserReplies } from '@/hooks/use-posts'
import { useContentItems, useToggleReaction } from '@/hooks/use-content'
import { useAuthStore } from '@/stores/auth-store'
import { useToast } from '@/hooks/use-toast'
import { useCreateConversation } from '@/hooks/use-messages'
import { cn } from '@/lib/utils'

const tabs = [
  { id: 'posts', label: 'Posts' },
  { id: 'content', label: 'Content' },
  { id: 'replies', label: 'Replies' },
  { id: 'likes', label: 'Likes' },
  { id: 'bookmarks', label: 'Saved' },
] as const

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>()
  const navigate = useNavigate()
  const currentUser = useAuthStore((s) => s.user)
  const authLoading = useAuthStore((s) => s.isLoading)
  const { data: profileByUsername, isLoading: profileByUsernameLoading } = useProfile(username || '')
  const { data: profileById, isLoading: profileByIdLoading } = useProfileById(
    !username && currentUser?.id ? currentUser.id : ''
  )

  const isOwnProfile = username
    ? currentUser?.username === username
    : !!currentUser

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
  const [activeTab, setActiveTab] = useState<string>('posts')
  const [showFollowers, setShowFollowers] = useState(false)
  const [showFollowing, setShowFollowing] = useState(false)
  const toast = useToast((s) => s.toast)
  const createConversation = useCreateConversation()

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
  const { data: contentData, isLoading: contentLoading } = useContentItems({ authorId: profile?.id || '' })
  const toggleReaction = useToggleReaction()

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

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <div className="h-40 bg-gradient-to-br from-accent/20 via-accent/10 to-bg-tertiary animate-pulse" />
        <div className="px-4 -mt-16 relative z-10">
          <div className="h-28 w-28 rounded-full bg-bg-tertiary border-4 border-bg-primary animate-pulse" />
          <div className="mt-3 space-y-2">
            <div className="h-6 w-40 bg-bg-tertiary rounded-lg animate-pulse" />
            <div className="h-4 w-28 bg-bg-tertiary rounded animate-pulse" />
            <div className="h-4 w-64 bg-bg-tertiary rounded animate-pulse mt-2" />
          </div>
          <div className="flex gap-6 mt-4">
            <div className="h-4 w-20 bg-bg-tertiary rounded animate-pulse" />
            <div className="h-4 w-20 bg-bg-tertiary rounded animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center p-8">
        <div className="w-20 h-20 rounded-full bg-bg-tertiary flex items-center justify-center mb-4">
          <span className="text-4xl">👤</span>
        </div>
        <h2 className="text-xl font-bold text-text-primary mb-2">User not found</h2>
        <p className="text-text-secondary text-center mb-6">This account doesn't exist or has been removed.</p>
        <Button variant="primary" onClick={() => navigate('/home')}>Go Home</Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-bg-primary/95 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-bg-tertiary text-text-secondary transition-colors" aria-label="Go back">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-text-primary leading-tight">{profile.name}</h1>
              <p className="text-xs text-text-tertiary">{totalPosts} posts</p>
            </div>
          </div>
          {isOwnProfile && (
            <Link to="/settings" className="p-2 rounded-full hover:bg-bg-tertiary text-text-secondary transition-colors" aria-label="Settings">
              <Settings className="h-5 w-5" />
            </Link>
          )}
        </div>
      </div>

      {/* Banner */}
      <div className="relative h-40 bg-gradient-to-br from-accent via-accent-dark to-accent overflow-hidden">
        {profile.cover_image ? (
          <img src={profile.cover_image} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-4 left-8 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute bottom-4 right-8 w-40 h-40 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-white/5 blur-3xl" />
          </div>
        )}
      </div>

      {/* Profile Info */}
      <div className="px-4 pb-4 relative">
        {/* Avatar + Actions Row */}
        <div className="flex items-end justify-between -mt-14 mb-3">
          <div className="relative">
            <Avatar src={profile.avatar} alt={profile.name} size="2xl" className="border-4 border-bg-primary shadow-xl" />
            {isOwnProfile && (
              <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-accent flex items-center justify-center border-2 border-bg-primary">
                <Sparkles className="h-3 w-3 text-white" />
              </div>
            )}
          </div>

          <div className="flex gap-2 pb-2">
            {isOwnProfile ? (
              <Button variant="secondary" size="sm" asChild>
                <Link to="/settings/account">Edit Profile</Link>
              </Button>
            ) : (
              <>
                <Button
                  variant={following ? 'secondary' : 'primary'}
                  size="sm"
                  onClick={() => toggleFollow.mutate(profile.id, {
                    onSuccess: () => toast({ title: following ? 'Unfollowed' : 'Followed', variant: 'success' }),
                  })}
                  loading={toggleFollow.isPending}
                >
                  {following ? (
                    <>
                      <UserCheck className="h-4 w-4 mr-1" />
                      Following
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-1" />
                      Follow
                    </>
                  )}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={async () => {
                    try {
                      const convId = await createConversation.mutateAsync(profile.id)
                      navigate(`/messages/${convId}`)
                    } catch {
                      toast({ title: 'Failed to start conversation', variant: 'error' })
                    }
                  }}
                  loading={createConversation.isPending}
                >
                  <MessageCircle className="h-4 w-4 mr-1" />
                  Message
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Name & Username */}
        <div className="mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-text-primary">{profile.name}</h2>
            {isOwnProfile && (
              <span className="px-2 py-0.5 rounded-full bg-accent/10 text-accent text-xs font-medium">You</span>
            )}
          </div>
          <p className="text-text-secondary text-sm">@{profile.username}</p>
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="text-text-primary text-sm leading-relaxed mb-3 whitespace-pre-wrap">{profile.bio}</p>
        )}

        {/* Meta Info */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mb-3">
          {profile.location && (
            <span className="flex items-center gap-1.5 text-sm text-text-tertiary">
              <MapPin className="h-4 w-4" />
              {profile.location}
            </span>
          )}
          {profile.website && (
            <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-accent hover:text-accent-hover transition-colors">
              <LinkIcon className="h-4 w-4" />
              {profile.website.replace(/^https?:\/\//, '')}
            </a>
          )}
          <span className="flex items-center gap-1.5 text-sm text-text-tertiary">
            <Calendar className="h-4 w-4" />
            Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
          </span>
        </div>

        {/* Follow Counts */}
        <div className="flex gap-5">
          <button
            className="text-sm group"
            onClick={() => setShowFollowing(true)}
          >
            <strong className="text-text-primary group-hover:text-accent transition-colors">{followCounts?.following || 0}</strong>{' '}
            <span className="text-text-tertiary">Following</span>
          </button>
          <button
            className="text-sm group"
            onClick={() => setShowFollowers(true)}
          >
            <strong className="text-text-primary group-hover:text-accent transition-colors">{followCounts?.followers || 0}</strong>{' '}
            <span className="text-text-tertiary">Followers</span>
          </button>
        </div>
      </div>

      {/* Followers/Following Modal */}
      <AnimatePresence>
        {(showFollowers || showFollowing) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-modal bg-overlay flex items-end sm:items-center justify-center"
            onClick={() => { setShowFollowers(false); setShowFollowing(false) }}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-bg-primary rounded-t-3xl sm:rounded-2xl w-full max-w-md max-h-[70vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <h3 className="text-lg font-bold text-text-primary">{showFollowers ? 'Followers' : 'Following'}</h3>
                <button onClick={() => { setShowFollowers(false); setShowFollowing(false) }} className="p-2 rounded-full hover:bg-bg-tertiary transition-colors">
                  <X className="h-5 w-5 text-text-secondary" />
                </button>
              </div>
              <div className="overflow-y-auto max-h-[60vh] divide-y divide-border">
                {(showFollowers ? followersList : followingList)?.map((user) => (
                  <Link
                    key={user.id}
                    to={`/profile/${user.username}`}
                    onClick={() => { setShowFollowers(false); setShowFollowing(false) }}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-bg-tertiary transition-colors"
                  >
                    <Avatar src={user.avatar} alt={user.name} size="md" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-text-primary truncate">{user.name}</p>
                      <p className="text-sm text-text-secondary truncate">@{user.username}</p>
                    </div>
                  </Link>
                )) || (
                  <div className="p-10 text-center">
                    <p className="text-text-secondary text-sm">No users to show</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="sticky top-[60px] z-20 bg-bg-primary border-b border-border">
        <div className="flex" role="tablist" aria-label="Profile content">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex-1 py-3.5 text-sm font-semibold text-center transition-all duration-200 relative',
                activeTab === tab.id
                  ? 'text-accent'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/50'
              )}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="profile-tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-[3px] bg-accent rounded-t-full"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            {/* Posts Tab */}
            {activeTab === 'posts' && (
              <div className="divide-y divide-border">
                {postsLoading ? (
                  [1, 2, 3].map((i) => (
                    <div key={i} className="p-4 animate-pulse space-y-3">
                      <div className="flex gap-3">
                        <div className="h-10 w-10 rounded-full bg-bg-tertiary" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-32 bg-bg-tertiary rounded" />
                          <div className="h-3 w-48 bg-bg-tertiary rounded" />
                        </div>
                      </div>
                      <div className="h-16 bg-bg-tertiary rounded-xl" />
                    </div>
                  ))
                ) : postsError ? (
                  <div className="p-10 text-center">
                    <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl">⚠️</span>
                    </div>
                    <p className="text-text-primary font-medium mb-1">Failed to load posts</p>
                    <p className="text-text-secondary text-sm mb-4">Something went wrong. Please try again.</p>
                    <Button variant="secondary" size="sm" onClick={() => window.location.reload()}>Try again</Button>
                  </div>
                ) : posts.length === 0 ? (
                  <div className="p-10 text-center">
                    <div className="w-16 h-16 rounded-full bg-bg-tertiary flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl">📝</span>
                    </div>
                    <p className="text-text-primary font-medium mb-1">No posts yet</p>
                    <p className="text-text-secondary text-sm">
                      {isOwnProfile ? 'Share your first post with the world!' : 'This user hasn\'t posted anything yet.'}
                    </p>
                  </div>
                ) : (
                  posts.map((post) => (
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
                      saved={!!bookmarkedMap?.[post.id]}
                      onLike={() => toggleLike.mutate(post.id)}
                      onSave={() => toggleBookmark.mutate(post.id)}
                      onDelete={() => deletePostMutation.mutate(post.id)}
                    />
                  ))
                )}
              </div>
            )}

            {/* Content Tab */}
            {activeTab === 'content' && (
              <div className="divide-y divide-border">
                {contentLoading ? (
                  [1, 2, 3].map((i) => (
                    <div key={i} className="p-4 animate-pulse space-y-3">
                      <div className="flex gap-3">
                        <div className="h-10 w-10 rounded-full bg-bg-tertiary" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-32 bg-bg-tertiary rounded" />
                          <div className="h-3 w-48 bg-bg-tertiary rounded" />
                        </div>
                      </div>
                      <div className="h-16 bg-bg-tertiary rounded-xl" />
                    </div>
                  ))
                ) : contentData?.items.length === 0 ? (
                  <div className="p-10 text-center">
                    <div className="w-16 h-16 rounded-full bg-bg-tertiary flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl">📦</span>
                    </div>
                    <p className="text-text-primary font-medium mb-1">No content yet</p>
                    <p className="text-text-secondary text-sm">
                      {isOwnProfile ? 'Create content in your spaces to see it here.' : 'This user hasn\'t created any content yet.'}
                    </p>
                  </div>
                ) : (
                  contentData?.items.map((item) => (
                    <div key={item.id} className="p-4">
                      <ContentCard
                        item={item}
                        onLike={() => toggleReaction.mutate({ contentItemId: item.id })}
                      />
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Replies Tab */}
            {activeTab === 'replies' && (
              <div className="divide-y divide-border">
                {repliesLoading ? (
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
                    <div key={reply.id} className="p-4 hover:bg-bg-secondary/50 transition-colors">
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar src={reply.commenter?.avatar} alt={reply.commenter?.name} size="sm" />
                        <div>
                          <span className="text-sm font-semibold text-text-primary">{reply.commenter?.name}</span>
                          <span className="text-sm text-text-secondary ml-1.5">@{reply.commenter?.username}</span>
                        </div>
                        <span className="text-xs text-text-tertiary ml-auto">{new Date(reply.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-text-primary mb-2 leading-relaxed">{reply.content}</p>
                      {reply.post && (
                        <div className="pl-4 border-l-2 border-accent/30 bg-bg-secondary/30 rounded-r-lg py-2 pr-3">
                          <p className="text-xs text-text-tertiary mb-0.5">Replying to {reply.post.user?.name}</p>
                          <p className="text-sm text-text-secondary line-clamp-2">{reply.post.content}</p>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-10 text-center">
                    <div className="w-16 h-16 rounded-full bg-bg-tertiary flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl">💬</span>
                    </div>
                    <p className="text-text-primary font-medium mb-1">No replies yet</p>
                    <p className="text-text-secondary text-sm">
                      {isOwnProfile ? 'Your replies to other posts will appear here.' : 'This user hasn\'t replied to any posts yet.'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Likes Tab */}
            {activeTab === 'likes' && (
              <div className="divide-y divide-border">
                {likedLoading ? (
                  [1, 2, 3].map((i) => (
                    <div key={i} className="p-4 animate-pulse space-y-3">
                      <div className="flex gap-3">
                        <div className="h-10 w-10 rounded-full bg-bg-tertiary" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-32 bg-bg-tertiary rounded" />
                          <div className="h-3 w-48 bg-bg-tertiary rounded" />
                        </div>
                      </div>
                      <div className="h-16 bg-bg-tertiary rounded-xl" />
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
                  <div className="p-10 text-center">
                    <div className="w-16 h-16 rounded-full bg-bg-tertiary flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl">❤️</span>
                    </div>
                    <p className="text-text-primary font-medium mb-1">No likes yet</p>
                    <p className="text-text-secondary text-sm">
                      {isOwnProfile ? 'Posts you like will appear here.' : 'This user hasn\'t liked any posts yet.'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Bookmarks Tab */}
            {activeTab === 'bookmarks' && (
              <div className="divide-y divide-border">
                {bookmarkedLoading ? (
                  [1, 2, 3].map((i) => (
                    <div key={i} className="p-4 animate-pulse space-y-3">
                      <div className="flex gap-3">
                        <div className="h-10 w-10 rounded-full bg-bg-tertiary" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-32 bg-bg-tertiary rounded" />
                          <div className="h-3 w-48 bg-bg-tertiary rounded" />
                        </div>
                      </div>
                      <div className="h-16 bg-bg-tertiary rounded-xl" />
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
                  <div className="p-10 text-center">
                    <div className="w-16 h-16 rounded-full bg-bg-tertiary flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl">🔖</span>
                    </div>
                    <p className="text-text-primary font-medium mb-1">No saved posts yet</p>
                    <p className="text-text-secondary text-sm">
                      {isOwnProfile ? 'Save posts to read later — they\'ll show up here.' : 'This user hasn\'t saved any posts yet.'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      <div ref={loadMoreRef} className="h-20" />
    </div>
  )
}
