import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchFeedPosts, fetchPostsByUser, createPost, toggleLike, toggleBookmark, checkLikeStatus, checkBookmarkStatus, fetchPostComments, addComment } from '@/api/posts'

export function useFeedPosts() {
  return useInfiniteQuery({
    queryKey: ['posts', 'feed'],
    queryFn: ({ pageParam = 1 }) => fetchFeedPosts(pageParam),
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.posts.length === 20 ? allPages.length + 1 : undefined
    },
    initialPageParam: 1,
  })
}

export function useUserPosts(userId: string) {
  return useInfiniteQuery({
    queryKey: ['posts', 'user', userId],
    queryFn: ({ pageParam = 1 }) => fetchPostsByUser(userId, pageParam),
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.posts.length === 20 ? allPages.length + 1 : undefined
    },
    initialPageParam: 1,
    enabled: !!userId,
  })
}

export function useCreatePost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ content, images }: { content: string; images?: string[] }) => createPost(content, images),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })
}

export function useToggleLike() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: toggleLike,
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ['posts'] })
      return { postId }
    },
  })
}

export function useToggleBookmark() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: toggleBookmark,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })
}

export function usePostComments(postId: string) {
  return useQuery({
    queryKey: ['comments', postId],
    queryFn: () => fetchPostComments(postId),
    enabled: !!postId,
  })
}

export function useAddComment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ postId, content }: { postId: string; content: string }) => addComment(postId, content),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.postId] })
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })
}

export function useLikeStatus(postIds: string[]) {
  return useQuery({
    queryKey: ['likes', postIds],
    queryFn: () => checkLikeStatus(postIds),
    enabled: postIds.length > 0,
  })
}

export function useBookmarkStatus(postIds: string[]) {
  return useQuery({
    queryKey: ['bookmarks', postIds],
    queryFn: () => checkBookmarkStatus(postIds),
    enabled: postIds.length > 0,
  })
}
