import { supabase } from '@/config/supabase'
import { createNotification } from '@/api/notifications'
import type { Conversation, Message } from '@/types/api'

export async function fetchConversations() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Step 1: Get all conversation IDs the user belongs to
  const { data: participations, error: pError } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('user_id', user.id)

  if (pError) {
    if (pError.code === '42P01' || pError.code === '42501') return []
    throw pError
  }
  if (!participations?.length) return []

  const convIds = participations.map((p) => p.conversation_id)

  // Step 2: Get conversations
  const { data: conversations, error: cError } = await supabase
    .from('conversations')
    .select('id, created_at')
    .in('id', convIds)
    .order('created_at', { ascending: false })

  if (cError) {
    if (cError.code === '42P01') return []
    throw cError
  }

  // Step 3: Get all participants for these conversations
  const { data: allParticipants } = await supabase
    .from('conversation_participants')
    .select('conversation_id, user_id')
    .in('conversation_id', convIds)

  // Step 4: Get profiles for all participant user IDs
  const participantUserIds = [...new Set((allParticipants || []).map((p) => p.user_id))]
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name, username, avatar')
    .in('id', participantUserIds)

  const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]))

  // Step 5: Get last message for each conversation
  const { data: lastMessages } = await supabase
    .from('messages')
    .select('*')
    .in('conversation_id', convIds)
    .order('created_at', { ascending: false })
    .limit(convIds.length)

  const lastMsgMap = new Map<string, Message>()
  lastMessages?.forEach((msg) => {
    if (!lastMsgMap.has(msg.conversation_id)) {
      lastMsgMap.set(msg.conversation_id, msg as Message)
    }
  })

  // Build results
  const results: Conversation[] = (conversations || []).map((conv: any) => {
    const convParticipants = (allParticipants || [])
      .filter((p) => p.conversation_id === conv.id && p.user_id !== user.id)
      .map((p) => profileMap.get(p.user_id))
      .filter(Boolean)
    const lastMsg = lastMsgMap.get(conv.id)
    return {
      id: conv.id,
      participants: convParticipants,
      lastMessage: lastMsg,
      updatedAt: lastMsg?.created_at || conv.created_at,
    }
  })

  return results
}

export async function fetchMessages(conversationId: string) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (error) {
    if (error.code === '42P01') return []
    throw error
  }
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
  const { data: participants } = await supabase
    .from('conversation_participants')
    .select('user_id')
    .eq('conversation_id', conversationId)
    .neq('user_id', user.id)

  if (participants) {
    for (const p of participants) {
      await createNotification(p.user_id, user.id, 'message', undefined, 'sent you a message')
    }
  }
  return data as Message
}

export async function createConversation(otherUserId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Check for existing conversation between these two users
  const { data: myParticipations } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('user_id', user.id)

  if (myParticipations?.length) {
    const myConvIds = myParticipations.map((p) => p.conversation_id)
    const { data: existing } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', otherUserId)
      .in('conversation_id', myConvIds)
      .limit(1)
      .maybeSingle()

    if (existing) return existing.conversation_id
  }

  // Create new conversation
  const { data: conv, error: convError } = await supabase
    .from('conversations')
    .insert({})
    .select()
    .single()

  if (convError) throw convError

  const { error: partError } = await supabase.from('conversation_participants').insert([
    { conversation_id: conv.id, user_id: user.id },
    { conversation_id: conv.id, user_id: otherUserId },
  ])

  if (partError) throw partError

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
