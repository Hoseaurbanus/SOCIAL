import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchContentItems,
  fetchContentItemById,
  fetchContentFeed,
  createContentItem,
  updateContentItem,
  deleteContentItem,
  toggleReaction,
  checkReactionStatus,
} from '@/api/content';
import type { ContentItem, ContentType, ContentVisibility } from '@/types/content';

export function useContentItems(params: {
  page?: number;
  pageSize?: number;
  spaceId?: string;
  contentType?: ContentType;
  authorId?: string;
}) {
  return useQuery({
    queryKey: ['content-items', params],
    queryFn: () => fetchContentItems(params),
    staleTime: 30000,
  });
}

export function useContentFeed(userId: string) {
  return useQuery({
    queryKey: ['content-items', 'feed', userId],
    queryFn: () => fetchContentFeed({ userId, pageSize: 50 }),
    staleTime: 30000,
    enabled: !!userId,
  });
}

export function useContentItem(id: string) {
  return useQuery({
    queryKey: ['content-items', id],
    queryFn: () => fetchContentItemById(id),
    staleTime: 30000,
    enabled: !!id,
  });
}

export function useCreateContentItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (params: {
      body: string;
      contentType?: ContentType;
      spaceId?: string;
      title?: string;
      media?: ContentItem['media'];
      visibility?: ContentVisibility;
      metadata?: Record<string, unknown>;
    }) => createContentItem(params),
    onSuccess: (_, params) => {
      queryClient.invalidateQueries({ queryKey: ['content-items'] });
      if (params.spaceId) {
        queryClient.invalidateQueries({ queryKey: ['content-items', { spaceId: params.spaceId }] });
      }
    },
  });
}

export function useUpdateContentItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Pick<ContentItem, 'title' | 'body' | 'media' | 'visibility' | 'is_pinned' | 'is_locked' | 'metadata'>>;
    }) => updateContentItem(id, updates),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['content-items'] });
      queryClient.invalidateQueries({ queryKey: ['content-items', id] });
    },
  });
}

export function useDeleteContentItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => deleteContentItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-items'] });
    },
  });
}

export function useToggleReaction() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({
      contentItemId,
      emoji,
    }: {
      contentItemId: string;
      emoji?: string;
    }) => toggleReaction(contentItemId, emoji),
    onSuccess: (_, { contentItemId }) => {
      queryClient.invalidateQueries({ queryKey: ['content-items'] });
      queryClient.invalidateQueries({ queryKey: ['content-items', contentItemId] });
    },
  });
}

export function useReactionStatus(contentItemIds: string[], emoji?: string) {
  return useQuery({
    queryKey: ['reactions', 'status', contentItemIds, emoji],
    queryFn: () => checkReactionStatus(contentItemIds, emoji),
    staleTime: 30000,
    enabled: contentItemIds.length > 0,
  });
}
