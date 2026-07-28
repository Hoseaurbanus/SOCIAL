import { supabase } from '@/config/supabase'
import type { Story } from '@/types/api'
import type { StoryDraft } from '@/components/organisms/story-creator'

export async function fetchStories() {
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('stories')
    .select('*, user:profiles(id, name, username, avatar)')
    .gte('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  if (error) throw error

  const stories = (data || []) as Story[]

  if (user && stories.length > 0) {
    const storyIds = stories.map((s) => s.id)
    const { data: views } = await supabase
      .from('story_views')
      .select('story_id')
      .eq('user_id', user.id)
      .in('story_id', storyIds)

    const viewedIds = new Set(views?.map((v) => v.story_id) || [])
    return stories.map((s) => ({
      ...s,
      has_viewed: viewedIds.has(s.id),
    }))
  }

  return stories
}

export async function createStoryFromDraft(draft: StoryDraft): Promise<Story> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  let mediaUrl: string | null = null
  let mediaType = draft.mode === 'video' ? 'video' : draft.mode === 'image' ? 'image' : 'text'

  if (draft.mediaFile) {
    const fileExt = draft.mediaFile.name.split('.').pop()
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
    const filePath = `stories/${fileName}`
    const bucket = draft.mode === 'video' ? 'stories' : 'stories'
    const { error } = await supabase.storage.from(bucket).upload(filePath, draft.mediaFile)
    if (error) throw error
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath)
    mediaUrl = urlData.publicUrl
  }

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  const insertData: Record<string, any> = {
    user_id: user.id,
    media_type: mediaType,
    media_url: mediaUrl,
    text_content: draft.content || null,
    background_style: draft.backgroundImage ? { type: draft.backgroundImage.startsWith('linear') ? 'gradient' : 'solid', value: draft.backgroundImage } : null,
    text_color: draft.textColor || '#FFFFFF',
    font_style: draft.fontStyle || 'sans',
    music_url: draft.musicUrl || null,
    music_title: draft.musicTitle || null,
    stickers: draft.stickers || [],
    text_overlays: draft.textOverlays || [],
    expires_at: expiresAt,
  }

  const { data, error } = await supabase
    .from('stories')
    .insert(insertData)
    .select('*, user:profiles(id, name, username, avatar)')
    .single()

  if (error) throw error
  return data as Story
}

export async function deleteStory(storyId: string) {
  const { error } = await supabase.from('stories').delete().eq('id', storyId)
  if (error) throw error
}

export async function addStoryReaction(storyId: string, emoji: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: existing } = await supabase
    .from('story_reactions')
    .select('id')
    .eq('story_id', storyId)
    .eq('user_id', user.id)
    .single()

  if (existing) {
    await supabase.from('story_reactions').delete().eq('id', existing.id)
    await supabase.rpc('decrement_story_reactions', { story_id: storyId })
    return false
  }

  const { error } = await supabase
    .from('story_reactions')
    .insert({ story_id: storyId, user_id: user.id, emoji })

  if (error) throw error
  await supabase.rpc('increment_story_reactions', { story_id: storyId })
  return true
}

export async function removeStoryReaction(storyId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('story_reactions')
    .delete()
    .eq('story_id', storyId)
    .eq('user_id', user.id)

  await supabase.rpc('decrement_story_reactions', { story_id: storyId })
}

export async function markStoryViewed(storyId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { error } = await supabase
    .from('story_views')
    .insert({ story_id: storyId, user_id: user.id })
    .select()
    .maybeSingle()

  if (!error) {
    await supabase.rpc('increment_story_views', { story_id: storyId })
  }
}

export async function fetchStoryViews(storyId: string) {
  const { data, error } = await supabase
    .from('story_views')
    .select('user:profiles(id, name, username, avatar), viewed_at')
    .eq('story_id', storyId)
    .order('viewed_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function fetchStoryReactions(storyId: string) {
  const { data, error } = await supabase
    .from('story_reactions')
    .select('emoji, user:profiles(id, name, username, avatar)')
    .eq('story_id', storyId)

  if (error) throw error
  return data || []
}
