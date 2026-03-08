import { useApi } from '~/composables/useApi'

export function useSettingsApi() {
  const api = useApi()
  return {
    list: () => api.get<any[]>('/settings'),
    update: (key: string, value: any) => api.patch(`/settings/${key}`, { value }),
  }
}
