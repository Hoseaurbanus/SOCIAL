import { useParams, useNavigate } from 'react-router'
import { ChevronLeft, Users } from 'lucide-react'
import { Button } from '@/components/atoms/button'
import { useCommunityById, useJoinCommunity, useLeaveCommunity } from '@/hooks/use-communities'
import { useToast } from '@/hooks/use-toast'

export default function CommunityDetailPage() {
  const { communityId } = useParams<{ communityId: string }>()
  const navigate = useNavigate()
  const { data: community, isLoading, error } = useCommunityById(communityId || '')
  const joinCommunity = useJoinCommunity()
  const leaveCommunity = useLeaveCommunity()
  const toast = useToast((s) => s.toast)

  if (isLoading) {
    return (
      <div className="max-w-[600px] mx-auto">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-bg-tertiary text-text-secondary transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="h-6 w-48 bg-bg-tertiary rounded animate-pulse" />
        </div>
        <div className="p-8 animate-pulse space-y-4">
          <div className="h-24 bg-bg-tertiary rounded-2xl" />
          <div className="h-4 w-64 bg-bg-tertiary rounded" />
          <div className="h-4 w-96 bg-bg-tertiary rounded" />
        </div>
      </div>
    )
  }

  if (error || !community) {
    return (
      <div className="max-w-[600px] mx-auto">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-bg-tertiary text-text-secondary transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-bold text-text-primary">Community</h1>
        </div>
        <div className="p-12 text-center">
          <p className="text-text-primary font-semibold mb-1">Community not found</p>
          <p className="text-text-tertiary text-sm mb-4">This community may have been deleted.</p>
          <Button variant="secondary" size="sm" onClick={() => navigate(-1)} className="rounded-2xl">
            Go back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[600px] mx-auto">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-bg-tertiary text-text-secondary transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold text-text-primary">{community.name}</h1>
      </div>

      <div className="p-4 space-y-4">
        <div className="flex items-start gap-4">
          <div className="h-20 w-20 rounded-2xl bg-accent/10 flex items-center justify-center text-4xl flex-shrink-0">
            {community.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-text-primary">{community.name}</h2>
            <div className="flex items-center gap-2 text-sm text-text-secondary mt-1">
              <Users className="h-4 w-4" />
              <span>{community.member_count} members</span>
            </div>
          </div>
          <Button
            variant={community.is_member ? 'secondary' : 'primary'}
            size="sm"
            onClick={() => {
              if (community.is_member) {
                leaveCommunity.mutate(community.id, {
                  onSuccess: () => toast({ title: 'Left community', variant: 'success' }),
                  onError: () => toast({ title: 'Failed to leave community', variant: 'error' }),
                })
              } else {
                joinCommunity.mutate(community.id, {
                  onSuccess: () => toast({ title: 'Joined community!', variant: 'success' }),
                  onError: () => toast({ title: 'Failed to join community', variant: 'error' }),
                })
              }
            }}
            loading={joinCommunity.isPending || leaveCommunity.isPending}
          >
            {community.is_member ? 'Joined' : 'Join'}
          </Button>
        </div>

        {community.description && (
          <p className="text-text-primary">{community.description}</p>
        )}

        <div className="p-8 text-center">
          <div className="h-16 w-16 rounded-3xl bg-accent-light flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-accent" />
          </div>
          <p className="text-text-primary font-semibold mb-1">Community posts coming soon</p>
          <p className="text-text-tertiary text-sm">Posts from community members will appear here.</p>
        </div>
      </div>
    </div>
  )
}
