import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchSpaceInvites,
  createInvite,
  revokeInvite,
  acceptInvite,
  fetchPendingApprovals,
  approveMember,
  rejectMember,
} from '@/api/invites';
import type { CreateInviteInput } from '@/types/invites';

export function useSpaceInvites(spaceId: string) {
  return useQuery({
    queryKey: ['space-invites', spaceId],
    queryFn: () => fetchSpaceInvites(spaceId),
    staleTime: 30000,
    enabled: !!spaceId,
  });
}

export function useCreateInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateInviteInput) => createInvite(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['space-invites', variables.spaceId] });
    },
  });
}

export function useRevokeInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (inviteId: string) => revokeInvite(inviteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['space-invites'] });
    },
  });
}

export function useAcceptInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (token: string) => acceptInvite(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
      queryClient.invalidateQueries({ queryKey: ['spaces', 'my'] });
    },
  });
}

export function usePendingApprovals(spaceId: string) {
  return useQuery({
    queryKey: ['space-pending', spaceId],
    queryFn: () => fetchPendingApprovals(spaceId),
    staleTime: 30000,
    enabled: !!spaceId,
  });
}

export function useApproveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ spaceId, userId }: { spaceId: string; userId: string }) =>
      approveMember(spaceId, userId),
    onSuccess: (_, { spaceId }) => {
      queryClient.invalidateQueries({ queryKey: ['space-pending', spaceId] });
      queryClient.invalidateQueries({ queryKey: ['spaces', spaceId, 'members'] });
    },
  });
}

export function useRejectMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ spaceId, userId }: { spaceId: string; userId: string }) =>
      rejectMember(spaceId, userId),
    onSuccess: (_, { spaceId }) => {
      queryClient.invalidateQueries({ queryKey: ['space-pending', spaceId] });
      queryClient.invalidateQueries({ queryKey: ['spaces', spaceId, 'members'] });
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
    },
  });
}
