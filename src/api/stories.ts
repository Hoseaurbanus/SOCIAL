import { supabase } from '@/config/supabase'
import type { Story } from '@/types/api'

export async function fetchStories() {
  const { data, error } = await supabase
    .from('stories')
    .select('*, user:profiles(id, name, username, avatar)')
    .gte('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data || []) as Story[]
}

export async function createStory(mediaUrl: string, mediaType: 'image' | 'video') {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from('stories')
    .insert({
      user_id: user.id,
      media_url: mediaUrl,
      media_type: mediaType,
      expires_at: expiresAt,
    })
    .select('*, user:profiles(id, name, username, avatar)')
    .single()

  if (error) throw error
  return data as Story
}

export async function deleteStory(storyId: string) {
  const { error } = await supabase.from('stories').delete().eq('id', storyId)
  if (error) throw error
}
