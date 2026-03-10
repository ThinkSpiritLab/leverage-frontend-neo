<template>
  <div class="admin-game-detail">
    <div class="page-header">
      <NSpace align="center">
        <NButton text @click="navigateTo('/admin/compete')">
          ← 返回游戏列表
        </NButton>
        <NH2 style="margin: 0">
          {{ game?.title || '游戏详情' }}
        </NH2>
        <NTag v-if="game" :type="game.disabled ? 'error' : 'success'" size="small">
          {{ game.disabled ? '已禁用' : '已启用' }}
        </NTag>
      </NSpace>
    </div>

    <NSpin :show="loading">
      <NTabs v-model:value="activeTab" type="line" animated>
        <!-- ===== 基本信息 Tab ===== -->
        <NTabPane name="info" tab="基本信息">
          <NCard v-if="game" style="max-width: 640px; margin-top: 16px">
            <NDescriptions :column="1" label-placement="left" bordered style="margin-bottom: 16px">
              <NDescriptionsItem label="ID">{{ game.id }}</NDescriptionsItem>
              <NDescriptionsItem label="游戏名称">{{ game.title }}</NDescriptionsItem>
              <NDescriptionsItem label="玩家数量">{{ game.gamerQuantity ?? '-' }}</NDescriptionsItem>
              <NDescriptionsItem label="时间限制">{{ game.timeLimit ? `${game.timeLimit} ms` : '-' }}</NDescriptionsItem>
              <NDescriptionsItem label="内存限制">{{ game.memoryLimit ? `${game.memoryLimit ?? 0} MB` : '-' }}</NDescriptionsItem>
              <NDescriptionsItem label="状态">
                <NTag :type="game.disabled ? 'error' : 'success'" size="small">
                  {{ game.disabled ? '已禁用' : '已启用' }}
                </NTag>
              </NDescriptionsItem>
            </NDescriptions>
            <NButton type="primary" @click="openEditModal">编辑游戏</NButton>
          </NCard>
        </NTabPane>

        <!-- ===== 排行榜 Tab ===== -->
        <NTabPane name="leaderboard" tab="排行榜">
          <div style="margin-top: 16px">
            <NButton style="margin-bottom: 12px" @click="fetchLeaderboard">刷新</NButton>
            <NDataTable
              :columns="leaderboardColumns"
              :data="leaderboard"
              :loading="leaderboardLoading"
              :row-key="(row: any) => row.userId ?? row.id"
              size="small"
            />
          </div>
        </NTabPane>

        <!-- ===== 对局列表 Tab ===== -->
        <NTabPane name="matches" tab="对局列表">
          <div style="margin-top: 16px">
            <NButton style="margin-bottom: 12px" @click="fetchMatches">刷新</NButton>
            <NDataTable
              :columns="matchColumns"
              :data="matches"
              :loading="matchesLoading"
              :row-key="(row: any) => row.id"
              size="small"
            />
            <NPagination
              v-model:page="matchPage"
              :page-count="matchPageCount"
              style="margin-top: 12px; justify-content: flex-end"
              @update:page="fetchMatches"
            />
          </div>
        </NTabPane>
      </NTabs>
    </NSpin>

    <!-- 编辑弹窗 -->
    <NModal v-model:show="showEditModal" title="编辑游戏" preset="card" style="width: 680px; max-height: 90vh; overflow-y: auto">
      <NForm :model="editForm" label-placement="left" label-width="120px">
        <NFormItem label="游戏名称" required>
          <NInput v-model:value="editForm.title" placeholder="输入游戏名称" />
        </NFormItem>
        <NFormItem label="玩家数量">
          <NInputNumber v-model:value="editForm.gamerQuantity" :min="1" :max="100" style="width: 100%" />
        </NFormItem>
        <NFormItem label="时间限制 (ms)">
          <NInputNumber v-model:value="editForm.timeLimit" :min="100" :max="60000" style="width: 100%" />
        </NFormItem>
        <NFormItem label="内存限制 (MB)">
          <NInputNumber v-model:value="editFormMemoryMB" :min="8" :max="1024" style="width: 100%" />
        </NFormItem>
        <NFormItem label="描述">
          <NInput v-model:value="editForm.description" type="textarea" :rows="4" placeholder="游戏描述" />
        </NFormItem>
        <NFormItem label="启用">
          <NSwitch v-model:value="editFormEnabled" />
        </NFormItem>

        <!-- 自定义渲染器 HTML -->
        <NFormItem label="自定义渲染器 HTML">
          <div style="width: 100%">
            <NInput
              v-model:value="editForm.rendererHtml"
              type="textarea"
              :rows="10"
              :placeholder="rendererHtmlPlaceholder"
              style="font-family: monospace; font-size: 12px"
            />
            <NSpace justify="space-between" align="center" style="margin-top: 6px">
              <NText :type="rendererHtmlOverLimit ? 'error' : 'default'" style="font-size: 12px">
                {{ rendererHtmlLen.toLocaleString() }} / 512,000 字符
              </NText>
              <NButton size="small" secondary @click="showRendererPreview = true">
                预览
              </NButton>
            </NSpace>
            <NAlert v-if="rendererHtmlOverLimit" type="error" :show-icon="false" style="margin-top: 4px; font-size: 12px">
              超出 512KB 限制，请精简代码
            </NAlert>
          </div>
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="showEditModal = false">取消</NButton>
          <NButton type="primary" :loading="saving" :disabled="rendererHtmlOverLimit" @click="handleSaveEdit">保存</NButton>
        </NSpace>
      </template>
    </NModal>

    <!-- 渲染器预览弹窗 -->
    <NModal v-model:show="showRendererPreview" title="渲染器预览" preset="card" style="width: 760px">
      <NAlert type="info" :show-icon="false" style="margin-bottom: 12px; font-size: 12px">
        以下使用示例 gameLog 数据测试你的渲染器。iframe 仅允许执行脚本（sandbox=allow-scripts），无法访问父页面。
      </NAlert>
      <iframe
        v-if="editForm.rendererHtml && showRendererPreview"
        :srcdoc="editForm.rendererHtml"
        sandbox="allow-scripts"
        style="width:100%;height:420px;border:1px solid #e0e0e0;border-radius:4px;display:block"
        :ref="(el) => { previewIframeEl = el as HTMLIFrameElement | null }"
        @load="onPreviewIframeLoad"
      />
      <NEmpty v-else description="请先填写渲染器 HTML" />
      <template #footer>
        <NSpace justify="end">
          <NButton @click="sendPreviewMessage">重发 gameLog 消息</NButton>
          <NButton type="primary" @click="showRendererPreview = false">关闭</NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>

