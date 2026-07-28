import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { fetchTrendingPosts, fetchSuggestedUsers, fetchTrendingTopics } from '@/api/discover'

export function useTrendingPosts() {
  return useInfiniteQuery({
    queryKey: ['posts', 'trending'],
    queryFn: ({ pageParam = 1 }) => fetchTrendingPosts(pageParam),
    getNextPageParam: (lastPage, allPages) => lastPage.length === 20 ? allPages.length + 1 : undefined,
    initialPageParam: 1,
  })
}

export function useSuggestedUsers() {
  return useQuery({
    queryKey: ['users', 'suggested'],
    queryFn: () => fetchSuggestedUsers(),
  })
}

export function useTrendingTopics() {
  return useQuery({
    queryKey: ['topics', 'trending'],
    queryFn: fetchTrendingTopics,
  })
}
