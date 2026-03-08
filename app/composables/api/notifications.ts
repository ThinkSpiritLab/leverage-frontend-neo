import { useApi } from '~/composables/useApi'

export function useNotificationsApi() {
  const api = useApi()
  return {
    list: (params?: { page?: number; perPage?: number }) =>
      api.get<{ items: any[]; total: number }>('/notifications', { params }),
    create: (dto: { title: string; content: string; targetUserId?: number }) =>
      api.post('/notifications', dto),
    delete: (id: number) => api.delete(`/notifications/${id}`),
  }
}
