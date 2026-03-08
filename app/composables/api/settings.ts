import { useApi } from '~/composables/useApi'

export function useSettingsApi() {
  const api = useApi()
  return {
    list: () => api.get<any[]>('/settings'),
    get: (key: string) => api.get<{ key: string; valueString: string; valueNumber: number | null }>(`/settings/${key}`),
    update: (key: string, value: string) => api.post('/settings', { key, value }),
  }
}
