import { useApi } from '~/composables/useApi'

export function useCollegesApi() {
  const api = useApi()
  return {
    list: () => api.get<any[]>('/profession-college/colleges'),
    create: (name: string) => api.post('/profession-college/colleges', { college: name }),
    update: (id: number, name: string) => api.patch(`/profession-college/colleges/${id}`, { college: name }),
    delete: (id: number) => api.delete(`/profession-college/colleges/${id}`),
    merge: (sourceId: number, targetId: number) => api.post('/profession-college/colleges/merge', { sourceId, targetId }),
  }
}

export function useProfessionsApi() {
  const api = useApi()
  return {
    list: (college?: string) => api.get<any[]>('/profession-college/professions', { params: college ? { college } : undefined }),
    create: (profession: string, college: string) => api.post('/profession-college/professions', { profession, college }),
    update: (id: number, profession: string, college: string) => api.patch(`/profession-college/professions/${id}`, { profession, college }),
    delete: (id: number) => api.delete(`/profession-college/professions/${id}`),
    merge: (sourceId: number, targetId: number) => api.post('/profession-college/professions/merge', { sourceId, targetId }),
  }
}
