import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  fetchSpaces, 
  fetchMySpaces, 
  fetchSpaceBySlug, 
  fetchSpaceById,
  createSpace, 
  joinSpace, 
  leaveSpace,
  updateSpace,
  deleteSpace,
  fetchSpaceMembers,
  updateSpaceModules,
} from '@/api/spaces';
import type { Space, SpaceWithMembership, SpaceModules } from '@/types/spaces';

export function useSpaces(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ['spaces', page, pageSize],
    queryFn: () => fetchSpaces(page, pageSize),
    staleTime: 30000,
  });
}

export function useMySpaces() {
  return useQuery({
    queryKey: ['spaces', 'my'],
    queryFn: fetchMySpaces,
    staleTime: 30000,
  });
}

export function useSpace(slug: string) {
  return useQuery({
    queryKey: ['spaces', slug],
    queryFn: () => fetchSpaceBySlug(slug),
    staleTime: 30000,
    enabled: !!slug,
  });
}

export function useSpaceById(id: string) {
  return useQuery({
    queryKey: ['spaces', 'id', id],
    queryFn: () => fetchSpaceById(id),
    staleTime: 30000,
    enabled: !!id,
  });
}

export function useCreateSpace() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      name, 
      description, 
      icon, 
      spaceType, 
      visibility 
    }: {
      name: string;
      description: string;
      icon: string;
      spaceType: Space['space_type'];
      visibility?: Space['visibility'];
    }) => createSpace(name, description, icon, spaceType, visibility),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
    },
  });
}

export function useJoinSpace() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (spaceId: string) => joinSpace(spaceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
    },
  });
}

export function useLeaveSpace() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (spaceId: string) => leaveSpace(spaceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
    },
  });
}

export function useUpdateSpace() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      spaceId, 
      updates 
    }: {
      spaceId: string;
      updates: Partial<Pick<Space, 'name' | 'description' | 'icon' | 'cover_image' | 'visibility' | 'settings'>>;
    }) => updateSpace(spaceId, updates),
    onSuccess: (_, { spaceId }) => {
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
      queryClient.invalidateQueries({ queryKey: ['spaces', spaceId] });
    },
  });
}

export function useDeleteSpace() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (spaceId: string) => deleteSpace(spaceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
    },
  });
}

export function useSpaceMembers(spaceId: string) {
  return useQuery({
    queryKey: ['spaces', spaceId, 'members'],
    queryFn: () => fetchSpaceMembers(spaceId),
    staleTime: 30000,
    enabled: !!spaceId,
  });
}

export function useUpdateSpaceModules() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      spaceId, 
      modules 
    }: {
      spaceId: string;
      modules: Partial<SpaceModules>;
    }) => updateSpaceModules(spaceId, modules),
    onSuccess: (_, { spaceId }) => {
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
      queryClient.invalidateQueries({ queryKey: ['spaces', spaceId] });
    },
  });
}
