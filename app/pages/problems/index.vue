<template>
  <div>
    <NH1>题目列表</NH1>
    <NAlert type="info">
      题目列表（建设中）
    </NAlert>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default',
  middleware: 'auth',
})
</script>
