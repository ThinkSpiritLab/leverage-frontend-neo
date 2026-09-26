import axios, { type AxiosInstance } from 'axios'
import { useAuthStore } from '~/stores/auth'

let apiInstance: AxiosInstance | null = null
let refreshPromise: Promise<void> | null = null

export function createApiInstance(baseURL: string): AxiosInstance {
  const instance = axios.create({ baseURL })

  // 请求拦截：自动带 JWT token
  instance.interceptors.request.use((config) => {
    const authStore = useAuthStore()
    if (authStore.accessToken) {
      config.headers.Authorization = `Bearer ${authStore.accessToken}`
    }
    return config
  })

  // 响应拦截：401 自动刷新 token
  instance.interceptors.response.use(
    response => response,
    async (error) => {
      const authStore = useAuthStore()
      const requestUrl = error.config?.url || ''
      const isRefreshRequest = /(?:^|\/)auth\/refresh(?:[?#]|$)/.test(requestUrl)
      if (error.response?.status === 401 && error.config && !error.config._retry && !isRefreshRequest) {
        error.config._retry = true
        try {
          if (!refreshPromise) {
            refreshPromise = authStore.refreshAccessToken().finally(() => {
              refreshPromise = null
            })
          }
          await refreshPromise
          error.config.headers.Authorization = `Bearer ${authStore.accessToken}`
          return instance(error.config)
        }
        catch {
          authStore.logout()
          navigateTo('/login')
        }
      }
      return Promise.reject(error)
    },
  )

  return instance
}

export function useApi() {
  const config = useRuntimeConfig()
  if (!apiInstance) {
    apiInstance = createApiInstance(config.public.apiBase)
  }
  return apiInstance
}