<script setup lang="ts">
import { h } from 'vue'
import { NTag, useMessage } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import dayjs from 'dayjs'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const route = useRoute()
const gameId = Number(route.params.id)
const competeApi = useCompeteApi()
const message = useMessage()

// ── 基本数据 ──
const game = ref<any | null>(null)
const loading = ref(false)
const activeTab = ref('info')

async function fetchGame() {
  loading.value = true
  try {
    const res = await competeApi.getGame(gameId)
    game.value = res.data
  }
  catch (e) { console.error(e) }
  finally { loading.value = false }
}

onMounted(fetchGame)

// ── 编辑弹窗 ──
const showEditModal = ref(false)
const saving = ref(false)
const editForm = ref({
  title: '',
  gamerQuantity: 2,
  timeLimit: 1000,
  memoryLimit: 256,
  description: '',
  disabled: true,
  rendererHtml: '',
})

// 内存以 MB 为单位进行交互
const editFormMemoryMB = computed({
  get: () => editForm.value.memoryLimit,
  set: (v: number) => { editForm.value.memoryLimit = v },
})

const editFormEnabled = computed({
  get: () => !editForm.value.disabled,
  set: (v: boolean) => { editForm.value.disabled = !v },
})

const rendererHtmlLen = computed(() => editForm.value.rendererHtml?.length ?? 0)
const rendererHtmlOverLimit = computed(() => rendererHtmlLen.value > 512000)

const rendererHtmlPlaceholder = `<!DOCTYPE html>
<html>
<body>
<div id="app"></div>
<script>
  window.addEventListener('message', function({ data }) {
    if (data.type === 'gameLog') {
      document.getElementById('app').innerHTML =
        '<pre>' + JSON.stringify(data.gameLog, null, 2) + '<\\/pre>';
    }
  });
<\/script>
</body>
</html>`

// ── 渲染器预览 ──
const showRendererPreview = ref(false)
const previewIframeEl = ref<HTMLIFrameElement | null>(null)

const previewGameLog = {
  gameId: 'preview',
  rounds: [
    {
      round: 1,
      judgerDisplay: { info: '示例回合数据' },
      botOutputs: { '0': '示例输出A', '1': '示例输出B' },
    },
  ],
  finalResult: { '0': 100, '1': 80 },
  verdict: 'Player 0 wins',
}

