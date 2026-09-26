<template>
  <div v-if="loading" class="loading-center">
    <NSpin size="large" />
  </div>
  <div v-else-if="problem" class="problem-page">
    <!-- 顶部倒计时 -->
    <div v-if="contestData" class="contest-timer-bar" :class="timerClass">
      <span class="timer-label">{{ timerLabel }}</span>
      <span class="timer-value">{{ timerDisplay }}</span>
    </div>

    <div class="problem-content-area">
    <!-- 左侧：题目信息 -->
    <div class="problem-left">
      <div class="problem-header">
        <div class="breadcrumb">
          <NButton text type="primary" @click="navigateTo(`/contests/${contestId}`)">
            返回竞赛
          </NButton>
          <span class="breadcrumb-sep"> / </span>
          <span>{{ problemLetter }}. {{ problem.title }}</span>
        </div>
        <NH2 style="margin: 8px 0 0">{{ problemLetter }}. {{ problem.title }}</NH2>
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

      <MarkdownView :content="problem.content ?? problem.description ?? ''" />
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
    </div><!-- end problem-content-area -->
  </div>
  <div v-else>
    <NResult status="404" title="题目不存在" />
  </div>
</template>

<script setup lang="ts">
import type { Problem, Contest } from '~/types'
import { LANGUAGE_OPTIONS, Language, isFinalStatus, SubmissionStatus } from '~/types'

definePageMeta({
  layout: 'default',
})

const route = useRoute()
const contestId = computed(() => Number(route.params.id))
const problemId = computed(() => Number(route.params.pid))

const problemsApi = useProblemsApi()
const submissionsApi = useSubmissionsApi()
const contestsApi = useContestsApi()

const problem = ref<Problem | null>(null)
const contestData = ref<Contest | null>(null)
const loading = ref(true)

const language = ref(Language.CPP)
const code = ref('')
const submitting = ref(false)
const submissionId = ref<number | null>(null)
const submissionStatus = ref(SubmissionStatus.PENDING)
const { polling, start: startPolling, stop: stopPolling } = useSubmissionPolling(
  id => submissionsApi.getStatus(id),
  status => { submissionStatus.value = status },
  isFinalStatus,
)

const languageOptions = LANGUAGE_OPTIONS

// 编辑器语言映射（数字ID → 编辑器语言名）
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

// 竞赛题目序号（A, B, C...）
const problemLetter = computed(() => {
  if (!contestData.value?.problems || !problem.value) return ''
  const idx = contestData.value.problems.findIndex((p: any) => p.problemId === problem.value!.id)
  return idx >= 0 ? String.fromCharCode(65 + idx) : ''
})

// ── 倒计时 ──────────────────────────────────────────────
const now = ref(Date.now())
let timerInterval: ReturnType<typeof setInterval> | null = null

const timerLabel = computed(() => {
  if (!contestData.value) return ''
  const start = new Date(contestData.value.startTime).getTime()
  const end   = new Date(contestData.value.endTime).getTime()
  const t = now.value
  if (t < start) return '距开始'
  if (t < end)   return '距结束'
  return '竞赛已结束'
})

const timerClass = computed(() => {
  if (!contestData.value) return ''
  const end = new Date(contestData.value.endTime).getTime()
  const diff = end - now.value
  if (diff <= 0) return 'timer-ended'
  if (diff < 10 * 60 * 1000) return 'timer-urgent'   // < 10分钟
  if (diff < 30 * 60 * 1000) return 'timer-warning'  // < 30分钟
  return 'timer-normal'
})

const timerDisplay = computed(() => {
  if (!contestData.value) return ''
  const start = new Date(contestData.value.startTime).getTime()
  const end   = new Date(contestData.value.endTime).getTime()
  const t = now.value
  const diff = t < start ? start - t : t < end ? end - t : 0
  if (diff <= 0) return '--:--:--'
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

onMounted(async () => {
  timerInterval = setInterval(() => { now.value = Date.now() }, 1000)
  try {
    const [problemRes, contestRes] = await Promise.all([
      problemsApi.get(problemId.value),
      contestsApi.get(contestId.value),
    ])
    problem.value = (problemRes as any).data ?? problemRes
    contestData.value = (contestRes as any).data ?? contestRes
  }
  catch (e) {
    console.error(e)
  }
  finally {
    loading.value = false
  }
})

async function handleSubmit() {
  if (!code.value.trim()) return
  submitting.value = true
  submissionId.value = null
  submissionStatus.value = SubmissionStatus.PENDING
  stopPolling()

  try {
    const res = await submissionsApi.create({
      problemId: problemId.value,
      language: language.value,
      code: code.value,
      contestId: contestId.value,
    })
    const sub = (res as any).data ?? res
    submissionId.value = sub.id
    submissionStatus.value = sub.status
    startPolling(sub.id, sub.status)
  }
  catch (e) {
    console.error(e)
  }
  finally {
    submitting.value = false
  }
}

watch([contestId, problemId], stopPolling)

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
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

.contest-timer-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 8px 20px;
  border-radius: 8px;
  margin-bottom: 16px;
  font-weight: 600;
  font-size: 15px;
  width: 100%;
}
.timer-normal  { background: #e8f5e9; color: #2e7d32; }
.timer-warning { background: #fff8e1; color: #f57f17; }
.timer-urgent  { background: #fce4ec; color: #c62828; animation: pulse 1s ease-in-out infinite; }
.timer-ended   { background: #f5f5f5; color: #9e9e9e; }
.timer-label { font-size: 13px; opacity: 0.8; }
.timer-value { font-family: 'JetBrains Mono', 'Courier New', monospace; font-size: 20px; letter-spacing: 2px; }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.problem-page {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.problem-content-area {
  display: flex;
  gap: 24px;
  align-items: flex-start;
  width: 100%;
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
