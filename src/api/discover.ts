import { supabase } from '@/config/supabase'
import type { Post, User } from '@/types/api'

export async function fetchTrendingPosts(page = 1, pageSize = 20) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error } = await supabase
    .from('posts')
    .select('*, user:profiles(id, name, username, avatar)')
    .order('likes_count', { ascending: false })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) throw error
  return (data || []) as Post[]
}

export async function fetchSuggestedUsers(limit = 10) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: follows } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', user.id)

  const followingIds = follows?.map((f) => f.following_id) || []
  followingIds.push(user.id)

  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, username, avatar, bio')
    .not('id', 'in', `(${followingIds.join(',')})`)
    .limit(limit)

  if (error) throw error
  return (data || []) as Pick<User, 'id' | 'name' | 'username' | 'avatar' | 'bio'>[]
}

export async function fetchTrendingTopics() {
  const { data, error } = await supabase
    .from('posts')
    .select('content')
    .order('likes_count', { ascending: false })
    .limit(50)

  if (error) throw error

  const hashtagRegex = /#[\w]+/g
  const counts: Record<string, number> = {}
  data?.forEach((post) => {
    const matches = post.content.match(hashtagRegex)
    matches?.forEach((tag) => {
      const lower = tag.toLowerCase()
      counts[lower] = (counts[lower] || 0) + 1
    })
  })

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([tag, count]) => ({ tag, count }))
}
