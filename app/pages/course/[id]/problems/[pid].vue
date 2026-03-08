<template>
  <div v-if="loading" class="loading-center">
    <NSpin size="large" />
  </div>
  <div v-else-if="problem" class="problem-page">
    <!-- 左侧：题目信息 -->
    <div class="problem-left">
      <div class="problem-header">
        <div class="breadcrumb">
          <NButton text type="primary" @click="navigateTo(`/courses/${courseId}`)">
            返回课程
          </NButton>
          <span class="breadcrumb-sep"> / </span>
          <span>{{ problem.title }}</span>
        </div>
        <NH2 style="margin: 8px 0 0">{{ problem.prefix }}{{ problem.logicId }}. {{ problem.title }}</NH2>
        <div class="problem-meta">
          <NTag size="small" :bordered="false" type="info">
            时间限制: {{ problem.timeLimit }}ms
          </NTag>
          <NTag size="small" :bordered="false" type="warning">
            内存限制: {{ problem.memoryLimit }}MB
          </NTag>
        </div>
        <div v-if="problem.tags && problem.tags.length" class="problem-tags">
          <NTag
            v-for="tag in problem.tags"
            :key="tag.id"
            size="small"
            type="info"
            :bordered="false"
          >
            {{ tag.name }}
          </NTag>
        </div>
      </div>

      <NDivider />

      <MarkdownView :content="problem.description" />
    </div>

    <!-- 右侧：代码编辑器 + 提交 -->
    <div class="problem-right">
      <div class="editor-header">
        <NSelect
          v-model:value="language"
          :options="languageOptions"
          style="width: 160px"
        />
      </div>

      <CodeEditor
        v-model="code"
        :language="editorLanguage"
        height="450px"
      />

      <div class="submit-area">
        <NButton
          type="primary"
          :loading="submitting"
          block
          size="large"
          @click="handleSubmit"
        >
          提交代码
        </NButton>
      </div>

      <!-- 提交结果 -->
      <div v-if="submissionId" class="submission-result">
        <NCard size="small">
          <div class="result-row">
            <span class="result-label">提交 ID：</span>
            <NButton text type="primary" @click="navigateTo(`/submissions/${submissionId}`)">
              #{{ submissionId }}
            </NButton>
          </div>
          <div class="result-row">
            <span class="result-label">状态：</span>
            <StatusTag :status="submissionStatus" />
            <NSpin v-if="polling" size="small" style="margin-left: 8px" />
          </div>
        </NCard>
      </div>
    </div>
  </div>
  <div v-else>
    <NResult status="404" title="题目不存在" />
  </div>
</template>

<script setup lang="ts">
import type { Problem } from '~/types'
import { LANGUAGE_OPTIONS, Language, isFinalStatus, SubmissionStatus } from '~/types'

definePageMeta({
  layout: 'default',
  middleware: 'auth',
})

const route = useRoute()
const courseId = computed(() => Number(route.params.id))
const problemId = computed(() => Number(route.params.pid))

const problemsApi = useProblemsApi()
const submissionsApi = useSubmissionsApi()

const problem = ref<Problem | null>(null)
const loading = ref(true)

const language = ref(Language.CPP)
const code = ref('')
const submitting = ref(false)
const submissionId = ref<number | null>(null)
const submissionStatus = ref(SubmissionStatus.PENDING)
const polling = ref(false)

const languageOptions = LANGUAGE_OPTIONS

const editorLanguage = computed(() => {
  const map: Record<number, string> = {
    [Language.C]: 'c',
    [Language.CPP]: 'cpp',
    [Language.Java]: 'java',
    [Language.Python2]: 'python',
    [Language.Python3]: 'python',
    [Language.JavaScript]: 'javascript',
  }
  return map[language.value] || 'cpp'
})

onMounted(async () => {
  try {
    const res = await problemsApi.get(problemId.value)
    problem.value = res.data ?? res
  }
  catch (e) {
    console.error(e)
  }
  finally {
    loading.value = false
  }
})

let pollTimer: ReturnType<typeof setTimeout> | null = null

async function handleSubmit() {
  if (!code.value.trim()) return
  submitting.value = true
  submissionId.value = null
  submissionStatus.value = SubmissionStatus.PENDING
  if (pollTimer) clearTimeout(pollTimer)

  try {
    const res = await submissionsApi.create({
      problemId: problemId.value,
      language: language.value,
      code: code.value,
      courseId: courseId.value,
    })
    const sub = res.data ?? res
    submissionId.value = sub.id
    submissionStatus.value = sub.status
    startPolling(sub.id)
  }
  catch (e) {
    console.error(e)
  }
  finally {
    submitting.value = false
  }
}

function startPolling(id: number) {
  if (isFinalStatus(submissionStatus.value)) return
  polling.value = true

  const poll = async () => {
    try {
      const res = await submissionsApi.getStatus(id)
      const data = res.data ?? res
      submissionStatus.value = data.status
      if (!isFinalStatus(data.status)) {
        pollTimer = setTimeout(poll, 2000)
      }
      else {
        polling.value = false
      }
    }
    catch {
      polling.value = false
    }
  }

  pollTimer = setTimeout(poll, 2000)
}

onUnmounted(() => {
  if (pollTimer) clearTimeout(pollTimer)
})

useHead(computed(() => ({ title: problem.value?.title ? `${problem.value.title} — Leverage OJ` : '题目 — Leverage OJ' })))
</script>

<style scoped>
.loading-center {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.problem-page {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.problem-left {
  flex: 0 0 55%;
  min-width: 0;
}

.problem-right {
  flex: 0 0 calc(45% - 24px);
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: sticky;
  top: 24px;
}

.problem-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.problem-meta {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.problem-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.editor-header {
  display: flex;
  justify-content: flex-end;
}

.submit-area {
  margin-top: 4px;
}

.submission-result {
  margin-top: 4px;
}

.result-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.result-row:last-child {
  margin-bottom: 0;
}

.result-label {
  color: #666;
  font-size: 14px;
  min-width: 72px;
}

.breadcrumb {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #666;
}

.breadcrumb-sep {
  margin: 0 6px;
  color: #ccc;
}
</style>
