import { supabase } from '@/config/supabase'
import { createNotification } from '@/api/notifications'
import type { Post, LinkPreview } from '@/types/api'

export async function fetchFeedPosts(page = 1, pageSize = 20) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await supabase
    .from('posts')
    .select('*, user:profiles!posts_user_id_fkey(id, name, username, avatar)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) {
    if (error.code === '42P01' || error.code === '42501' || error.code === 'PGRST301') return { posts: [], total: 0 }
    throw error
  }
  return { posts: (data || []) as Post[], total: count || 0 }
}

const TABLE_MISSING = ['42P01', '42501', 'PGRST301']

export async function fetchPostsByUser(userId: string, page = 1, pageSize = 20) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await supabase
    .from('posts')
    .select('*, user:profiles!posts_user_id_fkey(id, name, username, avatar)', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) {
    if (TABLE_MISSING.includes(error.code)) return { posts: [], total: 0 }
    throw error
  }
  return { posts: (data || []) as Post[], total: count || 0 }
}

export async function fetchFollowingPosts(page = 1, pageSize = 20) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: follows, error: followError } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', user.id)

  if (followError && TABLE_MISSING.includes(followError.code)) return { posts: [], total: 0 }

  const followingIds = follows?.map((f) => f.following_id) || []
  if (followingIds.length === 0) return { posts: [], total: 0 }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await supabase
    .from('posts')
    .select('*, user:profiles!posts_user_id_fkey(id, name, username, avatar)', { count: 'exact' })
    .in('user_id', followingIds)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) {
    if (TABLE_MISSING.includes(error.code)) return { posts: [], total: 0 }
    throw error
  }
  return { posts: (data || []) as Post[], total: count || 0 }
}

export async function createPost(content: string, images?: string[], videoUrl?: string, linkPreview?: LinkPreview, communityId?: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const insertData: Record<string, any> = { user_id: user.id, content }
  if (images && images.length > 0) insertData.images = images
  if (videoUrl) insertData.video_url = videoUrl
  if (linkPreview) insertData.link_preview = linkPreview
  if (communityId) insertData.community_id = communityId

  const { data, error } = await supabase
    .from('posts')
    .insert(insertData)
    .select('*, user:profiles!posts_user_id_fkey(id, name, username, avatar)')
    .single()

  if (error) throw error
  return data as Post
}

export async function deletePost(postId: string) {
  const { error } = await supabase.from('posts').delete().eq('id', postId)
  if (error) throw error
}

export async function toggleLike(postId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: existing } = await supabase
    .from('likes')
    .select()
    .eq('user_id', user.id)
    .eq('post_id', postId)
    .single()

  if (existing) {
    await supabase.from('likes').delete().eq('user_id', user.id).eq('post_id', postId)
    await supabase.rpc('decrement_likes', { post_id: postId })
    return false
  } else {
    await supabase.from('likes').insert({ user_id: user.id, post_id: postId })
    await supabase.rpc('increment_likes', { post_id: postId })
    const { data: post } = await supabase.from('posts').select('user_id').eq('id', postId).single()
    if (post) await createNotification(post.user_id, user.id, 'like', postId, 'liked your post')
    return true
  }
}

export async function toggleBookmark(postId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: existing } = await supabase
    .from('bookmarks')
    .select()
    .eq('user_id', user.id)
    .eq('post_id', postId)
    .single()

  if (existing) {
    await supabase.from('bookmarks').delete().eq('user_id', user.id).eq('post_id', postId)
    return false
  } else {
    await supabase.from('bookmarks').insert({ user_id: user.id, post_id: postId })
    return true
  }
}

export async function fetchPostComments(postId: string) {
  const { data, error } = await supabase
    .from('comments')
    .select('*, user:profiles!posts_user_id_fkey(id, name, username, avatar)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })

  if (error) {
    if (TABLE_MISSING.includes(error.code)) return []
    throw error
  }
  return data || []
}

export async function addComment(postId: string, content: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('comments')
    .insert({ post_id: postId, user_id: user.id, content })
    .select('*, user:profiles!posts_user_id_fkey(id, name, username, avatar)')
    .single()

  if (error) throw error

  await supabase.rpc('increment_comments', { post_id: postId })
  const { data: post } = await supabase.from('posts').select('user_id').eq('id', postId).single()
  if (post) await createNotification(post.user_id, user.id, 'comment', postId, 'commented on your post')
  return data
}

export async function deleteComment(commentId: string, postId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId)
    .eq('user_id', user.id)

  if (error) throw error

  await supabase.rpc('decrement_comments', { post_id: postId })
}

export async function checkLikeStatus(postIds: string[]) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return {}

  const { data, error } = await supabase
    .from('likes')
    .select('post_id')
    .eq('user_id', user.id)
    .in('post_id', postIds)

  if (error && TABLE_MISSING.includes(error.code)) return {}
  const liked: Record<string, boolean> = {}
  data?.forEach((l) => { liked[l.post_id] = true })
  return liked
}

export async function checkBookmarkStatus(postIds: string[]) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return {}

  const { data, error } = await supabase
    .from('bookmarks')
    .select('post_id')
    .eq('user_id', user.id)
    .in('post_id', postIds)

  if (error && TABLE_MISSING.includes(error.code)) return {}
  const bookmarked: Record<string, boolean> = {}
  data?.forEach((b) => { bookmarked[b.post_id] = true })
  return bookmarked
}

