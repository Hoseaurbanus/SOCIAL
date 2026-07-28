import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchFeedPosts, fetchFollowingPosts, fetchPostsByUser, createPost, deletePost, toggleLike, toggleBookmark, checkLikeStatus, checkBookmarkStatus, fetchPostComments, addComment, fetchLikedPosts, fetchBookmarkedPosts, fetchUserReplies, fetchTrendingPosts } from '@/api/posts'

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

export function useFollowingPosts() {
  return useInfiniteQuery({
    queryKey: ['posts', 'following'],
    queryFn: ({ pageParam = 1 }) => fetchFollowingPosts(pageParam),
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.posts.length === 20 ? allPages.length + 1 : undefined
    },
    initialPageParam: 1,
  })
}

export function useTrendingPosts() {
  return useInfiniteQuery({
    queryKey: ['posts', 'trending'],
    queryFn: ({ pageParam = 1 }) => fetchTrendingPosts(pageParam),
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
      await queryClient.cancelQueries({ queryKey: ['likes'] })
      await queryClient.cancelQueries({ queryKey: ['posts'] })

      const previousPosts = queryClient.getQueryData(['posts'])

      queryClient.setQueriesData<Record<string, boolean>>({ queryKey: ['likes'] }, (old) => {
        if (!old) return { [postId]: true }
        return { ...old, [postId]: !old[postId] }
      })

      return { previousPosts }
    },
    onError: (_err, _postId, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(['posts'], context.previousPosts)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['likes'] })
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })
}

export function useToggleBookmark() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: toggleBookmark,
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ['bookmarks'] })
      await queryClient.cancelQueries({ queryKey: ['posts'] })

      queryClient.setQueriesData<Record<string, boolean>>({ queryKey: ['bookmarks'] }, (old) => {
        if (!old) return { [postId]: true }
        return { ...old, [postId]: !old[postId] }
      })

      return {}
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] })
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

export function useDeletePost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deletePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })
}

export function useLikedPosts(userId: string) {
  return useQuery({
    queryKey: ['posts', 'liked', userId],
    queryFn: () => fetchLikedPosts(userId),
    enabled: !!userId,
  })
}

export function useBookmarkedPosts(userId: string) {
  return useQuery({
    queryKey: ['posts', 'bookmarked', userId],
    queryFn: () => fetchBookmarkedPosts(userId),
    enabled: !!userId,
  })
}

export function useUserReplies(userId: string) {
  return useQuery({
    queryKey: ['replies', userId],
    queryFn: () => fetchUserReplies(userId),
    enabled: !!userId,
  })
}
