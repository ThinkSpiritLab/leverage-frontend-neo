import { useApi } from '~/composables/useApi'

export function useTagsApi() {
  const api = useApi()
  return {
    list: () => api.get<{ items: any[]; total: number }>('/tags'),
    create: (dto: { name: string; color?: string }) => api.post('/tags', dto),
    update: (id: number, dto: { name?: string; color?: string }) => api.patch(`/tags/${id}`, dto),
    delete: (id: number) => api.delete(`/tags/${id}`),
  }
}
