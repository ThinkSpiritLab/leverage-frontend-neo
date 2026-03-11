import { useApi } from '~/composables/useApi'

export interface ApiKey {
  id: number
  name: string
  keyPrefix: string
  createdAt: string
  lastUsedAt: string | null
  revokedAt: string | null
}

export interface ApiKeyCreateResponse {
  id: number
  name: string
  keyPrefix: string
  key: string
  createdAt: string
}

export function useApiKeysApi() {
  const api = useApi()
  return {
    list: () => api.get<ApiKey[]>('/auth/api-keys'),
    create: (name: string) => api.post<ApiKeyCreateResponse>('/auth/api-keys', { name }),
    revoke: (id: number) => api.delete(`/auth/api-keys/${id}`),
  }
}
