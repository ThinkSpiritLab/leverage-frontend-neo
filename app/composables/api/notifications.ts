import { useApi } from '~/composables/useApi'

export interface Notification {
  id: number
  title: string
  content: string
  read: boolean
  createdAt: string
}

export function useNotificationsApi() {
  const api = useApi()
  return {
    list: (params?: { page?: number; perPage?: number }) =>
      api.get<{ items: Notification[]; total: number }>('/notifications', { params }),
    markRead: (id: number) =>
      api.patch(`/notifications/${id}/read`),
    markAllRead: () =>
      api.patch('/notifications/read-all'),
  }
}
