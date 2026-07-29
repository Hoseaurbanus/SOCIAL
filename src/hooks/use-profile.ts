import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchProfile, fetchProfileById, updateProfile, uploadAvatar, toggleFollow, checkFollowStatus, getFollowCounts, fetchFollowers, fetchFollowing } from '@/api/profile'

export function useProfile(username: string) {
  return useQuery({
    queryKey: ['profile', username],
    queryFn: () => fetchProfile(username),
    enabled: !!username,
  })
}

export function useProfileById(id: string) {
  return useQuery({
    queryKey: ['profile', 'id', id],
    queryFn: () => fetchProfileById(id),
    enabled: !!id,
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      queryClient.setQueryData(['profile', data.username], data)
    },
  })
}

export function useUploadAvatar() {
  return useMutation({ mutationFn: uploadAvatar })
}

export function useToggleFollow() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: toggleFollow,
    onMutate: async (targetUserId) => {
      await queryClient.cancelQueries({ queryKey: ['follow-status'] })
      await queryClient.cancelQueries({ queryKey: ['follow-counts'] })

      const previousFollowStatus = queryClient.getQueryData<Record<string, boolean>>(['follow-status'])
      const previousFollowCounts = queryClient.getQueriesData({ queryKey: ['follow-counts'] })

      queryClient.setQueriesData<Record<string, boolean>>({ queryKey: ['follow-status'] }, (old) => {
        if (!old) return { [targetUserId]: true }
        return { ...old, [targetUserId]: !old[targetUserId] }
      })

      queryClient.setQueriesData({ queryKey: ['follow-counts'] }, (old: any) => {
        if (!old) return old
        const isCurrentlyFollowing = previousFollowStatus?.[targetUserId] ?? false
        const delta = isCurrentlyFollowing ? -1 : 1
        if (Array.isArray(old)) return old
        if (typeof old === 'object' && old.followers !== undefined) {
          return { ...old, followers: old.followers + delta }
        }
        return old
      })

      return { previousFollowStatus, previousFollowCounts }
    },
    onError: (_err, _targetUserId, context) => {
      if (context?.previousFollowStatus) {
        queryClient.setQueryData(['follow-status'], context.previousFollowStatus)
      }
      if (context?.previousFollowCounts) {
        context.previousFollowCounts.forEach(([key, data]) => {
          queryClient.setQueryData(key, data)
        })
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      queryClient.invalidateQueries({ queryKey: ['follow-status'] })
      queryClient.invalidateQueries({ queryKey: ['follow-counts'] })
    },
  })
}

export function useFollowStatus(userIds: string[]) {
  return useQuery({
    queryKey: ['follow-status', userIds],
    queryFn: () => checkFollowStatus(userIds),
    enabled: userIds.length > 0,
  })
}

export function useFollowCounts(userId: string) {
  return useQuery({
    queryKey: ['follow-counts', userId],
    queryFn: () => getFollowCounts(userId),
    enabled: !!userId,
  })
}

export function useFollowers(userId: string) {
  return useQuery({
    queryKey: ['followers', userId],
    queryFn: () => fetchFollowers(userId),
    enabled: !!userId,
  })
}

export function useFollowing(userId: string) {
  return useQuery({
    queryKey: ['following', userId],
    queryFn: () => fetchFollowing(userId),
    enabled: !!userId,
  })
}
