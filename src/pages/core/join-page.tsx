import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { Loader2, CheckCircle, XCircle, Users } from 'lucide-react';
import { validateInviteToken, acceptInvite } from '@/api/invites';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/atoms/button';
import { SmugflexLogo } from '@/components/atoms/smugflex-logo';
import type { SpaceInvite } from '@/types/invites';

export default function JoinPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [invite, setInvite] = useState<SpaceInvite | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [spaceSlug, setSpaceSlug] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Invalid invite link.');
      setLoading(false);
      return;
    }

    validateInviteToken(token).then((result) => {
      if (result.valid && result.invite) {
        setInvite(result.invite);
      } else {
        setError(result.error || 'Invalid invite link.');
      }
      setLoading(false);
    });
  }, [token]);

  const handleJoin = async () => {
    if (!token || !user) return;
    setJoining(true);
    try {
      const result = await acceptInvite(token);
      if (result.success) {
        setSuccess(true);
        setSpaceSlug(result.spaceSlug || null);
      } else {
        setError(result.error || 'Failed to join space.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary px-4">
        <div className="w-full max-w-md text-center space-y-6">
          <SmugflexLogo className="h-12 w-auto mx-auto" />
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center">
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Invite Invalid</h1>
            <p className="text-text-secondary mt-2">{error}</p>
          </div>
          <Link to="/spaces">
            <Button variant="secondary" fullWidth>Browse Spaces</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary px-4">
        <div className="w-full max-w-md text-center space-y-6">
          <SmugflexLogo className="h-12 w-auto mx-auto" />
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">You're in!</h1>
            <p className="text-text-secondary mt-2">You've joined the space successfully.</p>
          </div>
          <Button
            fullWidth
            onClick={() => navigate(spaceSlug ? `/space/${spaceSlug}` : '/spaces')}
          >
            Go to Space
          </Button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary px-4">
        <div className="w-full max-w-md text-center space-y-6">
          <SmugflexLogo className="h-12 w-auto mx-auto" />
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Join via Invite</h1>
            <p className="text-text-secondary mt-2">Sign in to accept this invite</p>
          </div>
          <Link to={`/login?returnTo=/join/${token}`}>
            <Button fullWidth>Sign In</Button>
          </Link>
          <p className="text-sm text-text-secondary">
            Don't have an account?{' '}
            <Link to={`/signup?returnTo=/join/${token}`} className="text-accent hover:text-accent-hover font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary px-4">
      <div className="w-full max-w-md text-center space-y-6">
        <SmugflexLogo className="h-12 w-auto mx-auto" />

        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center text-3xl">
            🔗
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-text-primary">You've been invited!</h1>
          <p className="text-text-secondary mt-2">
            Join this space to participate and connect with members.
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 text-sm text-text-secondary">
          <Users className="w-4 h-4" />
          <span>Expires {new Date(invite!.expires_at).toLocaleDateString()}</span>
        </div>

        <Button fullWidth onClick={handleJoin} disabled={joining}>
          {joining ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : null}
          Join Space
        </Button>

        <Link to="/spaces" className="block">
          <Button variant="ghost" fullWidth>Browse Other Spaces</Button>
        </Link>
      </div>
    </div>
  );
}
