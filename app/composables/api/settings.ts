import { useApi } from '~/composables/useApi'

export function useSettingsApi() {
  const api = useApi()
  return {
    list: () => api.get<any[]>('/setting'),
    update: (key: string, value: any) => api.patch(`/setting/${key}`, { value }),
  }
}
