import { useState } from 'react';
import { useParams, Link } from 'react-router';
import { ArrowLeft, Settings, Users, Loader2, Plus, Lock, Globe } from 'lucide-react';
import { useSpace, useJoinSpace, useLeaveSpace, useSpaceMembers } from '@/hooks/use-spaces';
import { useContentItems, useToggleReaction } from '@/hooks/use-content';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/atoms/button';
import { EmptyState } from '@/components/molecules/empty-state';
import { ContentCard } from '@/components/molecules/content-card';

export default function SpaceDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'feed' | 'members' | 'about' | 'settings'>('feed');

  const { data: space, isLoading: spaceLoading, error: spaceError } = useSpace(slug || '');
  const { data: members, isLoading: membersLoading } = useSpaceMembers(space?.id || '');
  const { data: contentData, isLoading: contentLoading } = useContentItems({
    spaceId: space?.id || '',
  });
  const joinMutation = useJoinSpace();
  const leaveMutation = useLeaveSpace();
  const toggleReaction = useToggleReaction();

  if (spaceLoading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (spaceError) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <EmptyState
          icon="⚠️"
          title="Failed to load space"
          description="Something went wrong. Please try again."
        />
      </div>
    );
  }

  if (!space) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <EmptyState
          icon="🔍"
          title="Space not found"
          description="This space may have been deleted or you don't have access."
        />
      </div>
    );
  }

  const isOwner = space.member_role === 'owner';
  const isAdmin = space.member_role === 'admin' || isOwner;

  const handleJoin = () => {
    if (!user) return;
    joinMutation.mutate(space.id);
  };

  const handleLeave = () => {
    if (!user) return;
    leaveMutation.mutate(space.id);
  };

  const tabs: { id: 'feed' | 'members' | 'about' | 'settings'; label: string; icon: string }[] = [
    { id: 'feed', label: 'Feed', icon: '📝' },
    { id: 'members', label: 'Members', icon: '👥' },
    { id: 'about', label: 'About', icon: 'ℹ️' },
  ];

  if (isAdmin) {
    tabs.push({ id: 'settings', label: 'Settings', icon: '⚙️' });
  }

  const contentItems = contentData?.items || [];

  return (
    <div className="min-h-screen bg-bg-primary pb-20">
      <div className="sticky top-0 z-20 glass border-b border-border-primary">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link to="/spaces" className="p-2 rounded-xl hover:bg-bg-secondary transition-colors">
            <ArrowLeft className="w-5 h-5 text-text-primary" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-text-primary truncate">{space.name}</h1>
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              {space.visibility === 'private' ? (
                <Lock className="w-3.5 h-3.5" />
              ) : (
                <Globe className="w-3.5 h-3.5" />
              )}
              <span>{space.member_count} members</span>
            </div>
          </div>
          {isAdmin && (
            <Link
              to={`/space/${space.slug}/settings`}
              className="p-2 rounded-xl hover:bg-bg-secondary transition-colors"
            >
              <Settings className="w-5 h-5 text-text-primary" />
            </Link>
          )}
        </div>

        <div className="flex px-4 gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 text-sm font-medium rounded-xl transition-colors ${
                activeTab === tab.id
                  ? 'bg-accent text-white'
                  : 'text-text-secondary hover:bg-bg-secondary'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 border-b border-border-primary">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center text-3xl">
            {space.icon}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-text-primary">{space.name}</h2>
            {space.description && (
              <p className="text-sm text-text-secondary mt-1">{space.description}</p>
            )}
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          {space.is_member ? (
            <>
              {!isOwner && (
                <Button
                  variant="secondary"
                  className="text-red-500 hover:bg-red-50 hover:border-red-200"
                  onClick={handleLeave}
                  disabled={leaveMutation.isPending}
                >
                  {leaveMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Leave'
                  )}
                </Button>
              )}
            </>
          ) : (
            <Button
              className="flex-1"
              onClick={handleJoin}
              disabled={joinMutation.isPending}
            >
              {joinMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Join Space
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <div className="px-4 py-4">
        {activeTab === 'feed' && (
          <div className="space-y-4">
            {space.is_member ? (
              <Link
                to={`/compose?space=${space.id}`}
                className="block p-4 rounded-2xl border border-border-primary hover:border-accent transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                    <Plus className="w-5 h-5 text-accent" />
                  </div>
                  <span className="text-text-secondary">What's on your mind?</span>
                </div>
              </Link>
            ) : (
              <div className="p-4 rounded-2xl bg-bg-secondary text-center">
                <p className="text-text-secondary">Join this space to see posts and participate</p>
              </div>
            )}

            {contentLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-accent" />
              </div>
            ) : contentItems.length === 0 ? (
              <EmptyState
                icon="📝"
                title="No posts yet"
                description="Be the first to post in this space!"
              />
            ) : (
              contentItems.map(item => (
                <ContentCard
                  key={item.id}
                  item={item}
                  onLike={() => toggleReaction.mutate({ contentItemId: item.id })}
                />
              ))
            )}
          </div>
        )}

        {activeTab === 'members' && (
          <div className="space-y-2">
            {membersLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-accent" />
              </div>
            ) : members?.length === 0 ? (
              <EmptyState
                icon="👥"
                title="No members yet"
                description="Be the first to join this space"
              />
            ) : (
              members?.map(member => (
                <div key={member.user_id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-bg-secondary">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center overflow-hidden">
                    {member.user?.avatar ? (
                      <img src={member.user.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Users className="w-5 h-5 text-accent" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-text-primary">
                      {member.user?.name || `User ${member.user_id.slice(0, 8)}`}
                    </p>
                    <p className="text-sm text-text-secondary capitalize">{member.role}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    member.status === 'active' ? 'bg-green-100 text-green-700' :
                    member.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {member.status}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'about' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-bg-secondary">
              <h3 className="font-semibold text-text-primary mb-2">About this space</h3>
              <p className="text-text-secondary">{space.description || 'No description provided.'}</p>
            </div>
            <div className="p-4 rounded-2xl bg-bg-secondary">
              <h3 className="font-semibold text-text-primary mb-2">Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Type</span>
                  <span className="text-text-primary capitalize">{space.space_type.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Visibility</span>
                  <span className="text-text-primary capitalize">{space.visibility}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Created</span>
                  <span className="text-text-primary">
                    {new Date(space.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && isAdmin && (
          <div className="space-y-4">
            <Link
              to={`/space/${space.slug}/settings`}
              className="block p-4 rounded-2xl bg-bg-secondary hover:bg-bg-tertiary transition-colors"
            >
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-accent" />
                <div>
                  <p className="font-medium text-text-primary">Space Settings</p>
                  <p className="text-sm text-text-secondary">Edit name, description, modules, and more</p>
                </div>
              </div>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
