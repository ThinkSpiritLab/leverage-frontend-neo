<template>
  <NLayoutHeader bordered style="padding: 0 24px; display: flex; align-items: center; justify-content: space-between; height: 56px">
    <!-- 左侧 Logo -->
    <NButton text tag="a" href="/problems" style="font-size: 18px; font-weight: bold; color: #18a058">
      Leverage OJ
    </NButton>

    <!-- 右侧用户区域 -->
    <div style="display: flex; align-items: center; gap: 12px">
      <template v-if="authStore.isLoggedIn">
        <!-- 用户名 -->
        <span style="font-size: 14px; color: #333">{{ authStore.user?.username }}</span>

        <!-- 角色 badge -->
        <NTag
          v-if="authStore.user?.role"
          :type="roleBadgeType"
          size="small"
          round
        >
          {{ roleLabel }}
        </NTag>

        <!-- 消息图标（带未读角标） -->
        <NBadge :value="unreadCount" :max="99" :show="unreadCount > 0">
          <NButton text style="font-size: 20px; line-height: 1" @click="navigateTo('/messages')">
            <NIcon><MailOutline /></NIcon>
          </NButton>
        </NBadge>
      </template>

      <!-- 深色/浅色模式切换 -->
      <NButton text style="font-size: 20px; line-height: 1" @click="toggle">
        <NIcon><component :is="isDark ? SunnyOutline : MoonOutline" /></NIcon>
      </NButton>

      <template v-if="authStore.isLoggedIn">
        <!-- 登出按钮 -->
        <NButton size="small" @click="handleLogout">
          登出
        </NButton>
      </template>

      <template v-else>
        <NButton type="primary" size="small" @click="navigateTo('/login')">
          登录
        </NButton>
      </template>
    </div>
  </NLayoutHeader>
</template>

<script setup lang="ts">
import { MailOutline, MoonOutline, SunnyOutline } from '@vicons/ionicons5'

const authStore = useAuthStore()
const msgApi = useMessageApi()
const { isDark, toggle } = useTheme()

const unreadCount = ref(0)

async function fetchUnreadCount() {
  if (!authStore.isLoggedIn) return
  try {
    const res = await msgApi.getUnreadCount()
    const data = res.data ?? res
    unreadCount.value = data.count ?? 0
  }
  catch {
    // ignore
  }
}

// Poll every 60 seconds
let timer: ReturnType<typeof setInterval> | null = null
onMounted(() => {
  fetchUnreadCount()
  timer = setInterval(fetchUnreadCount, 60_000)
})
onUnmounted(() => {
  if (timer) clearInterval(timer)
})

const roleLabel = computed(() => {
  const roleMap: Record<string, string> = {
    sa: '超级管理员',
    admin: '管理员',
    supervisor: '监督员',
    user: '用户',
    guest: '访客',
  }
  return roleMap[authStore.user?.role ?? ''] ?? authStore.user?.role ?? ''
})

const roleBadgeType = computed((): 'default' | 'info' | 'success' | 'warning' | 'error' => {
  const typeMap: Record<string, 'default' | 'info' | 'success' | 'warning' | 'error'> = {
    sa: 'error',
    admin: 'warning',
    supervisor: 'info',
    user: 'success',
    guest: 'default',
  }
  return typeMap[authStore.user?.role ?? ''] ?? 'default'
})

function handleLogout() {
  authStore.logout()
  navigateTo('/login')
}
</script>
