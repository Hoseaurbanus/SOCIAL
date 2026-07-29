import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { SpaceWithMembership } from '@/types/spaces';
import { SPACE_TYPE_LABELS } from '@/types/spaces';

interface SpaceCardProps {
  space: SpaceWithMembership;
}

export function SpaceCard({ space }: SpaceCardProps) {
  return (
    <motion.div
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
              {space.is_member && (
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
  );
}