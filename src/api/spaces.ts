import { supabase } from '@/config/supabase';
import type { Space, SpaceWithMembership, SpaceMember, SpaceMemberRole, SpaceModules } from '@/types/spaces';

const TABLE_MISSING = ['42P01', '42501', 'PGRST301'];

export async function fetchSpaces(page = 1, pageSize = 20): Promise<{ spaces: SpaceWithMembership[]; total: number }> {
  const { data: { user } } = await supabase.auth.getUser();
  
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  
  const { data, error, count } = await supabase
    .from('spaces')
    .select('*', { count: 'exact' })
    .order('member_count', { ascending: false })
    .range(from, to);
  
  if (error) {
    if (TABLE_MISSING.includes(error.code)) return { spaces: [], total: 0 };
    throw error;
  }
  
  if (!user) return { spaces: (data || []).map(s => ({ ...s, is_member: false })), total: count || 0 };
  
  const { data: memberships } = await supabase
    .from('space_members')
    .select('space_id, role')
    .eq('user_id', user.id);
  
  const membershipMap = new Map(memberships?.map(m => [m.space_id, m.role]) || []);
  
  return {
    spaces: (data || []).map(space => ({
      ...space,
      is_member: membershipMap.has(space.id),
      member_role: membershipMap.get(space.id) as SpaceMemberRole | undefined,
    })),
    total: count || 0,
  };
}

export async function fetchMySpaces(): Promise<SpaceWithMembership[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  
  const { data: memberships, error: memberError } = await supabase
    .from('space_members')
    .select('space_id, role')
    .eq('user_id', user.id);
  
  if (memberError) throw memberError;
  if (!memberships?.length) return [];
  
  const { data: spaces, error: spaceError } = await supabase
    .from('spaces')
    .select('*')
    .in('id', memberships.map(m => m.space_id))
    .order('member_count', { ascending: false });
  
  if (spaceError) throw spaceError;
  
  const membershipMap = new Map(memberships.map(m => [m.space_id, m.role]));
  
  return (spaces || []).map(space => ({
    ...space,
    is_member: true,
    member_role: membershipMap.get(space.id) as SpaceMemberRole,
  }));
}

export async function fetchSpaceBySlug(slug: string): Promise<SpaceWithMembership | null> {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('spaces')
    .select('*')
    .eq('slug', slug)
    .single();
  
  if (error) {
    if (TABLE_MISSING.includes(error.code)) return null;
    throw error;
  }
  
  if (!user) return { ...data, is_member: false };
  
  const { data: membership } = await supabase
    .from('space_members')
    .select('role')
    .eq('space_id', data.id)
    .eq('user_id', user.id)
    .maybeSingle();
  
  return {
    ...data,
    is_member: !!membership,
    member_role: membership?.role as SpaceMemberRole | undefined,
  };
}

export async function fetchSpaceById(id: string): Promise<SpaceWithMembership | null> {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('spaces')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    if (TABLE_MISSING.includes(error.code)) return null;
    throw error;
  }
  
  if (!user) return { ...data, is_member: false };
  
  const { data: membership } = await supabase
    .from('space_members')
    .select('role')
    .eq('space_id', data.id)
    .eq('user_id', user.id)
    .maybeSingle();
  
  return {
    ...data,
    is_member: !!membership,
    member_role: membership?.role as SpaceMemberRole | undefined,
  };
}

export async function createSpace(
  name: string,
  description: string,
  icon: string,
  spaceType: Space['space_type'],
  visibility: Space['visibility'] = 'public'
): Promise<Space> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  
  const { data: slug, error: slugError } = await supabase
    .rpc('generate_space_slug', { space_name: name });
  
  if (slugError) throw slugError;
  
  const { data: ownerRole } = await supabase.from('roles').select('id').eq('name', 'owner').single();

  const { data, error } = await supabase
    .from('spaces')
    .insert({
      name,
      description,
      icon,
      slug,
      space_type: spaceType,
      visibility,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) throw error;

  const { error: memberError } = await supabase
    .from('space_members')
    .insert({
      space_id: data.id,
      user_id: user.id,
      role: 'owner',
      role_id: ownerRole?.id || null,
    });
  
  if (memberError) throw memberError;
  
  await supabase.rpc('increment_space_members', { space_id: data.id });
  
  return data;
}

export async function joinSpace(spaceId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  
  const { data: memberRole } = await supabase.from('roles').select('id').eq('name', 'member').single();

  const { error } = await supabase
    .from('space_members')
    .insert({
      space_id: spaceId,
      user_id: user.id,
      role: 'member',
      role_id: memberRole?.id || null,
    });
  
  if (error) throw error;
  
  try {
    await supabase.rpc('increment_space_members', { space_id: spaceId });
  } catch {
    // Counter may go stale but don't block the join
  }
}

export async function leaveSpace(spaceId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  
  const { error } = await supabase
    .from('space_members')
    .delete()
    .eq('space_id', spaceId)
    .eq('user_id', user.id);
  
  if (error) throw error;
  
  try {
    await supabase.rpc('decrement_space_members', { space_id: spaceId });
  } catch {
    // Counter may go stale but don't block the leave
  }
}

export async function fetchSpaceMembers(spaceId: string): Promise<SpaceMember[]> {
  const { data, error } = await supabase
    .from('space_members')
    .select('*, user:profiles!space_members_user_id_fkey(id, name, username, avatar)')
    .eq('space_id', spaceId)
    .order('joined_at');
  
  if (error) throw error;
  return data || [];
}

export async function updateSpace(
  spaceId: string,
  updates: Partial<Pick<Space, 'name' | 'description' | 'icon' | 'cover_image' | 'visibility' | 'settings'>>
): Promise<Space> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  
  const hasPermission = await checkUserPermission(spaceId, user.id, 'space.edit');
  if (!hasPermission) throw new Error('Insufficient permissions');
  
  const { data, error } = await supabase
    .from('spaces')
    .update(updates)
    .eq('id', spaceId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteSpace(spaceId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  
  const hasPermission = await checkUserPermission(spaceId, user.id, 'space.delete');
  if (!hasPermission) throw new Error('Insufficient permissions');
  
  const { error } = await supabase
    .from('spaces')
    .delete()
    .eq('id', spaceId);
  
  if (error) throw error;
}

export async function checkUserPermission(
  spaceId: string,
  userId: string,
  permission: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('space_members')
    .select('role_id, roles!inner(permissions)')
    .eq('space_id', spaceId)
    .eq('user_id', userId)
    .single();
  
  if (error || !data) return false;
  
  const role = data.roles as unknown as { permissions: string[] };
  return role.permissions.includes(permission);
}

export async function updateSpaceModules(
  spaceId: string,
  modules: Partial<SpaceModules>
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  
  const hasPermission = await checkUserPermission(spaceId, user.id, 'module.manage');
  if (!hasPermission) throw new Error('Insufficient permissions');
  
  const { data: space } = await supabase
    .from('spaces')
    .select('settings')
    .eq('id', spaceId)
    .single();
  
  if (!space) throw new Error('Space not found');
  
  const currentModules = space.settings?.modules || {};
  const updatedModules = { ...currentModules, ...modules };
  
  const { error } = await supabase
    .from('spaces')
    .update({
      settings: { modules: updatedModules },
    })
    .eq('id', spaceId);
  
  if (error) throw error;
}
