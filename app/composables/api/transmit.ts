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

export interface FailedJob {
  jobId: string | number
  submissionId?: number
  failedReason: string
  attemptsMade: number
  timestamp: string | null
  data: Record<string, any>
}

export function useTransmitApi() {
  const api = useApi()
  return {
    getJudgers: () => api.get<Judger[]>('/transmit/judgers'),
    getJudgeStats: () => api.get<JudgeStats>('/transmit/judge-stats'),
    getFailedJobs: () => api.get<FailedJob[]>('/transmit/failed-jobs'),
    retryJob: (jobId: string | number) => api.post(`/transmit/retry-job/${jobId}`),
    retryAllFailed: () => api.post('/transmit/retry-all-failed'),
    clearJob: (jobId: string | number) => api.delete(`/transmit/failed-jobs/${jobId}`),
    clearAllFailed: () => api.delete('/transmit/failed-jobs'),
    rejudge: (submissionId: number) => api.post(`/transmit/rejudge/${submissionId}`),
    rejudgeAll: (params?: { problemId?: number; contestId?: number }) =>
      api.post('/transmit/rejudge', params),
  }
}
