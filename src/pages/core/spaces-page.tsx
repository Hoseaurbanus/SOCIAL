import { useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { Search, Loader2 } from 'lucide-react';
import { useMySpaces, useSpaces } from '@/hooks/use-spaces';
import { EmptyState } from '@/components/molecules/empty-state';
import { Input } from '@/components/atoms/input';
import type { SpaceType } from '@/types/spaces';
import { SPACE_TYPE_LABELS, SPACE_TYPE_ICONS } from '@/types/spaces';

export default function SpacesPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<SpaceType | 'all'>('all');
  
  const { data: mySpaces, isLoading: mySpacesLoading } = useMySpaces();
  const { data: allSpaces, isLoading: allSpacesLoading } = useSpaces();
  
  const isLoading = mySpacesLoading || allSpacesLoading;
  
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
        ) : filteredSpaces.length === 0 ? (
          <EmptyState
            icon="🌐"
            title="No spaces found"
            description={search ? 'Try a different search term' : 'Create or join a space to get started'}
          />
        ) : (
          <div className="space-y-3">
            {filteredSpaces.map(space => (
              <motion.div
                key={space.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Link
                  to={`/space/${space.slug}`}
                  className="block p-4 rounded-2xl bg-bg-primary border border-border-primary hover:border-accent transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-2xl">
                      {space.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-text-primary truncate">{space.name}</h3>
                        {mySpaceIds.has(space.id) && (
                          <span className="px-2 py-0.5 rounded-full bg-accent/10 text-accent text-xs font-medium">
                            Joined
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-text-secondary mt-0.5">
                        {SPACE_TYPE_LABELS[space.space_type]} · {space.member_count} members
                      </p>
                      {space.description && (
                        <p className="text-sm text-text-tertiary mt-1 line-clamp-2">{space.description}</p>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
