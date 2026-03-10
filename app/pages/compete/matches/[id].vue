<template>
  <div class="match-detail-page">
    <NSpin :show="loading">
      <template v-if="match">
        <!-- 面包屑 -->
        <NBreadcrumb style="margin-bottom: 16px">
          <NBreadcrumbItem @click="navigateTo('/compete')">Bot 对战</NBreadcrumbItem>
          <NBreadcrumbItem v-if="match.game" @click="navigateTo(`/compete/${match.game.id}`)">
            {{ match.game.name }}
          </NBreadcrumbItem>
          <NBreadcrumbItem>对局 #{{ match.id }}</NBreadcrumbItem>
        </NBreadcrumb>

        <!-- 运行中提示 -->
        <NAlert
          v-if="isRunning"
          type="info"
          :show-icon="true"
          style="margin-bottom: 16px"
        >
          对局运行中，每 3 秒自动刷新...
        </NAlert>

        <!-- 对局基本信息 -->
        <NCard title="对局详情" style="margin-bottom: 16px">
          <NDescriptions :columns="2" bordered>
            <NDescriptionsItem label="对局 ID">
              #{{ match.id }}
            </NDescriptionsItem>
            <NDescriptionsItem label="游戏">
              {{ match.game?.name || match.gameId || '-' }}
            </NDescriptionsItem>
            <NDescriptionsItem label="状态">
              <NTag :type="statusType" size="small" :bordered="false">
                {{ statusLabel }}
              </NTag>
            </NDescriptionsItem>
            <NDescriptionsItem label="创建时间">
              {{ match.createdAt ? new Date(match.createdAt).toLocaleString('zh-CN') : '-' }}
            </NDescriptionsItem>
            <NDescriptionsItem v-if="match.externalJobId" label="外部任务 ID">
              <NText code>{{ match.externalJobId }}</NText>
            </NDescriptionsItem>
            <NDescriptionsItem label="完成时间">
              {{ match.finishedAt ? new Date(match.finishedAt).toLocaleString('zh-CN') : '-' }}
            </NDescriptionsItem>
          </NDescriptions>
        </NCard>

        <!-- 参与 Bot -->
        <NCard title="参与 Bot" style="margin-bottom: 16px">
          <NDataTable
            :columns="gamerColumns"
            :data="gamerList"
            :bordered="false"
          />
        </NCard>

        <!-- 对局结果（COMPLETED 时展示） -->
        <template v-if="isCompleted && parsedResult">
          <!-- 得分汇总 -->
          <NCard title="对局结果" style="margin-bottom: 16px">
            <NDescriptions :columns="2" bordered style="margin-bottom: 12px">
              <NDescriptionsItem v-if="parsedResult.verdict" label="裁决">
                <NTag type="info" size="small" :bordered="false">
                  {{ parsedResult.verdict }}
                </NTag>
              </NDescriptionsItem>
              <NDescriptionsItem v-if="parsedResult.roundCount !== undefined" label="总回合数">
                {{ parsedResult.roundCount }}
              </NDescriptionsItem>
            </NDescriptions>

            <template v-if="parsedResult.finalResult">
              <NDivider title-placement="left" style="margin: 12px 0">最终得分</NDivider>
              <NDataTable
                :columns="scoreColumns"
                :data="scoreRows"
                :bordered="false"
                size="small"
              />
            </template>
          </NCard>

          <!-- 游戏回放 -->
          <template v-if="gameLog">
            <NCard title="游戏回放" style="margin-bottom: 16px">
              <BotzoneGameRenderer
                :game-log="gameLog"
                :renderer-html="match.game?.rendererHtml"
                :current-round="replayRound"
              />
            </NCard>
          </template>
        </template>

        <!-- 错误信息 -->
        <NCard v-if="match.error || (isFailed && match.result)" title="错误信息" style="margin-bottom: 16px">
          <NAlert type="error">
            <pre style="white-space: pre-wrap; margin: 0">{{ match.error || match.result }}</pre>
          </NAlert>
        </NCard>
      </template>

      <NResult v-else-if="!loading" status="404" title="对局不存在">
        <template #footer>
          <NButton @click="navigateTo('/compete')">返回对战大厅</NButton>
        </template>
      </NResult>
    </NSpin>
  </div>
</template>

<script setup lang="ts">
import { h } from 'vue'
import { NTag } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import type { BotzoneGameLog } from '~/types/botzone'

definePageMeta({
  layout: 'default',
  middleware: 'auth',
})

const route = useRoute()
const matchId = computed(() => Number(route.params.id))
const competeApi = useCompeteApi()

// 回放当前回合（供 GameRenderer 使用）
const replayRound = ref(0)

const match = ref<any>(null)
const loading = ref(false)
let pollingTimer: ReturnType<typeof setInterval> | null = null

