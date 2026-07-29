import { Loader2, Check, X, User } from 'lucide-react';
import { usePendingApprovals, useApproveMember, useRejectMember } from '@/hooks/use-invites';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/atoms/button';

interface PendingApprovalsProps {
  spaceId: string;
}

export function PendingApprovals({ spaceId }: PendingApprovalsProps) {
  const { data: pending, isLoading } = usePendingApprovals(spaceId);
  const approveMember = useApproveMember();
  const rejectMember = useRejectMember();
  const toast = useToast((s) => s.toast);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </div>
    );
  }

  if (!pending?.length) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-text-secondary px-1">
        Pending Approval ({pending.length})
      </h3>
      {pending.map((member) => (
        <div
          key={member.user_id}
          className="flex items-center gap-3 p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/20"
        >
          <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center overflow-hidden">
            {member.user?.avatar ? (
              <img src={member.user.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <User className="w-5 h-5 text-accent" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-text-primary">
              {member.user?.name || `User ${member.user_id.slice(0, 8)}`}
            </p>
            <p className="text-xs text-text-secondary">
              Requested {new Date(member.joined_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => approveMember.mutate(
                { spaceId, userId: member.user_id },
                { onSuccess: () => toast({ title: 'Member approved', variant: 'success' }) }
              )}
              disabled={approveMember.isPending}
            >
              <Check className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => rejectMember.mutate(
                { spaceId, userId: member.user_id },
                { onSuccess: () => toast({ title: 'Member rejected', variant: 'success' }) }
              )}
              disabled={rejectMember.isPending}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
