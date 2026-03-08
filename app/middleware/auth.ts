export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore()

  // 已登录用户访问 /login，重定向到题目列表
  if (to.path === '/login' && authStore.isLoggedIn) {
    return navigateTo('/problems')
  }

  // 未登录用户访问受保护页面，重定向到登录页
  if (to.path !== '/login' && !authStore.isLoggedIn) {
    return navigateTo('/login')
  }
})
