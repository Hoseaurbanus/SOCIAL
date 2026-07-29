import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useCallback } from 'react'
import { fetchConversations, fetchMessages, sendMessage, createConversation, markAsRead } from '@/api/messages'
import { supabase } from '@/config/supabase'
import { useAuthStore } from '@/stores/auth-store'
import type { Message } from '@/types/api'

export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: fetchConversations,
    retry: false,
  })
}

export function useMessages(conversationId: string) {
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => fetchMessages(conversationId),
    enabled: !!conversationId,
  })
}

export function useSendMessage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ conversationId, content }: { conversationId: string; content: string }) =>
      sendMessage(conversationId, content),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.conversationId] })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}

export function useCreateConversation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (otherUserId: string) => createConversation(otherUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}

export function useMarkAsRead() {
  return useMutation({ mutationFn: markAsRead })
}

export function useRealtimeMessages(
  conversationId: string,
  onNewMessage: (msg: Message) => void
) {
  const stableCallback = useCallback((msg: Message) => {
    onNewMessage(msg)
  }, [onNewMessage])

  useEffect(() => {
    if (!conversationId) return

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          stableCallback(payload.new as Message)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId, stableCallback])
}

export function useRealtimeConversations() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel('messages-listener')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['conversations'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])
}

export function useUnreadMessageCount() {
  const user = useAuthStore((s) => s.user)
  return useQuery({
    queryKey: ['unread-messages'],
    queryFn: async () => {
      if (!user) return 0
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('read', false)
        .neq('sender_id', user.id)
      return count || 0
    },
    enabled: !!user,
    refetchInterval: 30000,
    retry: false,
  })
}
