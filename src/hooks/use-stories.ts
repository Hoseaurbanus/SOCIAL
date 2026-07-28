import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchStories, createStory, deleteStory } from '@/api/stories'

export function useStories() {
  return useQuery({
    queryKey: ['stories'],
    queryFn: fetchStories,
  })
}

export function useCreateStory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ mediaUrl, mediaType }: { mediaUrl: string; mediaType: 'image' | 'video' }) =>
      createStory(mediaUrl, mediaType),
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
