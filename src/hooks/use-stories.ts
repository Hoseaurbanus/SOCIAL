import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchStories, createStoryFromDraft, deleteStory, addStoryReaction, removeStoryReaction, markStoryViewed, fetchStoryViews, fetchStoryReactions, replyToStory } from '@/api/stories'
import type { StoryDraft } from '@/components/organisms/story-creator'

export function useStories() {
  return useQuery({
    queryKey: ['stories'],
    queryFn: fetchStories,
  })
}

export function useCreateStory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (draft: StoryDraft) => createStoryFromDraft(draft),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] })
    },
  })
}

export function useDeleteStory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteStory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] })
    },
  })
}

export function useStoryReaction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ storyId, emoji }: { storyId: string; emoji: string }) =>
      addStoryReaction(storyId, emoji),
    onMutate: async ({ storyId }) => {
      await queryClient.cancelQueries({ queryKey: ['stories'] })
      const previous = queryClient.getQueryData(['stories'])
      queryClient.setQueryData(['stories'], (old: any[] | undefined) => {
        if (!old) return old
        return old.map((s: any) => {
          if (s.id !== storyId) return s
          const alreadyReacted = s.has_reacted
          return {
            ...s,
            has_reacted: !alreadyReacted,
            reaction_count: alreadyReacted
              ? Math.max((s.reaction_count || 1) - 1, 0)
              : (s.reaction_count || 0) + 1,
          }
        })
      })
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['stories'], context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] })
    },
  })
}

export function useRemoveStoryReaction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (storyId: string) => removeStoryReaction(storyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] })
    },
  })
}

export function useMarkStoryViewed() {
  return useMutation({
    mutationFn: (storyId: string) => markStoryViewed(storyId),
  })
}

export function useStoryViews(storyId: string) {
  return useQuery({
    queryKey: ['story-views', storyId],
    queryFn: () => fetchStoryViews(storyId),
    enabled: !!storyId,
  })
}

export function useStoryReactions(storyId: string) {
  return useQuery({
    queryKey: ['story-reactions', storyId],
    queryFn: () => fetchStoryReactions(storyId),
    enabled: !!storyId,
  })
}

export function useReplyToStory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ storyId, message }: { storyId: string; message: string }) =>
      replyToStory(storyId, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}
