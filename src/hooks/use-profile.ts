import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchProfile, updateProfile, uploadAvatar, toggleFollow, checkFollowStatus, getFollowCounts, fetchFollowers, fetchFollowing } from '@/api/profile'

export function useProfile(username: string) {
  return useQuery({
    queryKey: ['profile', username],
    queryFn: () => fetchProfile(username),
    enabled: !!username,
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      queryClient.invalidateQueries({ queryKey: ['follow-status'] })
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
