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
          {{ LANGUAGE_LABEL[submission.language] ?? submission.language }}
        </NDescriptionsItem>

        <NDescriptionsItem label="状态">
          <NSpace align="center">
            <StatusTag :status="submission.status" />
            <NButton
              v-if="submission.status === SubmissionStatus.CE"
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
          {{ submission.time != null ? `${submission.time}ms` : '-' }}
        </NDescriptionsItem>

        <NDescriptionsItem label="内存使用">
          {{ memoryToKB(submission.memory) }}
        </NDescriptionsItem>

        <NDescriptionsItem label="提交时间" :span="2">
          {{ dayjs(submission.createdAt).format('YYYY-MM-DD HH:mm:ss') }}
        </NDescriptionsItem>
      </NDescriptions>
    </NCard>

    <NCard title="提交代码">
      <CodeEditor
        v-model="codeContent"
        :language="editorLang"
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
import { LANGUAGE_LABEL, Language, SubmissionStatus, memoryToKB } from '~/types'
import dayjs from 'dayjs'

definePageMeta({
  layout: 'default',
  middleware: 'auth',
})

const route = useRoute()
const submissionId = computed(() => Number(route.params.id))

const submissionsApi = useSubmissionsApi()

const submission = ref<Submission | null>(null)
const loading = ref(true)
const codeContent = ref('')

// 数字语言 ID → 编辑器语言名
const editorLang = computed(() => {
  if (!submission.value) return 'cpp'
  const map: Record<number, string> = {
    [Language.C]: 'c',
    [Language.CPP]: 'cpp',
    [Language.Java]: 'java',
    [Language.Python2]: 'python',
    [Language.Python3]: 'python',
    [Language.JavaScript]: 'javascript',
  }
  return map[submission.value.language] || 'cpp'
})

onMounted(async () => {
  try {
    const res = await submissionsApi.get(submissionId.value)
    const data = res.data ?? res
    submission.value = data
    codeContent.value = (data as any).code || ''
  }
  catch (e) {
    console.error(e)
  }
  finally {
    loading.value = false
  }
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
