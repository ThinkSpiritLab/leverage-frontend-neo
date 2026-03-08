<template>
  <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center">
    <NResult
      :status="errorStatus"
      :title="error?.statusCode?.toString() || '错误'"
      :description="error?.message || '发生了未知错误'"
    >
      <template #footer>
        <NSpace>
          <NButton type="primary" @click="handleBack">
            返回上页
          </NButton>
          <NButton @click="handleHome">
            回到首页
          </NButton>
        </NSpace>
      </template>
    </NResult>
  </div>
</template>

<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{
  error: NuxtError
}>()

const errorStatus = computed(() => {
  if (props.error?.statusCode === 404) return '404'
  if (props.error?.statusCode === 403) return '403'
  if (props.error?.statusCode === 500) return '500'
  return 'error'
})

function handleBack() {
  window.history.back()
}

function handleHome() {
  navigateTo('/')
}
</script>
