<template>
  <div v-if="loading" class="loading-center">
    <NSpin size="large" />
  </div>
  <div v-else-if="contest" class="contest-detail">
    <!-- 顶部信息 -->
    <div class="contest-header">
      <div class="contest-title-row">
        <NH2 style="margin: 0">{{ contest.title }}</NH2>
        <NTag :type="statusType" size="medium" :bordered="false">{{ statusLabel }}</NTag>
      </div>
      <div class="contest-times">
        <NText depth="3">开始：{{ dayjs(contest.startTime).format('YYYY-MM-DD HH:mm') }}</NText>
        <NText depth="3" style="margin-left: 24px">结束：{{ dayjs(contest.endTime).format('YYYY-MM-DD HH:mm') }}</NText>
      </div>
      <!-- 倒计时 -->
      <div v-if="statusLabel !== '已结束'" class="contest-countdown">
        <NText v-if="statusLabel === '未开始'" type="info">
          距开始还有：{{ remainTime }}
        </NText>
        <NText v-else type="success">
          距结束还有：{{ remainTime }}
        </NText>
      </div>
    </div>

    <NDivider />

    <!-- Tab 切换 -->
    <NTabs v-model:value="activeTab" type="line" animated>
      <!-- 题目 -->
      <NTabPane name="problems" tab="题目">
        <!-- 公告 -->
        <NAlert v-if="contest.description" type="info" title="公告" style="margin-bottom: 16px">
          <MarkdownView :content="contest.description" />
        </NAlert>
        <div class="problems-list">
          <NDataTable
            :columns="problemColumns"
            :data="contest.problems || []"
            :row-key="(row: any) => row.id"
            :bordered="true"
          />
          <NEmpty v-if="!contest.problems || contest.problems.length === 0" description="暂无题目" />
        </div>
      </NTabPane>

      <!-- 提交记录 -->
      <NTabPane name="submissions" tab="提交记录">
        <NDataTable
          :columns="submissionColumns"
          :data="mySubmissions"
          :loading="submissionsLoading"
          :bordered="true"
          :row-key="(row: any) => row.id"
        />
        <div v-if="submissionsTotal > submissionsPageSize" style="display: flex; justify-content: center; margin-top: 16px">
          <NPagination
            v-model:page="submissionsPage"
            :page-count="Math.ceil(submissionsTotal / submissionsPageSize)"
            @update:page="fetchSubmissions"
          />
        </div>
      </NTabPane>

      <!-- 排行榜 -->
      <NTabPane name="ranking" tab="排行榜">
        <NDataTable
          :columns="rankColumns"
          :data="rankData"
          :loading="rankLoading"
          :pagination="rankPagination"
          @update:page="onRankPageChange"
        />
      </NTabPane>

      <!-- 注册 -->
      <NTabPane name="register" tab="注册">
        <div class="register-panel">
          <NAlert v-if="registrationClosed" type="warning" title="报名已截止" style="max-width: 400px">
            当前时间已超过报名截止时间，无法继续报名。
          </NAlert>
          <NCard v-else style="max-width: 400px">
            <div class="register-content">
              <NText>参加此竞赛可查看题目并参与排名。</NText>
              <NButton
                v-if="!registered"
                type="primary"
                size="large"
                :loading="registering"
                style="margin-top: 16px"
                @click="handleRegister"
              >
                参加竞赛
              </NButton>
              <NAlert v-else type="success" title="已参加" style="margin-top: 16px">
                您已成功参加此竞赛。
              </NAlert>
            </div>
          </NCard>
        </div>
      </NTabPane>
    </NTabs>
  </div>
  <div v-else>
    <NResult status="404" title="竞赛不存在" />
  </div>
</template>

<script setup lang="ts">
import { h } from 'vue'
import type { DataTableColumns } from 'naive-ui'
import { useMessage } from 'naive-ui'
import dayjs from 'dayjs'
import type { Contest, RankItem, Submission } from '~/types'
import { LANGUAGE_LABEL, isFinalStatus, memoryToKB } from '~/types'