export async function fetchLikedPosts(userId: string, page = 1, pageSize = 20) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data: likes, error: likesError, count } = await supabase
    .from('likes')
    .select('post_id', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (likesError) throw likesError
  if (!likes?.length) return { posts: [] as Post[], total: count || 0 }

  const postIds = likes.map((l) => l.post_id)

  const { data, error } = await supabase
    .from('posts')
    .select('*, user:profiles!posts_user_id_fkey(id, name, username, avatar)')
    .in('id', postIds)

  if (error) throw error
  return { posts: (data || []) as Post[], total: count || 0 }
}

export async function fetchBookmarkedPosts(userId: string, page = 1, pageSize = 20) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data: bookmarks, error: bookmarksError, count } = await supabase
    .from('bookmarks')
    .select('post_id', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (bookmarksError) throw bookmarksError
  if (!bookmarks?.length) return { posts: [] as Post[], total: count || 0 }

  const postIds = bookmarks.map((b) => b.post_id)

  const { data, error } = await supabase
    .from('posts')
    .select('*, user:profiles!posts_user_id_fkey(id, name, username, avatar)')
    .in('id', postIds)

  if (error) throw error
  return { posts: (data || []) as Post[], total: count || 0 }
}

export async function fetchUserReplies(userId: string, page = 1, pageSize = 20) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await supabase
    .from('comments')
    .select('*, commenter:profiles!comments_user_id_fkey(id, name, username, avatar), post:posts(id, content, user_id, user:profiles!posts_user_id_fkey(id, name, username, avatar))', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) {
    if (TABLE_MISSING.includes(error.code)) return { posts: [] as any[], total: 0 }
    throw error
  }
  return { posts: (data || []) as any[], total: count || 0 }
}

export async function fetchTrendingPosts(page = 1, pageSize = 20) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await supabase
    .from('posts')
    .select('*, user:profiles!posts_user_id_fkey(id, name, username, avatar)', { count: 'exact' })
    .order('likes_count', { ascending: false })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) {
    if (TABLE_MISSING.includes(error.code)) return { posts: [], total: 0 }
    throw error
  }
  return { posts: (data || []) as Post[], total: count || 0 }
}

export async function fetchPostById(postId: string) {
  const { data, error } = await supabase
    .from('posts')
    .select('*, user:profiles!posts_user_id_fkey(id, name, username, avatar)')
    .eq('id', postId)
    .single()

  if (error) {
    if (TABLE_MISSING.includes(error.code)) return null
    throw error
  }
  return data as Post
}

export async function fetchCommunityPosts(page = 1, pageSize = 20) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { posts: [] as Post[], total: 0 }

  const { data: memberships, error: mError } = await supabase
    .from('community_members')
    .select('community_id')
    .eq('user_id', user.id)

  if (mError) {
    if (TABLE_MISSING.includes(mError.code)) return { posts: [], total: 0 }
    throw mError
  }

  const communityIds = memberships?.map((m) => m.community_id) || []
  if (communityIds.length === 0) return { posts: [], total: 0 }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await supabase
    .from('posts')
    .select('*, user:profiles!posts_user_id_fkey(id, name, username, avatar)', { count: 'exact' })
    .in('community_id', communityIds)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) {
    if (TABLE_MISSING.includes(error.code)) return { posts: [], total: 0 }
    throw error
  }
  return { posts: (data || []) as Post[], total: count || 0 }
}

export async function fetchPostsByCommunityId(communityId: string, page = 1, pageSize = 20) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await supabase
    .from('posts')
    .select('*, user:profiles!posts_user_id_fkey(id, name, username, avatar)', { count: 'exact' })
    .eq('community_id', communityId)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) {
    if (TABLE_MISSING.includes(error.code)) return { posts: [], total: 0 }
    throw error
  }
  return { posts: (data || []) as Post[], total: count || 0 }
}

export async function fetchForYouPosts(page = 1, pageSize = 20) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return fetchFeedPosts(page, pageSize)

  // Get followed user IDs
  const { data: follows } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', user.id)
  const followingIds = follows?.map((f) => f.following_id) || []

  // Get joined community IDs
  const { data: memberships } = await supabase
    .from('community_members')
    .select('community_id')
    .eq('user_id', user.id)
  const communityIds = memberships?.map((m) => m.community_id) || []

  if (followingIds.length === 0 && communityIds.length === 0) return { posts: [] as Post[], total: 0 }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  // Build OR filter: posts from followed users OR from joined communities
  const conditions: string[] = []
  if (followingIds.length > 0) conditions.push(`user_id.in.(${followingIds.join(',')})`)
  if (communityIds.length > 0) conditions.push(`community_id.in.(${communityIds.join(',')})`)

  const { data, error, count } = await supabase
    .from('posts')
    .select('*, user:profiles!posts_user_id_fkey(id, name, username, avatar)', { count: 'exact' })
    .or(conditions.join(','))
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) {
    if (TABLE_MISSING.includes(error.code)) return { posts: [], total: 0 }
    throw error
  }
  return { posts: (data || []) as Post[], total: count || 0 }
}
