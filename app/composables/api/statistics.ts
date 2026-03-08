import { useApi } from '~/composables/useApi'

export interface Statistics {
  users: number
  problems: number
  submissions: number
  accepts: number
}

export function useStatisticsApi() {
  const api = useApi()
  return {
    get: () => api.get<Statistics>('/statistics'),
  }
}
