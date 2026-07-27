import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/config/axios'
import type { ApiResponse } from '@/types/api'

async function fetcher<T>(url: string): Promise<T> {
  const { data } = await apiClient.get<ApiResponse<T>>(url)
  return data.data
}

export function useApiQuery<T>(key: string[], url: string) {
  return useQuery({ queryKey: key, queryFn: () => fetcher<T>(url) })
}

export function useApiMutation<T>(url: string, options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: unknown) => apiClient.post<ApiResponse<T>>(url, payload).then(r => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries()
      options?.onSuccess?.()
    },
  })
}
