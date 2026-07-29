import { supabase } from '@/config/supabase';
import type { SpaceInvite, CreateInviteInput } from '@/types/invites';

const TABLE_MISSING = ['42P01', '42501', 'PGRST301'];

export function generateInviteToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export async function createInvite(input: CreateInviteInput): Promise<SpaceInvite | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const token = generateInviteToken();

  const { data, error } = await supabase
    .from('space_invites')
    .insert({
      space_id: input.spaceId,
      created_by: user.id,
      invite_type: input.inviteType,
      token,
      email: input.email || null,
      invited_user_id: input.userId || null,
      expires_at: input.expiresAt,
      max_uses: input.maxUses,
    })
    .select()
    .single();

  if (error) {
    if (TABLE_MISSING.includes(error.code)) return null;
    throw error;
  }
  return data;
}

export async function revokeInvite(inviteId: string): Promise<void> {
  const { error } = await supabase
    .from('space_invites')
    .update({ status: 'revoked' })
    .eq('id', inviteId);

  if (error) throw error;
}

export async function fetchSpaceInvites(spaceId: string): Promise<SpaceInvite[]> {
  const { data, error } = await supabase
    .from('space_invites')
    .select('*')
    .eq('space_id', spaceId)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) {
    if (TABLE_MISSING.includes(error.code)) return [];
    throw error;
  }
  return data || [];
}

export async function validateInviteToken(token: string): Promise<{
  valid: boolean;
  invite?: SpaceInvite;
  error?: string;
}> {
  const { data, error } = await supabase
    .from('space_invites')
    .select('*')
    .eq('token', token)
    .eq('status', 'active')
    .single();

  if (error || !data) {
    return { valid: false, error: 'Invalid or expired invite link.' };
  }

  if (new Date(data.expires_at) < new Date()) {
    return { valid: false, error: 'This invite has expired.' };
  }

  if (data.used_count >= data.max_uses) {
    return { valid: false, error: 'This invite has reached its usage limit.' };
  }

  return { valid: true, invite: data };
}

export async function acceptInvite(token: string): Promise<{
  success: boolean;
  spaceSlug?: string;
  error?: string;
}> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const validation = await validateInviteToken(token);
  if (!validation.valid || !validation.invite) {
    return { success: false, error: validation.error };
  }

  const invite = validation.invite;

  const { data: existingMember } = await supabase
    .from('space_members')
    .select('space_id')
    .eq('space_id', invite.space_id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existingMember) {
    const { data: space } = await supabase
      .from('spaces')
      .select('slug')
      .eq('id', invite.space_id)
      .single();
    return { success: true, spaceSlug: space?.slug };
  }

  const { data: memberRole } = await supabase
    .from('roles')
    .select('id')
    .eq('name', 'member')
    .single();

  const { data: spaceData } = await supabase
    .from('spaces')
    .select('require_approval')
    .eq('id', invite.space_id)
    .single();

  const isDirectInvite = invite.invite_type === 'direct';
  const requireApproval = spaceData?.require_approval && !isDirectInvite;

  const { error: memberError } = await supabase
    .from('space_members')
    .insert({
      space_id: invite.space_id,
      user_id: user.id,
      role: 'member',
      role_id: memberRole?.id || null,
      status: requireApproval ? 'pending' : 'active',
    });

  if (memberError) throw memberError;

  await supabase.rpc('increment_space_members', { space_id: invite.space_id });
  await supabase.rpc('increment_invite_usage', { invite_token: token });

  const { data: space } = await supabase
    .from('spaces')
    .select('slug')
    .eq('id', invite.space_id)
    .single();

  return { success: true, spaceSlug: space?.slug };
}

export async function fetchPendingApprovals(spaceId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('space_members')
    .select('*, user:profiles!space_members_user_id_fkey(id, name, username, avatar)')
    .eq('space_id', spaceId)
    .eq('status', 'pending')
    .order('joined_at');

  if (error) {
    if (TABLE_MISSING.includes(error.code)) return [];
    throw error;
  }
  return data || [];
}

export async function approveMember(spaceId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('space_members')
    .update({ status: 'active' })
    .eq('space_id', spaceId)
    .eq('user_id', userId);

  if (error) throw error;
}

export async function rejectMember(spaceId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('space_members')
    .delete()
    .eq('space_id', spaceId)
    .eq('user_id', userId);

  if (error) throw error;

  try {
    await supabase.rpc('decrement_space_members', { space_id: spaceId });
  } catch {
    // Counter may go stale
  }
}
