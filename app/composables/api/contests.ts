import { useApi } from '~/composables/useApi'
import type { Contest, RankItem } from '~/types'

export interface CreateContestDto {
  title: string
  startTime: string
  endTime: string
  type: string
  problemIds?: number[]
  password?: string
}

export function useContestsApi() {
  const api = useApi()
  return {
    list: (params?: { page?: number; perPage?: number; state?: 'upcoming' | 'ongoing' | 'ended' }) =>
      api.get<{ items: Contest[]; total: number }>('/contests', { params }),
    get: (id: number) => api.get<Contest>(`/contests/${id}`),
    getRanking: (id: number, page: number, perPage: number) =>
      api.get<RankItem[]>(`/contests/${id}/ranking`, { params: { page, perPage } }),
    create: (dto: CreateContestDto) => api.post<Contest>('/contests', dto),
    update: (id: number, dto: Partial<CreateContestDto>) => api.patch<Contest>(`/contests/${id}`, dto),
    delete: (id: number) => api.delete(`/contests/${id}`),
    register: (contestId: number) => api.post(`/contests/${contestId}/users`),
  }
}
