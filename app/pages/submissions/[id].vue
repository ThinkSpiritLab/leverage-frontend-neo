<template>
  <div v-if="loading" class="loading-center">
    <NSpin size="large" />
  </div>
  <div v-else-if="submission" class="submission-detail">
    <NH2 style="margin-bottom: 24px">提交详情 #{{ submission.id }}</NH2>

    <NCard title="基本信息" style="margin-bottom: 24px">
      <NDescriptions :column="2" label-placement="left" bordered>
        <NDescriptionsItem label="用户">
          <UserLink
            v-if="submission.user"
            :user-id="submission.user.id"
            :username="submission.user.username"
          />
          <span v-else style="color:#999">-</span>
        </NDescriptionsItem>

        <NDescriptionsItem label="题目">
          <NButton
            v-if="submission.problem"
            text
            type="primary"
            @click="navigateTo(`/problems/${submission.problem.id}`)"
          >
            {{ submission.problem.prefix }}{{ submission.problem.logicId }} {{ submission.problem.title }}
          </NButton>
          <span v-else style="color:#999">-</span>
        </NDescriptionsItem>

        <NDescriptionsItem label="语言">
          {{ LANGUAGE_LABEL[submission.language] || submission.language }}
        </NDescriptionsItem>

        <NDescriptionsItem label="状态">
          <NSpace align="center">
            <StatusTag :status="submission.status" />
            <NButton
              v-if="submission.status === 7"
              text
              type="error"
              size="small"
              @click="navigateTo(`/submissions/ce/${submission.id}`)"
            >
              查看编译错误
            </NButton>
          </NSpace>
        </NDescriptionsItem>

        <NDescriptionsItem label="执行时间">
          {{ submission.time !== undefined && submission.time !== null ? `${submission.time}ms` : '-' }}
        </NDescriptionsItem>

        <NDescriptionsItem label="内存使用">
          {{ submission.memory !== undefined && submission.memory !== null ? formatMemory(submission.memory) : '-' }}
        </NDescriptionsItem>

        <NDescriptionsItem label="提交时间" :span="2">
          {{ dayjs(submission.createdAt).format('YYYY-MM-DD HH:mm:ss') }}
        </NDescriptionsItem>
      </NDescriptions>
    </NCard>

    <NCard title="提交代码">
      <CodeEditor
        v-model="codeContent"
        :language="submission.language"
        :readonly="true"
        height="500px"
      />
    </NCard>
  </div>
  <div v-else>
    <NResult status="404" title="提交记录不存在" />
  </div>
</template>

<script setup lang="ts">
import type { Submission } from '~/types'
import dayjs from 'dayjs'

definePageMeta({
  layout: 'default',
  middleware: 'auth',
})

const route = useRoute()
const submissionId = computed(() => Number(route.params.id))

// 后端 memory 单位为 bytes，自动换算显示
function formatMemory(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${bytes} B`
}

const submissionsApi = useSubmissionsApi()

const submission = ref<Submission | null>(null)
const loading = ref(true)
const codeContent = ref('')

// 后端 language 是数字枚举，与原版兼容
const LANGUAGE_LABEL: Record<number | string, string> = {
  0: 'C', 1: 'C++', 6: 'Java', 7: 'Kotlin',
  8: 'Python2', 9: 'Python3', 10: 'JavaScript', 11: 'TypeScript',
  // 兼容字符串形式
  c: 'C', cpp: 'C++', java: 'Java', python: 'Python',
  javascript: 'JavaScript', typescript: 'TypeScript',
}

onMounted(async () => {
  try {
    const res = await submissionsApi.get(submissionId.value)
    submission.value = res.data
    codeContent.value = (res.data as any).misc?.code || (res.data as any).code || ''
    // 若仍在评测中，开始轮询状态
    if (res.data.status >= 9) {
      startPolling()
    }
  }
  catch (e) {
    console.error(e)
  }
  finally {
    loading.value = false
  }
})

let pollTimer: ReturnType<typeof setTimeout> | null = null

function startPolling() {
  if (pollTimer) return
  const poll = async () => {
    try {
      const res = await submissionsApi.getStatus(submissionId.value)
      if (submission.value) {
        submission.value = { ...submission.value, status: res.data.status }
      }
      // status < 9 表示已评测完成
      if (res.data.status < 9) {
        // 再拉一次完整信息（time/memory 等）
        const full = await submissionsApi.get(submissionId.value)
        submission.value = full.data
        codeContent.value = (full.data as any).misc?.code || (full.data as any).code || codeContent.value
        return
      }
      pollTimer = setTimeout(poll, 1500)
    }
    catch { /* ignore */ }
  }
  pollTimer = setTimeout(poll, 1500)
}

onUnmounted(() => {
  if (pollTimer) clearTimeout(pollTimer)
})

useHead(computed(() => ({ title: `提交 #${submissionId.value} — Leverage OJ` })))
</script>

<style scoped>
.loading-center {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.submission-detail {
  max-width: 1000px;
  margin: 0 auto;
}
</style>
