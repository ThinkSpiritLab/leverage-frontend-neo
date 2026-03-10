<template>
  <div class="match-detail-page">
    <NSpin :show="loading">
      <template v-if="match">
        <!-- 面包屑 -->
        <NBreadcrumb style="margin-bottom: 16px">
          <NBreadcrumbItem @click="navigateTo('/compete')">Bot 对战</NBreadcrumbItem>
          <NBreadcrumbItem v-if="match.game" @click="navigateTo(`/compete/games/${match.game.id}`)">
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
              {{ (isCompleted || isFailed) && match.updatedAt ? new Date(match.updatedAt).toLocaleString('zh-CN') : '-' }}
            </NDescriptionsItem>
          </NDescriptions>
        </NCard>

        <!-- 人类玩家输入区 -->
        <NCard
          v-if="myHumanGamer && match?.status === 1"
          style="margin-bottom: 16px; border: 2px solid #18a058"
        >
          <template #header>
            <NSpace align="center">
              <span>🎮 你的回合</span>
              <NTag size="small" type="success" :bordered="false">
                你是 {{ myHumanGamer.index === 0 ? '先手 ✕' : '后手 ○' }}
              </NTag>
            </NSpace>
          </template>

          <template v-if="humanTurn">
            <!-- Countdown -->
            <NSpace align="center" style="margin-bottom:12px">
              <NText type="success" strong>轮到你了！</NText>
              <NTag
                :type="countdownSec > 30 ? 'success' : countdownSec > 10 ? 'warning' : 'error'"
                size="small"
              >
                ⏱ {{ countdownSec }}s
              </NTag>
            </NSpace>

            <!-- Renderer iframe (preferred: handles both visual & interactive) -->
            <div v-if="match.game?.rendererHtml" style="margin-bottom:12px">
              <iframe
                ref="humanRendererRef"
                :srcdoc="humanRendererSrcdoc"
                sandbox="allow-scripts"
                style="width:100%;height:420px;border:1px solid #e0e0e6;border-radius:8px"
                @load="onHumanRendererLoad"
              />
              <NText v-if="!iframeInteractive" depth="3" style="font-size:12px;display:block;margin-top:4px">
                渲染器未声明交互支持，请使用下方输入框
              </NText>
            </div>

            <!-- Inline TicTacToe board (fallback when no rendererHtml) -->
            <div v-else-if="tttBoard" class="ttt-board" style="margin-bottom:16px">
              <div
                v-for="(cell, i) in tttBoard"
                :key="i"
                class="ttt-cell"
                :class="{ 'can-click': cell === 0 }"
                @click="cell === 0 && !submittingMove && clickCell(i)"
              >
                <span v-if="cell === 1" style="color:#d03050;font-size:22px;font-weight:bold">✕</span>
                <span v-else-if="cell === 2" style="color:#2080f0;font-size:22px;font-weight:bold">○</span>
                <span v-else style="color:#aaa;font-size:12px">{{ i }}</span>
              </div>
            </div>

            <!-- JSON text input: shown when renderer isn't interactive, and no visual board -->
            <template v-if="!iframeInteractive">
              <details v-if="match.game?.rendererHtml" style="margin-bottom:8px">
                <summary style="cursor:pointer;font-size:13px;color:#888">查看棋盘原始数据</summary>
                <pre style="background:#f5f5f5;padding:8px;border-radius:4px;font-size:12px;margin-top:4px;overflow:auto;max-height:160px">{{ JSON.stringify(humanTurn.gameState, null, 2) }}</pre>
              </details>
              <NSpace v-if="!match.game?.rendererHtml || !tttBoard" align="center" style="margin-top:8px">
                <NInput
                  v-model:value="humanMove"
                  placeholder='输入移动（如 {"0": 4}）'
                  style="width: 300px; font-family: monospace"
                  @keyup.enter="submitHumanMove"
                />
                <NButton type="primary" :loading="submittingMove" @click="submitHumanMove">提交</NButton>
              </NSpace>
            </template>
          </template>
          <template v-else>
            <NSpace align="center">
              <NSpin size="small" />
              <NText depth="3">等待对手移动中…</NText>
            </NSpace>
          </template>
        </NCard>

        <!-- 胜者 Banner -->
        <NAlert
          v-if="isCompleted && winnerInfo"
          :type="winnerInfo.isDraw ? 'warning' : 'success'"
          :show-icon="false"
          style="margin-bottom:16px;font-size:15px"
        >
          <NSpace align="center">
            <span style="font-size:20px">{{ winnerInfo.isDraw ? '🤝' : '🏆' }}</span>
            <NText strong style="font-size:15px">{{ winnerInfo.isDraw ? '平局！' : `胜者：${winnerInfo.names.join('、')}` }}</NText>
          </NSpace>
        </NAlert>

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
import { NTag, NButton } from 'naive-ui'
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

