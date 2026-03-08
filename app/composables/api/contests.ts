import { useApi } from '~/composables/useApi'
import type { Contest, RankItem } from '~/types'

export interface CreateContestDto {
  name: string
  title?: string
  startTime: string
  endTime: string
  type: string
  problemIds?: number[]
  password?: string
}

export interface BalloonItem {
  id: number
  userId: number
  username?: string
  problemId: number
  problemLabel?: string
  delivered: boolean
  createdAt: string
}

export interface ContestUserItem {
  id: number
  username: string
  studentId?: string
  email?: string
}

export function useContestsApi() {
  const api = useApi()
  return {
    list: (params?: { page?: number; perPage?: number; state?: 'upcoming' | 'ongoing' | 'ended'; type?: string }) =>
      api.get<{ items: Contest[]; total: number }>('/contests', { params }),
    get: (id: number) => api.get<Contest>(`/contests/${id}`),
    getRanking: (id: number, page: number, perPage: number) =>
      api.get<RankItem[]>(`/contests/${id}/ranking`, { params: { page, perPage } }),
    create: (dto: CreateContestDto) => api.post<Contest>('/contests', dto),
    update: (id: number, dto: Partial<CreateContestDto>) => api.patch<Contest>(`/contests/${id}`, dto),
    delete: (id: number) => api.delete(`/contests/${id}`),
    register: (contestId: number) => api.post(`/contests/${contestId}/users`),

    // 气球相关
    getBalloons: (id: number) => api.get<BalloonItem[]>(`/contests/${id}/balloons`),
    markBalloonDelivered: (id: number, bid: number) => api.patch(`/contests/${id}/balloons/${bid}`),

    // 参赛用户管理
    getContestUsers: (id: number) => api.get<ContestUserItem[]>(`/contests/${id}/users`),
    removeContestUser: (id: number, userId: number) => api.delete(`/contests/${id}/users/${userId}`),
    importContestUsers: (id: number, users: { username: string; studentId?: string }[]) =>
      api.post(`/contests/${id}/users/import`, { users }),

    // 竞赛提交
    getContestSubmissions: (id: number, params?: { page?: number; perPage?: number }) =>
      api.get(`/contests/${id}/submissions`, { params }),
  }
}
