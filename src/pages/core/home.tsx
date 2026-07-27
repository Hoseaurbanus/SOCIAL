import { useState } from 'react'
import { LayoutGrid, Users, Grid3X3, Clock, Zap } from 'lucide-react'
import { PostCard } from '@/components/molecules/post-card'
import { Stories } from '@/components/molecules/stories'
import { cn } from '@/lib/utils'

const tabs = [
  { id: 'for-you', label: 'For You', icon: LayoutGrid },
  { id: 'following', label: 'Following', icon: Users },
  { id: 'communities', label: 'Communities', icon: Grid3X3 },
  { id: 'chronological', label: 'Chronological', icon: Clock },
  { id: 'trending', label: 'Trending', icon: Zap },
]

const mockPosts = [
  {
    author: { name: 'Alex Johnson', username: 'alexj' },
    community: 'Design Systems',
    content: 'Just shipped our new design token system! It uses CSS custom properties with a dark/light theme toggle. The component library is built on Radix UI primitives.',
    timestamp: '2h ago',
    likes: 42,
    comments: 8,
  },
  {
    author: { name: 'Sarah Chen', username: 'sarahc' },
    content: 'Hot take: TypeScript is not just "JavaScript with types." It fundamentally changes how you architect applications. The type system is incredibly powerful.',
    timestamp: '4h ago',
    likes: 156,
    comments: 23,
  },
  {
    author: { name: 'Marcus Rivera', username: 'marcusr' },
    community: 'Web Dev',
    content: 'React Server Components are a paradigm shift. Once you understand the mental model, there is no going back.',
    timestamp: '6h ago',
    likes: 89,
    comments: 15,
  },
]

const mockStories = [
  { id: '1', username: 'AJ' },
  { id: '2', username: 'SC' },
  { id: '3', username: 'MR' },
  { id: '4', username: 'KL' },
  { id: '5', username: 'TW' },
]

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('for-you')

  return (
    <div className="max-w-[600px] mx-auto">
      {/* Feed Tabs */}
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

      {/* Stories */}
      <Stories
        stories={mockStories}
        onStoryClick={(id) => console.log('Story clicked:', id)}
        onAddStory={() => console.log('Add story')}
      />

      {/* Feed */}
      <div className="divide-y divide-border">
        {mockPosts.map((post, i) => (
          <PostCard key={i} {...post} />
        ))}
      </div>
    </div>
  )
}
