import { useApi } from '~/composables/useApi'

export function useSuspicionsApi() {
  const api = useApi()
  return {
    list: (params?: { page?: number; perPage?: number; courseId?: number }) =>
      api.get<{ items: any[]; total: number }>('/suspicion', { params }),
    get: (hashsum: string) => api.get(`/suspicion/hash/${hashsum}`),
    markChecked: (submissionId: number, checked: boolean) =>
      api.patch(`/suspicion/${submissionId}/checked`, { checked }),
  }
}
