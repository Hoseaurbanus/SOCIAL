import { useState } from 'react'
import { Settings, Grid3X3, Bookmark, Heart, MessageCircle } from 'lucide-react'
import { useNavigate } from 'react-router'
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
  const [activeTab, setActiveTab] = useState('posts')
  const navigate = useNavigate()

  return (
    <div className="max-w-[600px] mx-auto">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">Profile</h1>
        <button
          onClick={() => navigate('/settings')}
          className="p-2 rounded-full hover:bg-bg-tertiary text-text-secondary"
          aria-label="Settings"
        >
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
      <div className="flex border-b border-border" role="tablist" aria-label="Profile content">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2',
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

      {/* Tab Panels */}
      <div id={`panel-${activeTab}`} role="tabpanel" aria-labelledby={activeTab} className="p-8 text-center text-text-secondary">
        <p>No {activeTab} yet</p>
      </div>
    </div>
  )
}
