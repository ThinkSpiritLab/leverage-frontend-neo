import { useApi } from '~/composables/useApi'

export interface Judger {
  name: string
  version: string
  ttl: number
}

export function useTransmitApi() {
  const api = useApi()
  return {
    getJudgers: () => api.get<Judger[]>('/transmit/judgers'),
    rejudge: (submissionId: number) => api.post(`/transmit/rejudge/${submissionId}`),
    rejudgeAll: (params?: { problemId?: number; contestId?: number }) =>
      api.post('/transmit/rejudge', params),
  }
}
