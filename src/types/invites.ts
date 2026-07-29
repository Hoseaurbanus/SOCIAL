export type InviteType = 'direct' | 'link';
export type InviteStatus = 'active' | 'revoked' | 'expired';

export interface SpaceInvite {
  id: string;
  space_id: string;
  created_by: string;
  invite_type: InviteType;
  token: string;
  email: string | null;
  invited_user_id: string | null;
  expires_at: string;
  max_uses: number;
  used_count: number;
  status: InviteStatus;
  created_at: string;
}

export interface SpaceInviteWithDetails extends SpaceInvite {
  inviter?: {
    id: string;
    name: string;
    username: string;
    avatar: string | null;
  };
  invited_user?: {
    id: string;
    name: string;
    username: string;
    avatar: string | null;
  };
}

export interface CreateInviteInput {
  spaceId: string;
  inviteType: InviteType;
  email?: string;
  userId?: string;
  expiresAt: string;
  maxUses: number;
}

export const INVITE_EXPIRY_OPTIONS = [
  { label: '1 hour', value: 1 },
  { label: '24 hours', value: 24 },
  { label: '7 days', value: 168 },
  { label: '30 days', value: 720 },
] as const;

export const INVITE_USES_OPTIONS = [
  { label: '1 use', value: 1 },
  { label: '5 uses', value: 5 },
  { label: '10 uses', value: 10 },
  { label: '25 uses', value: 25 },
  { label: 'Unlimited', value: 999 },
] as const;
