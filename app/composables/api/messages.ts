import { useApi } from '~/composables/useApi'

export interface Message {
  id: number
  senderId: number
  sender: { id: number; username: string } | null
  receiverId: number | null
  receiver: { id: number; username: string } | null
  sessionId: number | null
  content: string
  read: boolean
  closed: boolean | null
  deleted: boolean | null
  messageUpdatedAt: string
  createdAt: string
  replies?: Message[]
}

export function useMessageApi() {
  const api = useApi()
  return {
    getInbox: (params?: { filter?: 'read' | 'unread'; page?: number; perPage?: number }) =>
      api.get<{ items: Message[]; total: number }>('/messages', { params }),
    getUnreadCount: () =>
      api.get<{ count: number }>('/messages/count'),
    getMessage: (id: number) =>
      api.get<Message>(`/messages/${id}`),
    markStatus: (id: number, status: string) =>
      api.put(`/messages/${id}/status`, { status }),
    markRead: (id: number) =>
      api.get(`/messages/${id}/set-read`),
    reply: (id: number, content: string) =>
      api.post<Message>(`/messages/${id}`, { content }),
    contactAdmin: (title: string, content: string) =>
      api.post<Message>('/messages/contact-admin', { content: title ? `【${title}】\n${content}` : content }),
  }
}
