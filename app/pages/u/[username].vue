<template>
  <div class="loading-center">
    <NSpin size="large" />
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

const route = useRoute()
const api = useApi()

onMounted(async () => {
  const username = route.params.username as string
  try {
    const res = await api.get<number>(`/users/u/${username}`)
    const id = res.data ?? res
    await navigateTo(`/users/${id}`, { replace: true })
  }
  catch {
    await navigateTo('/users', { replace: true })
  }
})

useHead({ title: '用户主页 — Leverage OJ' })
</script>

<style scoped>
.loading-center {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}
</style>
