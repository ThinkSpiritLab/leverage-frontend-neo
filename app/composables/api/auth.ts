import { useApi } from '~/composables/useApi'
import type { User } from '~/types'

export function useAuthApi() {
  const api = useApi()
  return {
    login: (username: string, password: string) =>
      api.post<{ accessToken: string; refreshToken: string }>('/auth/login', { username, password }),
    loginContest: (contestId: number, username: string, password: string) =>
      api.post<{ accessToken: string }>('/auth/login/contest', { contestId, username, password }),
    refresh: (refreshToken: string) =>
      api.post<{ accessToken: string }>('/auth/refresh', { refreshToken }),
    getProfile: () => api.get<User>('/auth/profile'),
    logout: () => api.post('/auth/logout'),
  }
}