// status is a number: 0=PENDING, 1=RUNNING, 2=FINISHED, 3=ERROR
const MATCH_STATUS = { PENDING: 0, RUNNING: 1, FINISHED: 2, ERROR: 3 }

async function fetchMatch() {
  loading.value = true
  try {
    const res = await competeApi.getMatch(matchId.value)
    match.value = res.data
    // 如果对局已结束，停止轮询
    const s = res.data?.status
    if (s === MATCH_STATUS.FINISHED || s === MATCH_STATUS.ERROR) {
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
  const s = match.value?.status
  if (s === MATCH_STATUS.PENDING || s === MATCH_STATUS.RUNNING) {
    startPolling()
  }
})

onBeforeUnmount(() => {
  stopPolling()
})

// ─── 状态相关 ─────────────────────────────────────────────────────────────────
const isRunning = computed(() =>
  match.value?.status === MATCH_STATUS.PENDING || match.value?.status === MATCH_STATUS.RUNNING
)

const isCompleted = computed(() => match.value?.status === MATCH_STATUS.FINISHED)

const isFailed = computed(() => match.value?.status === MATCH_STATUS.ERROR)

const statusType = computed((): 'default' | 'info' | 'success' | 'error' => {
  const m: Record<number, 'default' | 'info' | 'success' | 'error'> = {
    0: 'default', 1: 'info', 2: 'success', 3: 'error',
  }
  return m[match.value?.status as number] ?? 'default'
})

const statusLabel = computed(() => {
  const m: Record<number, string> = {
    0: '等待中', 1: '运行中', 2: '已完成', 3: '失败',
  }
  return m[match.value?.status as number] ?? '-'
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
    // botzone-neo format: { round, judgeCmd, botResponses }
    // frontend type expects: { round, judgerDisplay, botOutputs }
    rounds: r.rounds.map((rd: any) => ({
      round: rd.round,
      judgerDisplay: rd.judgeCmd?.display ?? rd.judgerDisplay,
      botOutputs: rd.botResponses ?? rd.botOutputs ?? {},
    })),
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

// ELO delta: gamerId → delta (from elo_history or providerMeta)
const eloDeltas = computed<Record<string, number>>(() => {
  const meta = match.value?.providerMeta as any
  if (meta?.eloChanges) return meta.eloChanges
  return {}
})

// Winner info from finalResult
const winnerInfo = computed(() => {
  const fr = parsedResult.value?.finalResult
  if (!fr) return null
  const gamerMap = Object.fromEntries(gamerList.value.map((g: any) => [String(g.id), g]))
  const scores = Object.entries(fr) as [string, number][]
  const maxScore = Math.max(...scores.map(([, v]) => v))
  const minScore = Math.min(...scores.map(([, v]) => v))
  const isDraw = maxScore === minScore
  const winnerIds = isDraw ? [] : scores.filter(([, v]) => v === maxScore).map(([k]) => k)
  return {
    isDraw,
    names: winnerIds.map(id => gamerMap[id]?.name || `Bot#${id}`),
  }
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
  // links: [{ index, gamerId, gamer: { id, title/name, language, elo, user } }]
  if (Array.isArray(match.value.links) && match.value.links.length > 0) {
    return match.value.links
      .sort((a: any, b: any) => a.index - b.index)
      .map((link: any) => ({
        id: link.gamerId,
        name: link.gamer?.name || link.gamer?.title || `Bot#${link.index}`,
        language: link.gamer?.language,
        type: link.gamer?.type,
        elo: link.gamer?.elo ?? 1200,
        user: link.gamer?.user,
        userId: link.gamer?.userId ?? link.gamer?.user?.id,
        index: link.index,
      }))
  }
  // fallback for older matches without links
  const gamers = match.value.gamers || match.value.gamerIds || []
  return gamers.map((g: any, index: number) =>
    typeof g === 'object' ? g : { id: g, name: `Bot#${g}`, index },
  )
})

const gamerColumns: DataTableColumns<any> = [
  {
    title: 'Bot 名称',
    key: 'name',
    render(row) {
      return h(
        NButton,
        { text: true, type: 'primary', onClick: () => navigateTo(`/compete/gamer/${row.id}`) },
        { default: () => row.name || '-' },
      )
    },
  },
  {
    title: '类型',
    key: 'language',
    render(row) {
      const TYPE_MAP: Record<string, string> = { webhook: 'Webhook', external: '外部轮询', human: '真人', code: '' }
      const label = TYPE_MAP[row.type] || row.language || '-'
      return h(NTag, { size: 'small', bordered: false }, { default: () => label })
    },
  },
  {
    title: 'ELO',
    key: 'elo',
    render(row) {
      const delta = eloDeltas.value[String(row.id)]
      const base = h('span', row.elo !== undefined ? String(row.elo) : '-')
      if (delta == null) return base
      const sign = delta > 0 ? '+' : ''
      const color = delta > 0 ? '#18a058' : delta < 0 ? '#d03050' : '#999'
      return h('span', [
        base,
        h('span', { style: `color:${color};font-size:12px;margin-left:4px` }, `${sign}${delta}`),
      ])
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

// ─── Human Player (SSE + 提交移动) ────────────────────────────────────────────

const authStore = useAuthStore()
const myHumanGamer = computed(() => {
  if (!authStore.user) return null
  return gamerList.value.find((g: any) => g.type === 'human' && g.userId === authStore.user?.id) || null
})

// ── Human turn state (must be declared before iframe refs that use it) ───────
const humanTurn = ref<{ turnToken: string; gameState: any } | null>(null)
const humanMove = ref('')
const submittingMove = ref(false)

// ── Human turn renderer (iframe postMessage protocol) ────────────────────────
const humanRendererRef = ref<HTMLIFrameElement | null>(null)

// srcdoc injects a postMessage listener into the renderer HTML for human turns
// Use raw rendererHtml — the renderer is responsible for handling gameState/gameLog messages
const humanRendererSrcdoc = computed(() => match.value?.game?.rendererHtml || '')

function onHumanRendererLoad() {
  const turn = humanTurn.value
  console.log('[Renderer] @load fired, humanTurn=', !!turn)
  if (turn) sendGameStateToRenderer(turn)
}

// Whether the current renderer iframe declared interactive support
const iframeInteractive = ref(false)

// Listen for messages from iframe renderer
function onIframeMessage(e: MessageEvent) {
  if (!e.data) return
  // Renderer declares interactive capability → hide text input
  if (e.data.type === 'capabilities') {
    iframeInteractive.value = !!e.data.interactive
    return
  }
  // Renderer sends back a move → auto-submit
  if (e.data.type === 'humanMove' && e.data.move && !submittingMove.value) {
    humanMove.value = e.data.move
    submitHumanMove()
  }
}

onMounted(() => { window.addEventListener('message', onIframeMessage) })
onUnmounted(() => { window.removeEventListener('message', onIframeMessage) })

// Watch humanTurn changes to push gameState to iframe
// Send gameState to iframe; retry until iframe window is ready (handles async load)
function sendGameStateToRenderer(turn: { turnToken: string; gameState: any }) {
  const msg = { type: 'gameState', gameState: turn.gameState, playerIndex: myHumanGamer.value?.index ?? 0 }
  let attempts = 0
  const tryPost = () => {
    const win = humanRendererRef.value?.contentWindow
    console.log(`[Renderer] tryPost attempt ${attempts}, contentWindow=`, !!win, 'humanTurn=', !!humanTurn.value)
    if (win) {
      console.log('[Renderer] sending gameState, playerIndex=', msg.playerIndex)
      win.postMessage(msg, '*')
    } else if (attempts < 20) {
      attempts++
      setTimeout(tryPost, 100)
    }
  }
  setTimeout(tryPost, 50) // slight delay for Vue to render iframe
}

watch(() => humanTurn.value, (turn) => {
  if (turn) sendGameStateToRenderer(turn)
})

// TicTacToe board helper — returns flat 9-cell array or null if not ttt
// Parse 9-cell board from any known format
function extractBoard(gs: any): number[] | null {
  if (!gs) return null
  // BotInput format: requests[last] = '{"board": [...], "turn": N}'
  if (gs?.requests && Array.isArray(gs.requests) && gs.requests.length > 0) {
    try {
      const req = JSON.parse(gs.requests[gs.requests.length - 1])
      if (req?.board && Array.isArray(req.board)) {
        const b = Array.isArray(req.board[0]) ? (req.board as number[][]).flat() : req.board as number[]
        if (b.length === 9) return b
      }
    } catch { /* ignore */ }
  }
  // Direct formats
  const board = gs?.board ?? gs?.display?.board
  if (!board || !Array.isArray(board)) return null
  if (Array.isArray(board[0])) return (board as number[][]).flat()
  if (board.length === 9) return board as number[]
  return null
}

const tttBoard = computed(() => extractBoard(humanTurn.value?.gameState))

function clickCell(i: number) {
  // The move key is the player's position index (0 or 1)
  const idx = myHumanGamer.value?.index ?? 0
  humanMove.value = JSON.stringify({ [String(idx)]: i })
  // Auto-submit on click
  nextTick(() => submitHumanMove())
}

// ── Countdown timer ──────────────────────────────────────────────────────────
const countdownSec = ref(0)
let countdownTimer: ReturnType<typeof setInterval> | null = null
const HUMAN_TURN_TIMEOUT_SEC = 180

function startCountdown() {
  countdownSec.value = HUMAN_TURN_TIMEOUT_SEC
  if (countdownTimer) clearInterval(countdownTimer)
  countdownTimer = setInterval(() => {
    if (countdownSec.value > 0) countdownSec.value--
    else { if (countdownTimer) clearInterval(countdownTimer) }
  }, 1000)
}

function stopCountdown() {
  if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null }
  countdownSec.value = 0
}

// Start/stop countdown when humanTurn changes; reset iframe interactive state
watch(() => humanTurn.value, (turn) => {
  if (turn) { startCountdown(); iframeInteractive.value = false }
  else stopCountdown()
})

// SSE connection
let sseSource: EventSource | null = null

function connectHumanSSE() {
  console.log('[SSE] connectHumanSSE called, myHumanGamer=', myHumanGamer.value)
  if (!myHumanGamer.value) { console.warn('[SSE] no humanGamer, abort'); return }
  const token = authStore.accessToken
  console.log('[SSE] token present:', !!token)
  if (!token) return

  // SSE must bypass the Vite proxy (which buffers SSE responses).
  // Connect directly to the backend on port 3000, same hostname as the browser.
  const backendBase = process.client
    ? `${window.location.protocol}//${window.location.hostname}:3000`
    : 'http://localhost:3000'
  const url = `${backendBase}/compete/matches/${matchId.value}/human-sse?token=${encodeURIComponent(token)}`
  console.log('[SSE] connecting to', url)
  sseSource = new EventSource(url)

  sseSource.onopen = () => { console.log('[SSE] connection opened, readyState:', sseSource?.readyState) }

  // Also listen for named events in case backend sends event: type
  sseSource.addEventListener('message', (e) => { console.log('[SSE] named message event:', e.data) })

  sseSource.onmessage = (e) => {
    console.log('[SSE] onmessage:', e.data, 'lastEventId:', e.lastEventId)
    try {
      const data = JSON.parse(e.data)
      if (data.type === 'your-turn') {
        humanTurn.value = { turnToken: data.turnToken, gameState: data.gameState }
      } else if (data.type === 'game-over') {
        humanTurn.value = null
      }
    } catch { /* ignore */ }
  }

  sseSource.onerror = (e) => {
    console.error('[SSE] error:', e, 'readyState:', sseSource?.readyState)
  }

  // Backend will replay any pending turn immediately on SSE connect
}

async function submitHumanMove() {
  if (!humanTurn.value || !humanMove.value.trim()) return
  submittingMove.value = true
  try {
    await useCompeteApi().botRespond(humanTurn.value.turnToken, humanMove.value.trim())
    humanTurn.value = null
    humanMove.value = ''
  } catch (e: any) {
    console.error('submitHumanMove error', e)
  } finally {
    submittingMove.value = false
  }
}

// Connect SSE as soon as we know the user is a human player in this match.
// myHumanGamer depends on match.value, so we watch until it's non-null.
const stopWatchSSE = watch(myHumanGamer, (gamer) => {
  console.log('[SSE] myHumanGamer watch fired, gamer=', gamer, 'sseSource=', !!sseSource)
  if (gamer && !sseSource) {
    connectHumanSSE()
    stopWatchSSE()
  }
}, { immediate: true })

onUnmounted(() => { sseSource?.close(); stopCountdown() })

useHead(computed(() => ({ title: `对战记录 #${matchId.value} — Leverage OJ` })))
</script>

<style scoped>
.match-detail-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ttt-board {
  display: grid;
  grid-template-columns: repeat(3, 60px);
  gap: 4px;
  width: fit-content;
}

.ttt-cell {
  width: 60px;
  height: 60px;
  border: 2px solid #e0e0e6;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  cursor: default;
  user-select: none;
}

.ttt-cell.can-click {
  cursor: pointer;
  background: #f5f5f5;
  transition: background 0.15s;
}

.ttt-cell.can-click:hover {
  background: #e6f4ea;
  border-color: #18a058;
}
</style>
