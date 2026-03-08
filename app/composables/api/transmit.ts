import { useApi } from '~/composables/useApi'

export interface Judger {
  name: string
  version: string
  ttl: number
}

export interface JudgeStats {
  last1min: number
  last5min: number
  last10min: number
  acLast1min: number
  acLast5min: number
  acLast10min: number
}

export function useTransmitApi() {
  const api = useApi()
  return {
    getJudgers: () => api.get<Judger[]>('/transmit/judgers'),
    getJudgeStats: () => api.get<JudgeStats>('/transmit/judge-stats'),
    rejudge: (submissionId: number) => api.post(`/transmit/rejudge/${submissionId}`),
    rejudgeAll: (params?: { problemId?: number; contestId?: number }) =>
      api.post('/transmit/rejudge', params),
  }
}
