import { useState } from 'react';
import { Link2, Clock, Users, Trash2 } from 'lucide-react';
import { Button } from '@/components/atoms/button';
import { useToast } from '@/hooks/use-toast';
import type { SpaceInvite } from '@/types/invites';

interface InviteLinkCardProps {
  invite: SpaceInvite;
  onRevoke: () => void;
}

export function InviteLinkCard({ invite, onRevoke }: InviteLinkCardProps) {
  const toast = useToast((s) => s.toast);
  const [copied, setCopied] = useState(false);

  const inviteUrl = `${window.location.origin}/join/${invite.token}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      toast({ title: 'Link copied!', variant: 'success' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: 'Failed to copy', variant: 'error' });
    }
  };

  const expiresAt = new Date(invite.expires_at);
  const isExpired = expiresAt < new Date();
  const isMaxed = invite.used_count >= invite.max_uses;

  return (
    <div className="p-4 rounded-2xl bg-bg-secondary border border-border-primary">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
          <Link2 className="w-5 h-5 text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              isExpired || isMaxed
                ? 'bg-red-100 text-red-700'
                : 'bg-green-100 text-green-700'
            }`}>
              {isExpired ? 'Expired' : isMaxed ? 'Used up' : 'Active'}
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-text-secondary">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {isExpired ? 'Expired' : `Expires ${expiresAt.toLocaleDateString()}`}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {invite.used_count}/{invite.max_uses === 999 ? '∞' : invite.max_uses} uses
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <input
          readOnly
          value={inviteUrl}
          className="flex-1 px-3 py-2 text-sm rounded-xl border border-border-primary bg-bg-primary text-text-secondary truncate"
        />
        <Button size="sm" onClick={handleCopy} disabled={isExpired || isMaxed}>
          {copied ? 'Copied!' : 'Copy'}
        </Button>
        <Button size="sm" variant="danger" onClick={onRevoke}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
