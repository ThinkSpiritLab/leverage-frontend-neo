import { useApi } from '~/composables/useApi'

export interface HealthStatus {
  status: string
  info?: {
    database?: { status: string }
    redis?: { status: string }
    [key: string]: { status: string } | undefined
  }
  error?: Record<string, any>
  details?: Record<string, any>
}

export interface QueueHealth {
  queues?: Array<{
    name: string
    waiting: number
    active: number
    failed: number
    completed?: number
    paused?: number
  }>
  [key: string]: any
}

export function useHealthApi() {
  const api = useApi()
  return {
    get: () => api.get<HealthStatus>('/health'),
    getQueues: () => api.get<QueueHealth>('/health/queues'),
  }
}
