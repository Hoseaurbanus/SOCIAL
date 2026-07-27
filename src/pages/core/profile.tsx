import { Settings, Grid3X3, Bookmark, Heart, MessageCircle } from 'lucide-react'
import { Avatar } from '@/components/atoms/avatar'
import { Button } from '@/components/atoms/button'
import { cn } from '@/lib/utils'

const tabs = [
  { id: 'posts', label: 'Posts', icon: Grid3X3 },
  { id: 'replies', label: 'Replies', icon: MessageCircle },
  { id: 'likes', label: 'Likes', icon: Heart },
  { id: 'bookmarks', label: 'Bookmarks', icon: Bookmark },
]

export default function ProfilePage() {
  return (
    <div className="max-w-[600px] mx-auto">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">Profile</h1>
        <button className="p-2 rounded-full hover:bg-bg-tertiary text-text-secondary">
          <Settings className="h-5 w-5" />
        </button>
      </div>

      {/* Profile Info */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-4">
          <Avatar size="xl" />
          <Button variant="secondary" size="sm">Edit Profile</Button>
        </div>
        <h2 className="text-xl font-bold text-text-primary">John Doe</h2>
        <p className="text-text-secondary">@johndoe</p>
        <p className="text-text-primary mt-2">Building cool things with code. Design enthusiast. Coffee lover.</p>
        <div className="flex items-center gap-4 mt-3 text-sm text-text-secondary">
          <span><strong className="text-text-primary">1,234</strong> posts</span>
          <span><strong className="text-text-primary">5,678</strong> followers</span>
          <span><strong className="text-text-primary">890</strong> following</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2',
              tab.id === 'posts'
                ? 'border-accent text-accent'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Posts placeholder */}
      <div className="p-8 text-center text-text-secondary">
        <p>No posts yet</p>
      </div>
    </div>
  )
}
