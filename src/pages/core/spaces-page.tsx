import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { useMySpaces, useSpaces, useJoinSpace, useLeaveSpace } from '@/hooks/use-spaces';
import { SpaceCard } from '@/components/molecules/space-card';
import { EmptyState } from '@/components/molecules/empty-state';
import { Input } from '@/components/atoms/input';
import type { SpaceType } from '@/types/spaces';
import { SPACE_TYPE_LABELS, SPACE_TYPE_ICONS } from '@/types/spaces';
import { useToast } from '@/hooks/use-toast';

export default function SpacesPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<SpaceType | 'all'>('all');
  
  const { data: mySpaces, isLoading: mySpacesLoading, error: mySpacesError } = useMySpaces();
  const { data: allSpaces, isLoading: allSpacesLoading, error: allSpacesError } = useSpaces();
  const joinSpace = useJoinSpace();
  const leaveSpace = useLeaveSpace();
  const toast = useToast((s) => s.toast);
  
  const isLoading = mySpacesLoading || allSpacesLoading;
  const error = mySpacesError || allSpacesError;
  
  const filteredSpaces = (allSpaces?.spaces || []).filter(space => {
    const matchesSearch = space.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || space.space_type === filter;
    return matchesSearch && matchesFilter;
  });
  
  const mySpaceIds = new Set(mySpaces?.map(s => s.id) || []);
  
  return (
    <div className="min-h-screen bg-bg-primary pb-20">
      <div className="sticky top-0 z-20 glass border-b border-border-primary">
        <div className="px-4 py-3">
          <h1 className="text-xl font-bold text-text-primary">Spaces</h1>
          <p className="text-sm text-text-secondary">Join communities, classrooms, and groups</p>
        </div>
        
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <Input
              placeholder="Search spaces..."
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="px-4 pb-3 flex gap-2 overflow-x-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-accent text-white'
                : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary'
            }`}
          >
            All
          </button>
          {(Object.keys(SPACE_TYPE_LABELS) as SpaceType[]).map(type => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                filter === type
                  ? 'bg-accent text-white'
                  : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary'
              }`}
            >
              {SPACE_TYPE_ICONS[type]} {SPACE_TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      </div>
      
      <div className="px-4 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-text-secondary mb-2">Failed to load spaces.</p>
            <button onClick={() => window.location.reload()} className="text-accent text-sm font-medium">Try again</button>
          </div>
        ) : filteredSpaces.length === 0 ? (
          <EmptyState
            icon="🌐"
            title="No spaces found"
            description={search ? 'Try a different search term' : 'Create or join a space to get started'}
          />
        ) : (
          <div className="space-y-3">
            {filteredSpaces.map(space => (
              <SpaceCard
                key={space.id}
                space={space}
                isMember={mySpaceIds.has(space.id)}
                onJoin={() => joinSpace.mutate(space.id, {
                  onSuccess: () => toast({ title: 'Joined space!', variant: 'success' }),
                  onError: () => toast({ title: 'Failed to join space', variant: 'error' }),
                })}
                onLeave={() => leaveSpace.mutate(space.id, {
                  onSuccess: () => toast({ title: 'Left space', variant: 'success' }),
                  onError: () => toast({ title: 'Failed to leave space', variant: 'error' }),
                })}
                joinLoading={joinSpace.isPending || leaveSpace.isPending}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