async function fetchMatch() {
  loading.value = true
  try {
    const res = await competeApi.getMatch(matchId.value)
    match.value = res.data
    // 如果对局已结束，停止轮询
    const status = (res.data?.status || '').toUpperCase()
    if (status === 'COMPLETED' || status === 'FAILED') {
      stopPolling()
    }
  }
  catch (e) {
    console.error(e)
  }
  finally {
    loading.value = false
  }
}

function startPolling() {
  if (pollingTimer) return
  pollingTimer = setInterval(fetchMatch, 3000)
}

function stopPolling() {
  if (pollingTimer) {
    clearInterval(pollingTimer)
    pollingTimer = null
  }
}

onMounted(async () => {
  await fetchMatch()
  // 运行中的对局自动轮询
  const status = (match.value?.status || '').toUpperCase()
  if (status === 'PENDING' || status === 'RUNNING') {
    startPolling()
  }
})

onBeforeUnmount(() => {
  stopPolling()
})

// ─── 状态相关 ─────────────────────────────────────────────────────────────────
const isRunning = computed(() => {
  const s = (match.value?.status || '').toUpperCase()
  return s === 'PENDING' || s === 'RUNNING'
})

const isCompleted = computed(() => {
  return (match.value?.status || '').toUpperCase() === 'COMPLETED'
})

const isFailed = computed(() => {
  return (match.value?.status || '').toUpperCase() === 'FAILED'
})

const statusType = computed((): 'default' | 'info' | 'success' | 'warning' | 'error' => {
  const statusMap: Record<string, 'default' | 'info' | 'success' | 'warning' | 'error'> = {
    PENDING: 'default',
    RUNNING: 'info',
    COMPLETED: 'success',
    FAILED: 'error',
  }
  return statusMap[(match.value?.status || '').toUpperCase()] || 'default'
})

const statusLabel = computed(() => {
  const labelMap: Record<string, string> = {
    PENDING: '等待中',
    RUNNING: '运行中',
    COMPLETED: '已完成',
    FAILED: '失败',
  }
  const s = (match.value?.status || '').toUpperCase()
  return labelMap[s] || match.value?.status || '-'
})

// ─── 结果解析 ─────────────────────────────────────────────────────────────────
const parsedResult = computed<{ verdict?: string, finalResult?: Record<string, number>, roundCount?: number } | null>(() => {
  if (!match.value?.result) return null
  try {
    if (typeof match.value.result === 'string') {
      return JSON.parse(match.value.result)
    }
    return match.value.result
  }
  catch {
    return null
  }
})

// 构建 BotzoneGameLog（如果 result 包含 rounds 数据）
const gameLog = computed<BotzoneGameLog | null>(() => {
  if (!parsedResult.value) return null
  const r = parsedResult.value as any
  if (!r.rounds || !Array.isArray(r.rounds) || r.rounds.length === 0) return null
  return {
    gameId: String(match.value?.gameId || ''),
    rounds: r.rounds,
    finalResult: r.finalResult || {},
    verdict: r.verdict || '',
  }
})

// 得分表格行数据：将 finalResult map 转为数组
const scoreRows = computed(() => {
  const fr = parsedResult.value?.finalResult
  if (!fr) return []
  // 尝试用 gamerList 名称匹配 Bot ID
  const gamerMap = Object.fromEntries(gamerList.value.map((g: any) => [String(g.id), g]))
  return Object.entries(fr).map(([key, score]) => {
    const gamer = gamerMap[key]
    return {
      key,
      name: gamer?.name || `Bot#${key}`,
      score,
    }
  })
})

const scoreColumns: DataTableColumns<any> = [
  { title: 'Bot 名称', key: 'name' },
  {
    title: '得分',
    key: 'score',
    render(row) {
      return h('span', { style: 'font-weight: 600' }, String(row.score))
    },
  },
]

// ─── 参与 Bot 表格 ────────────────────────────────────────────────────────────
const gamerList = computed(() => {
  if (!match.value) return []
  const gamers = match.value.gamers || match.value.gamerIds || []
  return gamers.map((g: any, index: number) =>
    typeof g === 'object' ? g : { id: g, name: `Bot#${g}`, index },
  )
})

const gamerColumns: DataTableColumns<any> = [
  {
    title: 'Bot 名称',
    key: 'name',
  },
  {
    title: '语言',
    key: 'language',
    render(row) {
      if (!row.language) return h('span', '-')
      return h(NTag, { size: 'small', bordered: false }, { default: () => row.language })
    },
  },
  {
    title: 'ELO',
    key: 'elo',
    render(row) {
      return h('span', row.elo !== undefined ? String(row.elo) : '-')
    },
  },
  {
    title: '创建者',
    key: 'user',
    render(row) {
      return h('span', row.user?.username || '-')
    },
  },
]

useHead(computed(() => ({ title: `对战记录 #${matchId.value} — Leverage OJ` })))
</script>

<style scoped>
.match-detail-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
