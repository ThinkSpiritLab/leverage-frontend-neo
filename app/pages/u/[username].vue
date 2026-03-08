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
    const id = await api.get<number>(`/users/u/${username}`)
    await navigateTo(`/users/${id}`, { replace: true })
  }
  catch {
    await navigateTo('/users', { replace: true })
  }
})
</script>

<style scoped>
.loading-center {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}
</style>
