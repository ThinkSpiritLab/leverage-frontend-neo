<template>
  <div v-if="authStore.isAdmin && adminPath" class="admin-view-banner">
    <span>🛠 您正在以管理员身份访问用户视图</span>
    <NButton text size="small" type="primary" style="margin-left: 8px" @click="navigateTo(adminPath!)">
      → 前往管理页面
    </NButton>
  </div>
</template>

<script setup lang="ts">
const authStore = useAuthStore()
const route = useRoute()

const adminPath = computed<string | null>(() => {
  const p = route.path
  // /problems/:id → /admin/problems/:id
  if (/^\/problems\/\d+/.test(p)) return p.replace('/problems/', '/admin/problems/')
  // /contests/:id → /admin/contests/:id
  if (/^\/contests\/\d+/.test(p)) return p.replace('/contests/', '/admin/contests/')
  // /courses/:id → /admin/courses/:id
  if (/^\/courses\/\d+/.test(p)) return p.replace('/courses/', '/admin/courses/')
  return null
})
</script>

<style scoped>
.admin-view-banner {
  display: flex;
  align-items: center;
  background: linear-gradient(90deg, #fffbe6, #fff7e0);
  border: 1px solid #ffd666;
  border-radius: 8px;
  padding: 8px 16px;
  margin-bottom: 16px;
  font-size: 13px;
  color: #7d5800;
}
</style>
