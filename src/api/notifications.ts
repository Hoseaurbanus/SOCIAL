import { supabase } from '@/config/supabase'
import type { Notification } from '@/types/api'

export async function fetchNotifications(page = 1, pageSize = 20) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await supabase
    .from('notifications')
    .select('*, from_user:profiles!notifications_from_user_id_fkey(id, name, username, avatar)', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) {
    if (error.code === '42P01') return { notifications: [], total: 0 }
    throw error
  }
  return { notifications: (data || []) as Notification[], total: count || 0 }
}

export async function markNotificationRead(notificationId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)

  if (error) {
    if (error.code === '42P01') return
    throw error
  }
}

export async function markAllNotificationsRead() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  if (error) {
    if (error.code === '42P01') return
    throw error
  }
}

export async function getUnreadCount() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  if (error) {
    if (error.code === '42P01') return 0
    throw error
  }
  return count || 0
}

export async function createNotification(userId: string, fromUserId: string, type: 'like' | 'comment' | 'follow' | 'mention' | 'message', postId?: string, message?: string) {
  if (userId === fromUserId) return

  const { error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      from_user_id: fromUserId,
      type,
      post_id: postId || null,
      message: message || '',
    })

  if (error && (error.code === '42P01' || error.code === '42501')) return
  if (error) console.error('Failed to create notification:', error)
}
