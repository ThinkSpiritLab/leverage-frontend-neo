<template>
  <NButton
    text
    type="primary"
    class="user-link"
    @click="navigateTo(`/users/${userId}`)"
  >
    {{ username }}
  </NButton>
</template>

<script setup lang="ts">
defineProps<{
  userId: number
  username: string
}>()
</script>

<style scoped>
.user-link {
  font-weight: 500;
}
</style>