definePageMeta({
  layout: 'default',
  middleware: 'auth',
})

const route = useRoute()
const contestId = computed(() => Number(route.params.id))
const message = useMessage()
const contestsApi = useContestsApi()

const contest = ref<Contest | null>(null)
const loading = ref(true)
const activeTab = ref('problems')
const nowTs = ref(Date.now())
const registrationClosed = computed(() => {
  const end = contest.value?.registrationEndTime
  if (!end) return false
  return nowTs.value > dayjs(end).valueOf()
})

// 竞赛状态
const statusLabel = computed(() => {
  if (!contest.value) return ''
  const now = dayjs()
  const start = dayjs(contest.value.startTime)
  const end = dayjs(contest.value.endTime)
  if (now.isBefore(start)) return '未开始'
  if (now.isAfter(end)) return '已结束'
  return '进行中'
})

const statusType = computed<'default' | 'info' | 'success' | 'warning' | 'error'>(() => {
  if (statusLabel.value === '进行中') return 'success'
  if (statusLabel.value === '已结束') return 'default'
  return 'info'
})

// 倒计时
const remainTime = ref('')
let countdownTimer: ReturnType<typeof setInterval> | null = null

function updateCountdown() {
  nowTs.value = Date.now()
  if (!contest.value) return
  const now = dayjs(nowTs.value)
  const start = dayjs(contest.value.startTime)
  const end = dayjs(contest.value.endTime)
  const target = now.isBefore(start) ? start : end
  const diff = target.diff(now, 'second')
  if (diff <= 0) {
    remainTime.value = '0秒'
    return
  }
  const hours = Math.floor(diff / 3600)
  const minutes = Math.floor((diff % 3600) / 60)
  const seconds = diff % 60
  remainTime.value = `${hours}小时 ${minutes}分 ${seconds}秒`
}

// 题目列表列
const problemColumns: DataTableColumns = [
  {
    title: '序号',
    key: 'label',
    width: 60,
    render(_row, index) {
      return h('span', { style: 'font-weight: 700; color: #666;' }, String.fromCharCode(65 + index))
    },
  },
  {
    title: '标题',
    key: 'title',
    render(row: any, index: number) {
      return h(
        resolveComponent('NButton') as any,
        {
          text: true,
          type: 'primary',
          onClick: () => navigateTo(`/contests/${contest.value!.id}/problems/${row.id}`),
        },
        { default: () => `${String.fromCharCode(65 + index)}. ${row.title}` },
      )
    },
  },
  {
    title: '通过',
    key: 'accepts',
    width: 80,
    render(row: any) { return h('span', row.accepts ?? 0) },
  },
  {
    title: '提交',
    key: 'submits',
    width: 80,
    render(row: any) { return h('span', row.submits ?? 0) },
  },
]

// 排行榜
const rankData = ref<RankItem[]>([])
const rankLoading = ref(false)
const rankPage = ref(1)
const rankPageSize = ref(20)
const rankTotal = ref(0)

const rankPagination = computed(() => ({
  page: rankPage.value,
  pageSize: rankPageSize.value,
  itemCount: rankTotal.value,
  showSizePicker: false,
}))

const rankColumns: DataTableColumns<RankItem> = [
  {
    title: '排名',
    key: 'rank',
    width: 80,
    render(row) {
      return h('span', { style: 'font-weight: 600;' }, `#${row.rank}`)
    },
  },
  {
    title: '用户名',
    key: 'username',
    render(row) {
      return h(
        'a',
        {
          style: 'color: #2080f0; cursor: pointer;',
          onClick: () => navigateTo(`/users/${row.userId}`),
        },
        row.username,
      )
    },
  },
  {
    title: '得分',
    key: 'score',
    width: 100,
    render(row) {
      return h('span', { style: 'font-weight: 600; color: #18a058;' }, String(row.score))
    },
  },
]

