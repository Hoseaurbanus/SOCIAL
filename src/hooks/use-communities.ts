import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchCommunities, createCommunity, joinCommunity, leaveCommunity } from '@/api/communities'

export function useCommunities() {
  return useQuery({
    queryKey: ['communities'],
    queryFn: fetchCommunities,
  })
}

export function useCreateCommunity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ name, description, icon }: { name: string; description: string; icon: string }) =>
      createCommunity(name, description, icon),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communities'] })
    },
  })
}

export function useJoinCommunity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: joinCommunity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communities'] })
    },
  })
}

export function useLeaveCommunity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: leaveCommunity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communities'] })
    },
  })
}
