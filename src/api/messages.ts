import { supabase } from '@/config/supabase'
import type { Conversation, Message } from '@/types/api'

export async function fetchConversations() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: participations, error: pError } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('user_id', user.id)

  if (pError) throw pError
  if (!participations?.length) return []

  const convIds = participations.map((p) => p.conversation_id)

  const { data: conversations, error: cError } = await supabase
    .from('conversations')
    .select('*')
    .in('id', convIds)
    .order('created_at', { ascending: false })

  if (cError) throw cError

  const results: Conversation[] = []
  for (const conv of conversations || []) {
    const { data: participants } = await supabase
      .from('conversation_participants')
      .select('user:profiles(id, name, username, avatar)')
      .eq('conversation_id', conv.id)
      .neq('user_id', user.id)

    const { data: lastMsg } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conv.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    results.push({
      id: conv.id,
      participants: (participants || []).map((p: any) => p.user),
      lastMessage: lastMsg as Message || undefined,
      updatedAt: conv.created_at,
    })
  }

  return results
}

export async function fetchMessages(conversationId: string) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data || []) as Message[]
}

export async function sendMessage(conversationId: string, content: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content,
    })
    .select()
    .single()

  if (error) throw error
  return data as Message
}

export async function createConversation(otherUserId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: conv, error: convError } = await supabase
    .from('conversations')
    .insert({})
    .select()
    .single()

  if (convError) throw convError

  await supabase.from('conversation_participants').insert([
    { conversation_id: conv.id, user_id: user.id },
    { conversation_id: conv.id, user_id: otherUserId },
  ])

  return conv.id
}

export async function markAsRead(conversationId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .neq('sender_id', user.id)
    .is('read_at', null)
}
