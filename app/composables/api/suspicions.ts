import { useApi } from '~/composables/useApi'

export function useSuspicionsApi() {
  const api = useApi()
  return {
    list: (params?: { page?: number; perPage?: number }) =>
      api.get<{ items: any[]; total: number }>('/suspicions', { params }),
    get: (hashsum: string) => api.get(`/suspicions/${hashsum}`),
    markChecked: (submissionId: number, checked: boolean) =>
      api.patch(`/suspicions/${submissionId}`, { checked }),
  }
}
