import { defineStore } from 'pinia'
import { useAuthApi } from '~/composables/api/auth'
import type { User } from '~/types'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    accessToken: null as string | null,
    refreshToken: null as string | null,
    user: null as User | null,
  }),

  getters: {
    isLoggedIn: (state): boolean => !!state.accessToken,
    isAdmin: (state): boolean => !!state.user && ['sa', 'admin'].includes(state.user.role),
    isSupervisor: (state): boolean => !!state.user && ['sa', 'admin', 'supervisor'].includes(state.user.role),
  },

  actions: {
    async login(username: string, password: string) {
      const authApi = useAuthApi()
      const { data } = await authApi.login(username, password)
      this.accessToken = data.accessToken
      this.refreshToken = data.refreshToken
      // 持久化到 localStorage
      localStorage.setItem('refreshToken', data.refreshToken)
      await this.fetchProfile()
    },

    async refreshAccessToken() {
      const rt = this.refreshToken || localStorage.getItem('refreshToken')
      if (!rt) throw new Error('No refresh token')
      const authApi = useAuthApi()
      const { data } = await authApi.refresh(rt)
      this.accessToken = data.accessToken
    },

    async fetchProfile() {
      const authApi = useAuthApi()
      const { data } = await authApi.getProfile()
      this.user = data
    },

    logout() {
      this.accessToken = null
      this.refreshToken = null
      this.user = null
      localStorage.removeItem('refreshToken')
    },

    // 初始化：从 localStorage 恢复（SPA 刷新后重新获取）
    async init() {
      const rt = localStorage.getItem('refreshToken')
      if (rt) {
        this.refreshToken = rt
        try {
          await this.refreshAccessToken()
          await this.fetchProfile()
        }
        catch {
          this.logout()
        }
      }
    },
  },
})
