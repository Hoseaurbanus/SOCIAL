import { supabase } from '@/config/supabase'
import type { Community } from '@/types/api'

export async function fetchCommunities() {
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('communities')
    .select('*')
    .order('member_count', { ascending: false })

  if (error) throw error

  if (!user) return (data || []) as Community[]

  const { data: memberships } = await supabase
    .from('community_members')
    .select('community_id')
    .eq('user_id', user.id)

  const memberIds = new Set(memberships?.map((m) => m.community_id) || [])

  return (data || []).map((c) => ({
    ...c,
    is_member: memberIds.has(c.id),
  })) as Community[]
}

export async function createCommunity(name: string, description: string, icon: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('communities')
    .insert({ name, description, icon, created_by: user.id })
    .select()
    .single()

  if (error) throw error

  await supabase
    .from('community_members')
    .insert({ community_id: data.id, user_id: user.id })

  return data as Community
}

export async function joinCommunity(communityId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('community_members')
    .insert({ community_id: communityId, user_id: user.id })

  if (error) throw error

  await supabase.rpc('increment_community_members', { community_id: communityId })
}

export async function leaveCommunity(communityId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('community_members')
    .delete()
    .eq('community_id', communityId)
    .eq('user_id', user.id)

  if (error) throw error

  await supabase.rpc('decrement_community_members', { community_id: communityId })
}
