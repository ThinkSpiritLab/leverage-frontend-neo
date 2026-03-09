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

    <!-- 编译错误 -->
    <NCard v-if="compileError" title="编译错误" style="margin-bottom: 24px">
      <NCode :code="compileError" language="text" show-line-numbers />
    </NCard>

    <!-- 每个测试点结果 -->
    <NCard v-if="caseResults.length > 0" title="测试点详情" style="margin-bottom: 24px">
      <NDataTable
        :columns="caseColumns"
        :data="caseTableData"
        :bordered="true"
        :single-line="false"
        size="small"
      />
    </NCard>

    <NCard title="提交代码">
      <CodeEditor
        v-model="codeContent"
        :language="LANGUAGE_NAME[submission.language] ?? 'cpp'"
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
import type { DataTableColumns } from 'naive-ui'
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
const caseResults = ref<Array<{ kind: string; time: number | null; memory: number | null; extraMessage?: string }>>([])
const compileError = ref('')

import { LANGUAGE_LABEL, LANGUAGE_NAME } from '~/types'

/** JudgeResultKind → 短标签 */
function kindShort(kind: string): string {
  const map: Record<string, string> = {
    Accepted: 'AC',
    WrongAnswer: 'WA',
    PresentationError: 'PE',
    TimeLimitExceeded: 'TLE',
    MemoryLimitExceeded: 'MLE',
    OutpuLimitExceeded: 'OLE',
    RuntimeError: 'RE',
    CompileError: 'CE',
    CompileTimeLimitExceeded: 'CRLE',
    CompileMemoryLimitExceed: 'CRLE',
    CompileFileLimitExceed: 'CRLE',
    SystemError: 'SE',
    SystemTimeLimitExceed: 'SE',
    SystemMemoryLimitExceed: 'SE',
    SystemOutpuLimitExceeded: 'SE',
    SystemRuntimeError: 'SE',
    SystemCompileError: 'SE',
    Unjudged: '?',
  }
  return map[kind] ?? kind.slice(0, 4)
}

function kindClass(kind: string): string {
  if (kind === 'Accepted') return 'ac'
  if (['WrongAnswer', 'PresentationError'].includes(kind)) return 'wa'
  if (kind.startsWith('TimeLimitExceeded')) return 'tle'
  if (kind.startsWith('MemoryLimitExceeded')) return 'mle'
  if (kind.startsWith('RuntimeError')) return 're'
  if (kind.startsWith('Compile')) return 'ce'
  return 'se'
}

const KIND_TAG_TYPE: Record<string, 'success' | 'error' | 'warning' | 'info' | 'default'> = {
  Accepted: 'success',
  WrongAnswer: 'error',
  PresentationError: 'warning',
  TimeLimitExceeded: 'warning',
  MemoryLimitExceeded: 'warning',
  OutpuLimitExceeded: 'warning',
  RuntimeError: 'error',
  CompileError: 'default',
  SystemError: 'error',
  Unjudged: 'info',
}

function kindTagType(kind: string): 'success' | 'error' | 'warning' | 'info' | 'default' {
  return KIND_TAG_TYPE[kind] ?? (kind.startsWith('System') ? 'error' : kind.startsWith('Compile') ? 'default' : 'info')
}

const caseTableData = computed(() =>
  caseResults.value.map((c, i) => ({ index: i + 1, ...c })),
)

const caseColumns: DataTableColumns<any> = [
  { title: '序号', key: 'index', width: 70, align: 'center' },
  {
    title: '结果',
    key: 'kind',
    width: 120,
    align: 'center',
    render(row) {
      return h(NTag, { type: kindTagType(row.kind), size: 'small', bordered: false }, () => kindShort(row.kind))
    },
  },
  {
    title: '时间',
    key: 'time',
    width: 100,
    align: 'center',
    render(row) {
      return row.time != null ? `${row.time}ms` : '-'
    },
  },
  {
    title: '内存',
    key: 'memory',
    width: 120,
    align: 'center',
    render(row) {
      return row.memory != null ? `${(row.memory / 1024 / 1024).toFixed(2)} MB` : '-'
    },
  },
  {
    title: '信息',
    key: 'extraMessage',
    ellipsis: { tooltip: true },
    render(row) {
      return row.extraMessage || '-'
    },
  },
]

function parseMisc(data: any) {
  codeContent.value = data?.misc?.code || data?.code || ''
  compileError.value = data?.misc?.compileErrorMsg || data?.compileErrorMsg || ''
  try {
    const raw = data?.misc?.judgeResult
    if (raw) {
      caseResults.value = typeof raw === 'string' ? JSON.parse(raw) : raw
    }
  }
  catch { /* ignore */ }
}

onMounted(async () => {
  try {
    const res = await submissionsApi.get(submissionId.value)
    submission.value = res.data
    parseMisc(res.data)
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
        parseMisc(full.data)
        return
      }
      pollTimer = setTimeout(poll, 2000)
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
