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
    </div>

    <NDivider />

    <!-- Tab 切换 -->
    <NTabs v-model:value="activeTab" type="line" animated>
      <!-- 题目 -->
      <NTabPane name="problems" tab="题目">
        <div class="problems-list">
          <NList bordered>
            <NListItem
              v-for="(problem, index) in contest.problems"
              :key="problem.id"
              class="problem-item"
              @click="navigateTo(`/contests/${contest.id}/problems/${problem.id}`)"
            >
              <div class="problem-row">
                <span class="problem-letter">{{ String.fromCharCode(65 + index) }}</span>
                <NButton text type="primary">{{ problem.title }}</NButton>
              </div>
            </NListItem>
            <NListItem v-if="!contest.problems || contest.problems.length === 0">
              <NEmpty description="暂无题目" />
            </NListItem>
          </NList>
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
          <NCard style="max-width: 400px">
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
import type { Contest, RankItem } from '~/types'

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
    rankData.value = Array.isArray(res) ? res : []
    rankTotal.value = rankData.value.length
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
    message.error(e?.message || '参加竞赛失败')
  }
  finally {
    registering.value = false
  }
}

// Watch tab change to load ranking lazily
watch(activeTab, (tab) => {
  if (tab === 'ranking' && rankData.value.length === 0) {
    fetchRanking()
  }
})

onMounted(async () => {
  try {
    contest.value = await contestsApi.get(contestId.value)
  }
  catch (e) {
    console.error(e)
  }
  finally {
    loading.value = false
  }
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

.problems-list {
  margin-top: 8px;
}

.problem-item {
  cursor: pointer;
}

.problem-item:hover {
  background: #f5f5f5;
}

.problem-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.problem-letter {
  font-weight: 700;
  color: #666;
  font-size: 16px;
  min-width: 24px;
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
