import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchStories, createStoryFromDraft, deleteStory, addStoryReaction, removeStoryReaction, markStoryViewed, fetchStoryViews, fetchStoryReactions } from '@/api/stories'
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
    onSuccess: () => {
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
