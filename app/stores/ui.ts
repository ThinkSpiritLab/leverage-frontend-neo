import { defineStore } from 'pinia'

export const useUiStore = defineStore('ui', {
  state: () => ({
    sidebarCollapsed: false,
    mobileNavOpen: false,
    pageLoading: false,
  }),
  actions: {
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed
    },
    closeMobileNav() {
      this.mobileNavOpen = false
    },
    setLoading(v: boolean) {
      this.pageLoading = v
    },
  },
})
