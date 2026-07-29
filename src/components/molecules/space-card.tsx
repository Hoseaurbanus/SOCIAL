import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/atoms/button';
import type { SpaceWithMembership } from '@/types/spaces';
import { SPACE_TYPE_LABELS } from '@/types/spaces';

interface SpaceCardProps {
  space: SpaceWithMembership;
  isMember?: boolean;
  onJoin?: () => void;
  onLeave?: () => void;
  onClick?: () => void;
  joinLoading?: boolean;
}

export function SpaceCard({ space, isMember, onJoin, onLeave, onClick, joinLoading }: SpaceCardProps) {
  const isJoined = isMember ?? space.is_member;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div
        className="block p-4 rounded-2xl bg-bg-primary border border-border-primary hover:border-accent transition-colors cursor-pointer"
        onClick={onClick || (() => window.location.href = `/space/${space.slug}`)}
      >
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-2xl">
            {space.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-text-primary truncate">{space.name}</h3>
              {isJoined && (
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
          {(onJoin || onLeave) && (
            <div className="flex-shrink-0">
              {isJoined ? (
                onLeave && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); onLeave(); }}
                    disabled={joinLoading}
                  >
                    {joinLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Leave'}
                  </Button>
                )
              ) : (
                onJoin && (
                  <Button
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); onJoin(); }}
                    disabled={joinLoading}
                  >
                    {joinLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Join'}
                  </Button>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
