import { useApi } from '~/composables/useApi'

export interface Notification {
  id: number
  title: string
  content: string
  read: boolean
  targetUserId?: number | null
  createdAt: string
}

export function useNotificationsApi() {
  const api = useApi()
  return {
    list: (params?: { page?: number; perPage?: number; read?: boolean }) =>
      api.get<{ items: Notification[]; total: number; unreadCount?: number }>('/notifications', { params }),
    getNotification: (id: number) =>
      api.get<Notification>(`/notifications/${id}`),
    create: (dto: { title: string; content: string; targetUserId?: number }) =>
      api.post<Notification>('/notifications', dto),
    updateNotification: (id: number, dto: { title?: string; content?: string; targetUserId?: number }) =>
      api.patch<Notification>(`/notifications/${id}`, dto),
    delete: (id: number) =>
      api.delete(`/notifications/${id}`),
    markRead: (id: number) =>
      api.patch(`/notifications/${id}/read`),
    markAllRead: () =>
      api.patch('/notifications/read-all'),
  }
}
