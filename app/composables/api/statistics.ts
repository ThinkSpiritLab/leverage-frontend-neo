import { useApi } from '~/composables/useApi'

export interface Statistics {
  users: number
  problems: number
  submissions: number
  accepts: number
}

export interface StatResult {
  problem: number
  user: number
  submission: number
  notification: number
  message: number
  course: number
  contest: number
}

export function useStatisticsApi() {
  const api = useApi()
  return {
    get: () => api.get<Statistics>('/statistics'),
    getStat: () => api.get<StatResult>('/stat'),
  }
}
