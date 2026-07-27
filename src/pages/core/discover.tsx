import { useState } from 'react'
import { TrendingUp, Users, Grid3X3, Compass } from 'lucide-react'
import { Card } from '@/components/molecules/card'
import { Button } from '@/components/atoms/button'
import { cn } from '@/lib/utils'

const tabs = [
  { id: 'discover', label: 'Discover', icon: Compass },
  { id: 'trending', label: 'Trending', icon: TrendingUp },
  { id: 'people', label: 'People', icon: Users },
  { id: 'communities', label: 'Communities', icon: Grid3X3 },
]

const trendingTopics = ['#DesignSystems', '#WebDev', '#Photography', '#AI', '#Marketing', '#StartupLife']

const communities = [
  { name: 'Design Systems', members: '12.4k', icon: '🎨' },
  { name: 'JavaScript', members: '45.2k', icon: '⚡' },
  { name: 'React Devs', members: '28.1k', icon: '⚛️' },
  { name: 'TypeScript', members: '19.8k', icon: '📘' },
]

export default function DiscoverPage() {
  const [activeTab, setActiveTab] = useState('discover')

  return (
    <div className="max-w-[600px] mx-auto">
      {/* Tabs */}
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

      <div className="p-4 space-y-6">
        {/* Trending Topics */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-2">
          {trendingTopics.map((topic) => (
            <button key={topic} className="px-3 py-1.5 text-sm text-text-secondary border border-border rounded-full whitespace-nowrap hover:bg-bg-tertiary transition-colors">
              {topic}
            </button>
          ))}
        </div>

        {/* AI Recommendations */}
        <div>
          <h3 className="text-base font-semibold text-text-primary mb-3">
            <span className="text-accent">✨</span> Based on your interests
          </h3>
          <div className="flex gap-3 overflow-x-auto scrollbar-none pb-2">
            {communities.map((community) => (
              <Card key={community.name} padding="md" hover className="flex-shrink-0 w-[200px]">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-12 w-12 rounded-full bg-accent-light flex items-center justify-center text-xl">
                    {community.icon}
                  </div>
                  <div>
                    <div className="font-semibold text-text-primary">{community.name}</div>
                    <div className="text-sm text-text-secondary">{community.members} members</div>
                  </div>
                </div>
                <Button size="sm" fullWidth>Join</Button>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