function sendPreviewMessage() {
  previewIframeEl.value?.contentWindow?.postMessage(
    { type: 'gameLog', gameLog: previewGameLog, round: 0 },
    '*',
  )
}

function onPreviewIframeLoad() {
  sendPreviewMessage()
}

function openEditModal() {
  if (!game.value) return
  editForm.value = {
    title: game.value.title || '',
    gamerQuantity: game.value.gamerQuantity ?? 2,
    timeLimit: game.value.timeLimit ?? 1000,
    memoryLimit: game.value.memoryLimit ?? 256 * 1024 * 1024,
    description: game.value.description || '',
    disabled: !!game.value.disabled,
    rendererHtml: game.value.rendererHtml || '',
  }
  showEditModal.value = true
}

async function handleSaveEdit() {
  if (!editForm.value.title) {
    message.warning('游戏名称不能为空')
    return
  }
  if (rendererHtmlOverLimit.value) {
    message.error('自定义渲染器 HTML 超出 512KB 限制')
    return
  }
  saving.value = true
  try {
    const payload: Record<string, any> = { ...editForm.value }
    // 空字符串转 null，避免保存空字段
    if (!payload.rendererHtml) payload.rendererHtml = null
    await competeApi.updateGame(gameId, payload)
    message.success('游戏信息已更新')
    showEditModal.value = false
    fetchGame()
  }
  catch (e: any) { message.error(e?.message || '更新失败') }
  finally { saving.value = false }
}

// ── 排行榜 ──
const leaderboard = ref<any[]>([])
const leaderboardLoading = ref(false)

async function fetchLeaderboard() {
  leaderboardLoading.value = true
  try {
    const res = await competeApi.getLeaderboard(gameId)
    leaderboard.value = Array.isArray(res.data) ? res.data : []
  }
  catch (e) { console.error(e) }
  finally { leaderboardLoading.value = false }
}

const leaderboardColumns: DataTableColumns<any> = [
  { title: '排名', key: '_rank', width: 60, render: (_r, idx) => idx + 1 },
  { title: '玩家', key: 'name', render: r => r.name || r.username || `Bot#${r.gamerId}` },
  { title: 'ELO', key: 'elo', width: 80 },
  { title: '胜场', key: 'wins', width: 70, render: r => r.wins ?? '-' },
  { title: '总场', key: 'total', width: 70, render: r => r.total ?? '-' },
  { title: '胜率', key: 'winRate', width: 70, render: r => r.winRate != null ? `${(r.winRate * 100).toFixed(1)}%` : '-' },
]

// ── 对局列表 ──
const matches = ref<any[]>([])
const matchesLoading = ref(false)
const matchPage = ref(1)
const matchPageCount = ref(1)
const matchPerPage = 20

async function fetchMatches() {
  matchesLoading.value = true
  try {
    const res = await competeApi.listMatches({
      gameId,
      page: matchPage.value,
      perPage: matchPerPage,
    })
    const data = res.data as any
    matches.value = data?.items || data || []
    if (data?.total) {
      matchPageCount.value = Math.ceil(data.total / matchPerPage)
    }
  }
  catch (e) { console.error(e) }
  finally { matchesLoading.value = false }
}

const matchStatusLabel: Record<string, string> = {
  pending: '等待中',
  running: '进行中',
  finished: '已完成',
  error: '错误',
}

const matchStatusColor: Record<string, any> = {
  pending: 'default',
  running: 'info',
  finished: 'success',
  error: 'error',
}

const matchColumns: DataTableColumns<any> = [
  { title: 'ID', key: 'id', width: 70 },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render: r => h(NTag, {
      type: matchStatusColor[r.status] || 'default',
      size: 'small',
    }, { default: () => matchStatusLabel[r.status] || r.status || '-' }),
  },
  { title: '参与者', key: 'links', render: r => r.links?.map((l: any) => l.gamer?.title || l.gamer?.name || `Bot#${l.gamerId}`).join(', ') || '-' },
  {
    title: '创建时间',
    key: 'createdAt',
    width: 160,
    render: r => r.createdAt ? dayjs(r.createdAt).format('YYYY-MM-DD HH:mm') : '-',
  },
]

// ── Tab 切换时懒加载 ──
watch(activeTab, (tab) => {
  if (tab === 'leaderboard' && !leaderboard.value.length) fetchLeaderboard()
  if (tab === 'matches' && !matches.value.length) fetchMatches()
})

useHead(computed(() => ({ title: game.value?.name ? `${game.value.name}` : '游戏管理' })))
</script>

<style scoped>
.admin-game-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 12px;
}
</style>
