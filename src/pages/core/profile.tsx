import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { Settings, MapPin, LinkIcon, Calendar } from 'lucide-react'
import { Button } from '@/components/atoms/button'
import { Avatar } from '@/components/atoms/avatar'
import { PostCard } from '@/components/molecules/post-card'
import { useProfile, useFollowCounts, useToggleFollow, useFollowStatus } from '@/hooks/use-profile'
import { useUserPosts, useToggleLike, useToggleBookmark, useLikeStatus, useBookmarkStatus } from '@/hooks/use-posts'
import { useAuthStore } from '@/stores/auth-store'

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>()
  const currentUser = useAuthStore((s) => s.user)
  const { data: profile, isLoading: profileLoading } = useProfile(username || currentUser?.username || '')
  const { data: followCounts } = useFollowCounts(profile?.id || '')
  const toggleFollow = useToggleFollow()
  const { data: isFollowing } = useFollowStatus(profile?.id ? [profile.id] : [])
  const following = isFollowing?.[profile.id] || false
  const { data: postsData, isLoading: postsLoading, error: postsError } = useUserPosts(profile?.id || '')
  const toggleLike = useToggleLike()
  const toggleBookmark = useToggleBookmark()
  const [activeTab, setActiveTab] = useState('posts')

  const posts = postsData?.pages.flatMap((p) => p.posts) || []
  const postIds = posts.map((p) => p.id)
  const { data: likedMap } = useLikeStatus(postIds)
  const { data: bookmarkedMap } = useBookmarkStatus(postIds)
  const isOwnProfile = currentUser?.username === username || (!username && currentUser?.username)

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
        <div>
          <h1 className="text-lg font-bold text-text-primary">{profile.name}</h1>
          <p className="text-sm text-text-tertiary">{posts.length} posts</p>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/settings">
            <Settings className="h-5 w-5" />
          </Link>
        </Button>
      </div>

      {/* Profile Info */}
      <div className="px-4 pb-4">
        <div className="flex items-end justify-between -mt-12 mb-3">
          <Avatar src={profile.avatar} alt={profile.name} size="2xl" className="border-4 border-bg-primary" />
          {isOwnProfile ? (
            <Button variant="secondary" size="sm">Edit Profile</Button>
          ) : (
            <Button
              variant={following ? 'secondary' : 'primary'}
              size="sm"
              onClick={() => toggleFollow.mutate(profile.id)}
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

        <div className="flex items-center gap-4 mt-3 text-sm text-text-tertiary">
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
          <span className="text-sm">
            <strong className="text-text-primary">{followCounts?.following || 0}</strong>{' '}
            <span className="text-text-tertiary">Following</span>
          </span>
          <span className="text-sm">
            <strong className="text-text-primary">{followCounts?.followers || 0}</strong>{' '}
            <span className="text-text-tertiary">Followers</span>
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex">
          {['posts', 'replies', 'likes', 'bookmarks'].map((tab) => (
            <button
              key={tab}
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
        {postsError ? (
          <div className="p-8 text-center">
            <p className="text-text-secondary mb-2">Failed to load posts.</p>
            <Button variant="secondary" size="sm" onClick={() => window.location.reload()}>
              Try again
            </Button>
          </div>
        ) : postsLoading ? (
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
        ) : activeTab === 'posts' ? (
          posts.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-text-secondary">No posts yet</p>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post.id}
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
          )
        ) : (
          <div className="p-8 text-center">
            <p className="text-text-secondary">No {activeTab} yet</p>
          </div>
        )}
      </div>
    </div>
  )
}
