export default defineNuxtRouteMiddleware(() => {
  const authStore = useAuthStore()
  if (!authStore.isSupervisor) {
    return navigateTo('/')
  }
})
