import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchFeedPosts, fetchFollowingPosts, fetchPostsByUser, createPost, deletePost, toggleLike, toggleBookmark, checkLikeStatus, checkBookmarkStatus, fetchPostComments, addComment, deleteComment, fetchLikedPosts, fetchBookmarkedPosts, fetchUserReplies, fetchTrendingPosts, fetchPostById, fetchCommunityPosts } from '@/api/posts'
import { useToast } from '@/hooks/use-toast'

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

export function useCommunityPosts() {
  return useInfiniteQuery({
    queryKey: ['posts', 'community'],
    queryFn: ({ pageParam = 1 }) => fetchCommunityPosts(pageParam),
    getNextPageParam: (lastPage, allPages) => {
      const loadedPosts = allPages.reduce((acc, page) => acc + page.posts.length, 0)
      return loadedPosts < lastPage.total ? allPages.length + 1 : undefined
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
    mutationFn: ({ content, images, videoUrl, linkPreview }: { content: string; images?: string[]; videoUrl?: string; linkPreview?: any }) =>
      createPost(content, images, videoUrl, linkPreview),
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

      const previousPosts = queryClient.getQueriesData({ queryKey: ['posts'] })

      queryClient.setQueriesData<Record<string, boolean>>({ queryKey: ['likes'] }, (old) => {
        if (!old) return { [postId]: true }
        return { ...old, [postId]: !old[postId] }
      })

      queryClient.setQueriesData({ queryKey: ['posts'] }, (old: any) => {
        if (!old) return old
        if (old.pages) {
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              posts: (page.posts || page).map((post: any) =>
                post.id === postId
                  ? { ...post, likes_count: post.likes_count + (old && queryClient.getQueryData<Record<string, boolean>>(['likes'])?.[postId] ? -1 : 1) }
                  : post
              ),
            })),
          }
        }
        return old
      })

      return { previousPosts }
    },
    onError: (_err, _postId, context) => {
      if (context?.previousPosts) {
        context.previousPosts.forEach(([key, data]) => {
          queryClient.setQueryData(key, data)
        })
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

      const previousBookmarks = queryClient.getQueryData<Record<string, boolean>>(['bookmarks'])

      queryClient.setQueriesData<Record<string, boolean>>({ queryKey: ['bookmarks'] }, (old) => {
        if (!old) return { [postId]: true }
        return { ...old, [postId]: !old[postId] }
      })

      return { previousBookmarks }
    },
    onError: (_err, _postId, context) => {
      if (context?.previousBookmarks) {
        queryClient.setQueryData(['bookmarks'], context.previousBookmarks)
      }
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

export function useDeleteComment(postId: string) {
  const queryClient = useQueryClient()
  const toast = useToast((s) => s.toast)

  return useMutation({
    mutationFn: ({ commentId }: { commentId: string }) => deleteComment(commentId, postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] })
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      toast({ title: 'Comment deleted', variant: 'success' })
    },
    onError: () => {
      toast({ title: 'Failed to delete comment', variant: 'error' })
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
  return useInfiniteQuery({
    queryKey: ['posts', 'liked', userId],
    queryFn: ({ pageParam = 1 }) => fetchLikedPosts(userId, pageParam),
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.posts.length === 20 ? allPages.length + 1 : undefined
    },
    initialPageParam: 1,
    enabled: !!userId,
  })
}

export function useBookmarkedPosts(userId: string) {
  return useInfiniteQuery({
    queryKey: ['posts', 'bookmarked', userId],
    queryFn: ({ pageParam = 1 }) => fetchBookmarkedPosts(userId, pageParam),
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.posts.length === 20 ? allPages.length + 1 : undefined
    },
    initialPageParam: 1,
    enabled: !!userId,
  })
}

export function useUserReplies(userId: string) {
  return useInfiniteQuery({
    queryKey: ['replies', userId],
    queryFn: ({ pageParam = 1 }) => fetchUserReplies(userId, pageParam),
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.posts.length === 20 ? allPages.length + 1 : undefined
    },
    initialPageParam: 1,
    enabled: !!userId,
  })
}

export function usePostById(postId: string) {
  return useQuery({
    queryKey: ['posts', postId],
    queryFn: () => fetchPostById(postId),
    enabled: !!postId,
  })
}
