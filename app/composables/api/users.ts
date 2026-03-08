import { useApi } from '~/composables/useApi'
import type { User } from '~/types'

export interface UpdateUserDto {
  email?: string
  studentId?: string
  password?: string
  role?: User['role']
}

export function useUsersApi() {
  const api = useApi()
  return {
    list: (params?: { page?: number; perPage?: number; search?: string; role?: string; orderBy?: string; order?: string }) =>
      api.get<{ items: User[]; total: number }>('/users', { params }),
    get: (id: number) => api.get<User>(`/users/${id}`),
    getByUsername: (username: string) => api.get<User>(`/users/by-username/${username}`),
    update: (id: number, dto: UpdateUserDto) => api.patch<User>(`/users/${id}`, dto),
    delete: (id: number) => api.delete(`/users/${id}`),
    getSubmissions: (id: number, params?: { page?: number; perPage?: number }) =>
      api.get(`/users/${id}/submissions`, { params }),
    banUser: (id: number, banned: boolean, reason?: string) =>
      api.post(`/users/${id}/ban`, { banned, reason }),
    changeUserPassword: (id: number, password: string) =>
      api.post(`/users/${id}/password`, { password }),
  }
}
