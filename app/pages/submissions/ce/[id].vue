<template>
  <div v-if="loading" class="loading-center">
    <NSpin size="large" />
  </div>
  <div v-else-if="error" class="ce-container">
    <NResult status="403" title="无权查看" description="只有提交者本人或管理员才能查看编译错误详情" />
    <div style="text-align:center; margin-top: 16px">
      <NButton @click="navigateTo(`/submissions/${submissionId}`)">返回提交详情</NButton>
    </div>
  </div>
  <div v-else class="ce-container">
    <NH2 style="margin-bottom: 24px">编译错误详情</NH2>

    <NCard style="margin-bottom: 24px">
      <NSpace vertical>
        <NText depth="3">提交 #{{ submissionId }}</NText>
        <NCode
          :code="ceContent || '（无编译错误信息）'"
          language="text"
          :show-line-numbers="true"
          style="background: #1e1e1e; border-radius: 6px; padding: 12px; max-height: 600px; overflow-y: auto;"
        />
        <div>
          <NButton type="primary" @click="navigateTo(`/submissions/${submissionId}`)">
            返回提交详情
          </NButton>
        </div>
      </NSpace>
    </NCard>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default',
  middleware: 'auth',
})

const route = useRoute()
const submissionId = computed(() => Number(route.params.id))

const submissionsApi = useSubmissionsApi()

const ceContent = ref('')
const loading = ref(true)
const error = ref(false)

onMounted(async () => {
  try {
    const data = await submissionsApi.getCE(submissionId.value)
    // The API may return an object with stderr or a plain string
    if (typeof data === 'string') {
      ceContent.value = data
    }
    else if (data && typeof data === 'object') {
      // Handle various possible response shapes
      ceContent.value = (data as any).stderr
        || (data as any).compileErrorMsg
        || (data as any).content
        || JSON.stringify(data, null, 2)
    }
  }
  catch (e: any) {
    // 403 or 404 — no permission or not found
    error.value = true
  }
  finally {
    loading.value = false
  }
})

useHead(computed(() => ({ title: `编译错误 #${submissionId.value} — Leverage OJ` })))
</script>

<style scoped>
.loading-center {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.ce-container {
  max-width: 1000px;
  margin: 0 auto;
}
</style>
