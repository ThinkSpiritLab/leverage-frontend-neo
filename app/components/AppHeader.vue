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
const authStore = useAuthStore()

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
