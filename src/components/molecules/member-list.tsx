import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import type { SpaceMember } from '@/types/spaces';
import { EmptyState } from './empty-state';

interface MemberListProps {
  members: SpaceMember[];
  isLoading: boolean;
}

export function MemberList({ members, isLoading }: MemberListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </div>
    );
  }
  
  if (members.length === 0) {
    return (
      <EmptyState
        icon="👥"
        title="No members yet"
        description="Be the first to join this space"
      />
    );
  }
  
  return (
    <div className="space-y-2">
      {members.map(member => (
        <motion.div
          key={member.user_id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Link
            to={`/profile/${member.user_id}`}
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-bg-secondary transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
              <span className="text-accent font-semibold">
                {member.user_id.slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-text-primary">User {member.user_id.slice(0, 8)}</p>
              <p className="text-sm text-text-secondary capitalize">{member.role}</p>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              member.status === 'active' ? 'bg-green-100 text-green-700' :
              member.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
              {member.status}
            </span>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}