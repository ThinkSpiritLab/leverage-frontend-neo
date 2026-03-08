import { useApi } from '~/composables/useApi'
import type { Submission } from '~/types'

export function useSubmissionsApi() {
  const api = useApi()
  return {
    list: (params: { page?: number; perPage?: number; userId?: number; problemId?: number; status?: number }) =>
      api.get<{ items: Submission[]; total: number }>('/submissions', { params }),
    get: (id: number) => api.get<Submission>(`/submissions/${id}`),
    create: (dto: { problemId: number; language: string; code: string; contestId?: number; courseId?: number }) =>
      api.post<Submission>('/submissions', dto),
    getStatus: (id: number) => api.get<{ status: number }>(`/submissions/${id}/status`),
    rejudge: (id: number) => api.post(`/submissions/${id}/rejudge`),
    getCE: (id: number) => api.get<string>(`/submissions/ce/${id}`),
  }
}
