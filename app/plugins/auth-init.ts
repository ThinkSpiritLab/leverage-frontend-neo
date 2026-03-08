export default defineNuxtPlugin(async () => {
  const authStore = useAuthStore()
  // 若 localStorage 有 refreshToken，尝试恢复会话
  // init() 内部：刷新 accessToken → fetchProfile，失败则 logout（清空过期 token）
  await authStore.init()
})
