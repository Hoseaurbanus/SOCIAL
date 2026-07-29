import { useState } from 'react';
import { X, Search, Link2, Loader2, UserPlus } from 'lucide-react';
import { useCreateInvite, useSpaceInvites, useRevokeInvite } from '@/hooks/use-invites';
import { InviteLinkCard } from '@/components/molecules/invite-link-card';
import { Button } from '@/components/atoms/button';
import { Input } from '@/components/atoms/input';
import { useToast } from '@/hooks/use-toast';
import { INVITE_EXPIRY_OPTIONS, INVITE_USES_OPTIONS } from '@/types/invites';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  spaceId: string;
  spaceName: string;
}

export function InviteModal({ isOpen, onClose, spaceId, spaceName }: InviteModalProps) {
  const [activeTab, setActiveTab] = useState<'search' | 'link'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string; username: string } | null>(null);
  const [expiryHours, setExpiryHours] = useState(168);
  const [maxUses, setMaxUses] = useState(10);

  const createInvite = useCreateInvite();
  const { data: existingInvites } = useSpaceInvites(spaceId);
  const revokeInvite = useRevokeInvite();
  const toast = useToast((s) => s.toast);

  if (!isOpen) return null;

  const handleDirectInvite = async () => {
    if (!selectedUser) return;
    const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000).toISOString();
    try {
      await createInvite.mutateAsync({
        spaceId,
        inviteType: 'direct',
        userId: selectedUser.id,
        expiresAt,
        maxUses: 1,
      });
      toast({ title: `Invited ${selectedUser.name}`, variant: 'success' });
      setSelectedUser(null);
      setSearchQuery('');
    } catch {
      toast({ title: 'Failed to send invite', variant: 'error' });
    }
  };

  const handleCreateLink = async () => {
    const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000).toISOString();
    try {
      await createInvite.mutateAsync({
        spaceId,
        inviteType: 'link',
        expiresAt,
        maxUses,
      });
      toast({ title: 'Invite link created', variant: 'success' });
    } catch {
      toast({ title: 'Failed to create link', variant: 'error' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-bg-primary rounded-2xl border border-border-primary shadow-xl mx-4 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border-primary">
          <div>
            <h2 className="text-lg font-bold text-text-primary">Invite to {spaceName}</h2>
            <p className="text-sm text-text-secondary">Invite members or share a link</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-bg-secondary transition-colors">
            <X className="w-5 h-5 text-text-primary" />
          </button>
        </div>

        <div className="flex border-b border-border-primary">
          <button
            onClick={() => setActiveTab('search')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'search'
                ? 'text-accent border-b-2 border-accent'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <UserPlus className="w-4 h-4 inline mr-2" />
            Search Users
          </button>
          <button
            onClick={() => setActiveTab('link')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'link'
                ? 'text-accent border-b-2 border-accent'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Link2 className="w-4 h-4 inline mr-2" />
            Create Link
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'search' && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                <Input
                  placeholder="Search by username..."
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {selectedUser && (
                <div className="p-3 rounded-xl bg-accent/5 border border-accent/20 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-text-primary">{selectedUser.name}</p>
                    <p className="text-sm text-text-secondary">@{selectedUser.username}</p>
                  </div>
                  <Button size="sm" onClick={handleDirectInvite} disabled={createInvite.isPending}>
                    {createInvite.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Invite'}
                  </Button>
                </div>
              )}

              <p className="text-xs text-text-secondary text-center">
                Search for users to send a direct invite with notification
              </p>
            </div>
          )}

          {activeTab === 'link' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Expiry</label>
                <select
                  value={expiryHours}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setExpiryHours(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-border-primary bg-bg-primary text-text-primary"
                >
                  {INVITE_EXPIRY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Max Uses</label>
                <select
                  value={maxUses}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setMaxUses(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-border-primary bg-bg-primary text-text-primary"
                >
                  {INVITE_USES_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <Button fullWidth onClick={handleCreateLink} disabled={createInvite.isPending}>
                {createInvite.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Generate Invite Link
              </Button>

              {existingInvites && existingInvites.length > 0 && (
                <div className="space-y-3 mt-4">
                  <h3 className="text-sm font-semibold text-text-secondary">Active Links</h3>
                  {existingInvites.filter(i => i.invite_type === 'link').map((invite) => (
                    <InviteLinkCard
                      key={invite.id}
                      invite={invite}
                      onRevoke={() => revokeInvite.mutate(invite.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
