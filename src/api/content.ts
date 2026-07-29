import { supabase } from '@/config/supabase';
import type { ContentItem, ContentType, ContentVisibility, Reaction, Comment } from '@/types/content';

const TABLE_MISSING = ['42P01', '42501', 'PGRST301'];

export async function createContentItem(params: {
  body: string;
  contentType?: ContentType;
  spaceId?: string;
  title?: string;
  media?: ContentItem['media'];
  visibility?: ContentVisibility;
  metadata?: Record<string, unknown>;
}): Promise<ContentItem> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('content_items')
    .insert({
      author_id: user.id,
      space_id: params.spaceId || null,
      content_type: params.contentType || 'post',
      title: params.title || null,
      body: params.body,
      media: params.media || [],
      visibility: params.visibility || 'public',
      metadata: params.metadata || {},
    })
    .select('*, author:profiles!content_items_author_id_fkey(id, name, username, avatar)')
    .single();

  if (error) throw error;
  return data;
}

export async function fetchContentItems(params: {
  page?: number;
  pageSize?: number;
  spaceId?: string;
  contentType?: ContentType;
  authorId?: string;
}): Promise<{ items: ContentItem[]; total: number }> {
  const { page = 1, pageSize = 20, spaceId, contentType, authorId } = params;

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('content_items')
    .select('*, author:profiles!content_items_author_id_fkey(id, name, username, avatar)', { count: 'exact' });

  if (spaceId) query = query.eq('space_id', spaceId);
  if (contentType) query = query.eq('content_type', contentType);
  if (authorId) query = query.eq('author_id', authorId);

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    if (TABLE_MISSING.includes(error.code)) return { items: [], total: 0 };
    throw error;
  }

  return { items: data || [], total: count || 0 };
}

export async function fetchContentItemById(id: string): Promise<ContentItem | null> {
  const { data, error } = await supabase
    .from('content_items')
    .select('*, author:profiles!content_items_author_id_fkey(id, name, username, avatar)')
    .eq('id', id)
    .single();

  if (error) {
    if (TABLE_MISSING.includes(error.code)) return null;
    throw error;
  }

  return data;
}

export async function updateContentItem(
  id: string,
  updates: Partial<Pick<ContentItem, 'title' | 'body' | 'media' | 'visibility' | 'is_pinned' | 'is_locked' | 'metadata'>>
): Promise<ContentItem> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('content_items')
    .update(updates)
    .eq('id', id)
    .eq('author_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteContentItem(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('content_items')
    .delete()
    .eq('id', id)
    .eq('author_id', user.id);

  if (error) throw error;
}

export async function toggleReaction(
  contentItemId: string,
  emoji: string = '👍'
): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: existing } = await supabase
    .from('reactions')
    .select('id')
    .eq('content_item_id', contentItemId)
    .eq('user_id', user.id)
    .eq('emoji', emoji)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('reactions')
      .delete()
      .eq('id', existing.id);

    if (error) throw error;

    try {
      await supabase.rpc('decrement_content_reactions', { content_item_id: contentItemId });
    } catch {
      // Counter may go stale but don't block the reaction
    }
    return false;
  } else {
    const { error } = await supabase
      .from('reactions')
      .insert({
        content_item_id: contentItemId,
        user_id: user.id,
        emoji,
      });

    if (error) throw error;

    try {
      await supabase.rpc('increment_content_reactions', { content_item_id: contentItemId });
    } catch {
      // Counter may go stale but don't block the reaction
    }
    return true;
  }
}

export async function fetchReactions(contentItemId: string): Promise<Reaction[]> {
  const { data, error } = await supabase
    .from('reactions')
    .select('*, user:profiles!reactions_user_id_fkey(id, name, username, avatar)')
    .eq('content_item_id', contentItemId)
    .order('created_at');

  if (error) throw error;
  return data || [];
}

export async function checkReactionStatus(
  contentItemIds: string[],
  emoji?: string
): Promise<Record<string, boolean>> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return {};

  let query = supabase
    .from('reactions')
    .select('content_item_id')
    .eq('user_id', user.id)
    .in('content_item_id', contentItemIds);

  if (emoji) query = query.eq('emoji', emoji);

  const { data, error } = await query;

  if (error) {
    if (TABLE_MISSING.includes(error.code)) return {};
    throw error;
  }

  const reactionMap: Record<string, boolean> = {};
  data?.forEach(r => { reactionMap[r.content_item_id] = true; });
  return reactionMap;
}

export async function fetchContentFeed(params: {
  page?: number;
  pageSize?: number;
  userId: string;
}): Promise<{ items: ContentItem[]; total: number }> {
  const { page = 1, pageSize = 20, userId } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // Get joined space IDs
  const { data: memberships } = await supabase
    .from('space_members')
    .select('space_id')
    .eq('user_id', userId);

  const spaceIds = memberships?.map(m => m.space_id) || [];

  // Get followed user IDs
  const { data: follows } = await supabase
    .from('relationships')
    .select('target_id')
    .eq('source_user_id', userId)
    .eq('relationship_type', 'follow');

  const followedIds = follows?.map(f => f.target_id) || [];

  if (spaceIds.length === 0 && followedIds.length === 0) {
    return { items: [], total: 0 };
  }

  let query = supabase
    .from('content_items')
    .select('*, author:profiles!content_items_author_id_fkey(id, name, username, avatar)', { count: 'exact' })
    .or(`space_id.in.(${spaceIds.join(',')}),author_id.in.(${followedIds.join(',')})`)
    .order('created_at', { ascending: false });

  const { data, error, count } = await query.range(from, to);

  if (error) {
    if (TABLE_MISSING.includes(error.code)) return { items: [], total: 0 };
    throw error;
  }

  return { items: data || [], total: count || 0 };
}

// ============================================================
// Comments (comments_v2)
// ============================================================

export async function createComment(
  contentItemId: string,
  body: string,
  parentCommentId?: string
): Promise<Comment> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('comments_v2')
    .insert({
      content_item_id: contentItemId,
      author_id: user.id,
      parent_comment_id: parentCommentId || null,
      body,
    })
    .select('*, author:profiles!comments_v2_author_id_fkey(id, name, username, avatar)')
    .single();

  if (error) throw error;

  try {
    await supabase.rpc('increment_content_comments', { content_item_id: contentItemId });
  } catch {
    // Counter may go stale
  }

  return data;
}

export async function fetchComments(contentItemId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('comments_v2')
    .select('*, author:profiles!comments_v2_author_id_fkey(id, name, username, avatar)')
    .eq('content_item_id', contentItemId)
    .eq('is_deleted', false)
    .order('created_at');

  if (error) throw error;
  return data || [];
}

export async function deleteComment(commentId: string, contentItemId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('comments_v2')
    .update({ is_deleted: true })
    .eq('id', commentId)
    .eq('author_id', user.id);

  if (error) throw error;

  try {
    await supabase.rpc('decrement_content_comments', { content_item_id: contentItemId });
  } catch {
    // Counter may go stale
  }
}