async function fetchRanking() {
  if (!contest.value) return
  rankLoading.value = true
  try {
    const res = await contestsApi.getRanking(contestId.value, rankPage.value, rankPageSize.value)
    const data = res.data ?? res
    rankData.value = Array.isArray(data) ? data : (data as any).items ?? []
    rankTotal.value = (data as any).total ?? rankData.value.length
  }
  catch (e) {
    console.error(e)
  }
  finally {
    rankLoading.value = false
  }
}

function onRankPageChange(page: number) {
  rankPage.value = page
  fetchRanking()
}

// 我的提交记录
const mySubmissions = ref<Submission[]>([])
const submissionsLoading = ref(false)
const submissionsPage = ref(1)
const submissionsPageSize = ref(20)
const submissionsTotal = ref(0)

async function fetchSubmissions() {
  submissionsLoading.value = true
  try {
    const res = await contestsApi.getContestSubmissions(contestId.value, {
      page: submissionsPage.value,
      perPage: submissionsPageSize.value,
    })
    const data = res.data ?? res
    mySubmissions.value = (data as any).items ?? (Array.isArray(data) ? data : [])
    submissionsTotal.value = (data as any).total ?? mySubmissions.value.length
  }
  catch (e) {
    console.error(e)
  }
  finally {
    submissionsLoading.value = false
  }
}

const submissionColumns: DataTableColumns<Submission> = [
  {
    title: 'ID',
    key: 'id',
    width: 80,
    render(row) {
      return h(
        resolveComponent('NButton') as any,
        { text: true, type: 'primary', onClick: () => navigateTo(`/submissions/${row.id}`) },
        { default: () => `#${row.id}` },
      )
    },
  },
  {
    title: '题目',
    key: 'problem',
    render(row) {
      return row.problem ? `${row.problem.prefix || ''}${row.problem.logicId || ''} ${row.problem.title}` : '-'
    },
  },
  {
    title: '语言',
    key: 'language',
    width: 100,
    render(row) { return LANGUAGE_LABEL[row.language] ?? String(row.language) },
  },
  {
    title: '状态',
    key: 'status',
    width: 120,
    render(row) {
      return h(resolveComponent('StatusTag') as any, { status: row.status })
    },
  },
  {
    title: '时间',
    key: 'time',
    width: 100,
    render(row) { return row.time != null ? `${row.time}ms` : '-' },
  },
  {
    title: '内存',
    key: 'memory',
    width: 100,
    render(row) { return memoryToKB(row.memory) },
  },
]

// 注册
const registered = ref(false)
const registering = ref(false)

async function handleRegister() {
  registering.value = true
  try {
    await contestsApi.register(contestId.value)
    registered.value = true
    message.success('成功参加竞赛！')
  }
  catch (e: any) {
    message.error(e?.response?.data?.message || e?.message || '参加竞赛失败')
  }
  finally {
    registering.value = false
  }
}

// Watch tab change to load data lazily
watch(activeTab, (tab) => {
  if (tab === 'ranking' && rankData.value.length === 0) {
    fetchRanking()
  }
  if (tab === 'submissions' && mySubmissions.value.length === 0) {
    fetchSubmissions()
  }
})

onMounted(async () => {
  try {
    const res = await contestsApi.get(contestId.value)
    contest.value = res.data ?? res
  }
  catch (e) {
    console.error(e)
  }
  finally {
    loading.value = false
  }
  // 启动倒计时
  updateCountdown()
  countdownTimer = setInterval(updateCountdown, 1000)
})

onUnmounted(() => {
  if (countdownTimer) clearInterval(countdownTimer)
})

useHead(computed(() => ({ title: contest.value?.title ? `${contest.value.title} — Leverage OJ` : '竞赛 — Leverage OJ' })))
</script>

<style scoped>
.loading-center {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.contest-detail {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.contest-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.contest-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.contest-times {
  display: flex;
  flex-wrap: wrap;
}

.contest-countdown {
  font-size: 15px;
  font-weight: 500;
}

.problems-list {
  margin-top: 8px;
}

.register-panel {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}

.register-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
</style>
