<template>
  <div class="compete-game-page">
    <NSpin :show="loading">
      <!-- Header -->
      <div v-if="game" class="game-header">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
          <NH2 style="margin:0">{{ game.title }}</NH2>
          <NTag size="small" :type="game.disabled ? 'error' : 'success'">
            {{ game.disabled ? '已禁用' : '进行中' }}
          </NTag>
        </div>
        <NText depth="3">{{ game.description }}</NText>
        <NDivider style="margin:12px 0" />
        <NSpace align="center">
          <NText depth="3">⏱ 时限 {{ game.timeLimit }}ms</NText>
          <NText depth="3">💾 内存 {{ game.memoryLimit }}MB</NText>
          <NText depth="3">👥 {{ game.gamerQuantity }} 人对战</NText>
        </NSpace>
      </div>

      <NTabs v-model:value="activeTab" type="line" animated style="margin-top:16px">

        <!-- ── 排行榜 ─────────────────────────────────────────────────── -->
        <NTabPane name="leaderboard" tab="🏆 排行榜">
          <div style="margin-top:12px">
            <NSpace style="margin-bottom:12px" align="center">
              <NSwitch v-model:value="showNonBot" @update:value="fetchLeaderboard">
                <template #checked>显示真人/外部</template>
                <template #unchecked>仅 Bot 竞争</template>
              </NSwitch>
              <NButton size="small" @click="fetchLeaderboard">刷新</NButton>
            </NSpace>
            <NDataTable :columns="leaderboardColumns" :data="leaderboard" :loading="leaderboardLoading" :row-key="(r:any)=>r.gamerId" size="small" />
          </div>
        </NTabPane>

        <!-- ── 参赛 ──────────────────────────────────────────────────── -->
        <NTabPane name="participate" tab="⚔️ 参赛">
          <div style="margin-top:12px">

            <!-- 我的 Bot -->
            <NCard size="small" style="margin-bottom:16px">
              <template #header>
                <NSpace justify="space-between" align="center">
                  <span style="font-weight:600">我的 Bot</span>
                  <NSpace>
                    <NButton
                      v-if="game?.allowHuman"
                      size="small"
                      type="warning"
                      :loading="joiningAsHuman !== null"
                      @click="quickJoinAsHuman"
                    >
                      🎮 我要参赛（真人）
                    </NButton>
                    <NButton size="small" type="primary" @click="showSubmitModal = true">+ 提交 Bot</NButton>
                  </NSpace>
                </NSpace>
              </template>
              <NSpin :show="myBotsLoading">
                <NEmpty v-if="!myBots.length" description="还没有 Bot，点击右上角提交一个" style="padding:24px 0" />
                <NSpace v-else vertical :size="8">
                  <div
                    v-for="bot in myBots"
                    :key="bot.id"
                    class="bot-card"
                    :class="{ selected: selectedGamerIds.includes(bot.id), disabled: bot.disabled }"
                  >
                    <NSpace align="center" style="flex:1;min-width:0">
                      <!-- checkbox for non-human, non-disabled -->
                      <NCheckbox
                        v-if="bot.type !== 'human' && !bot.disabled"
                        :checked="selectedGamerIds.includes(bot.id)"
                        :disabled="!selectedGamerIds.includes(bot.id) && selectedGamerIds.length >= (game?.gamerQuantity ?? 2)"
                        @update:checked="(v:boolean) => toggleGamer(bot.id, v)"
                      />
                      <div style="min-width:0;flex:1">
                        <NSpace align="center" :wrap="false">
                          <NText strong :style="bot.disabled ? 'color:#aaa;white-space:nowrap' : 'white-space:nowrap'">{{ bot.title || bot.name }}</NText>
                          <NTag v-if="bot.disabled" size="small" type="error">已禁用</NTag>
                          <NTag v-else size="small" :type="botTagType(bot.type)">{{ botTypeLabel(bot) }}</NTag>
                          <NTag v-if="!bot.disabled" size="small" type="info">⚡ {{ bot.elo ?? 1200 }}</NTag>
                        </NSpace>
                      </div>
                    </NSpace>
                    <NSpace align="center">
                      <!-- Human bot: show join button + creator info, no edit -->
                      <template v-if="bot.type === 'human'">
                        <NText depth="3" style="font-size:12px">真人席位</NText>
                        <NButton
                          v-if="!bot.disabled"
                          size="small"
                          type="primary"
                          :loading="joiningAsHuman === bot.id"
                          @click="joinAsHuman(bot)"
                        >
                          🎮 加入对局
                        </NButton>
                      </template>
                      <!-- Code/webhook/external: show edit button -->
                      <NButton v-else size="small" text :disabled="bot.disabled" @click="navigateTo(`/compete/gamer/${bot.id}`)">编辑</NButton>
                    </NSpace>
                  </div>
                </NSpace>
              </NSpin>
            </NCard>

            <!-- 发起对局 banner（选好后出现） -->
            <NAlert
              v-if="selectedGamerIds.length > 0"
              type="success"
              style="margin-bottom:16px"
              :show-icon="false"
            >
              <NSpace justify="space-between" align="center">
                <NText>
                  已选 <NText strong>{{ selectedGamerIds.length }}</NText> / {{ game?.gamerQuantity ?? 2 }} 个参赛者
                  <NText depth="3" style="margin-left:8px">({{ selectedGamerNames.join(' vs ') }})</NText>
                </NText>
                <NSpace>
                  <NButton size="small" @click="selectedGamerIds = []">清空</NButton>
                  <NButton
                    type="primary"
                    size="small"
                    :disabled="selectedGamerIds.length !== (game?.gamerQuantity ?? 2)"
                    :loading="launching"
                    @click="handleLaunchMatch"
                  >
                    ⚔️ 发起对局
                  </NButton>
                </NSpace>
              </NSpace>
            </NAlert>

            <!-- 全部 Bot（选对手） -->
            <NCard size="small">
              <template #header>
                <NSpace justify="space-between" align="center">
                  <span style="font-weight:600">所有参赛者 <NText depth="3" style="font-size:12px">（勾选加入当前对局）</NText></span>
                  <NButton size="small" @click="fetchAllGamers">刷新</NButton>
                </NSpace>
              </template>
              <NDataTable
                :columns="allGamerColumns"
                :data="otherGamers"
                :loading="allGamersLoading"
                :row-key="(r:any) => r.id"
                size="small"
                style="margin-top:4px"
              />
            </NCard>
          </div>
        </NTabPane>

        <!-- ── 对局记录 ────────────────────────────────────────────────── -->
        <NTabPane name="matches" tab="📋 对局记录">
          <div style="margin-top:12px">
            <NButton size="small" style="margin-bottom:12px" @click="fetchMatches">刷新</NButton>
            <NDataTable :columns="matchColumns" :data="matches" :loading="matchesLoading" :row-key="(r:any)=>r.id" size="small" />
            <NPagination v-if="matchTotal > matchPerPage" v-model:page="matchPage" :page-count="Math.ceil(matchTotal/matchPerPage)" style="margin-top:12px;justify-content:flex-end" @update:page="fetchMatches" />
          </div>
        </NTabPane>
      </NTabs>
    </NSpin>

    <!-- 人类加入对局：选对手弹窗 -->
    <NModal v-model:show="showJoinModal" preset="card" title="🎮 选择对手 Bot" style="width:480px">
      <NText depth="3" style="display:block;margin-bottom:12px">
        选 {{ (game?.gamerQuantity ?? 2) - 1 }} 个代码 Bot 作为对手
      </NText>
      <NDataTable
        :columns="opponentColumns"
        :data="allGamers.filter((g:any) => g.id !== joiningHumanBotId && g.type === 'code' && !g.disabled)"
        :row-key="(r:any) => r.id"
        :checked-row-keys="selectedOpponents"
        size="small"
        @update:checked-row-keys="(keys:any) => selectedOpponents = keys"
      />
      <template #footer>
        <NSpace justify="end">
          <NButton @click="showJoinModal = false">取消</NButton>
          <NButton
            type="primary"
            :disabled="selectedOpponents.length !== (game?.gamerQuantity ?? 2) - 1"
            :loading="launching"
            @click="confirmJoinAsHuman"
          >
            发起对局并加入
          </NButton>
        </NSpace>
      </template>
    </NModal>

    <!-- 提交 Bot 弹窗 -->
    <NModal v-model:show="showSubmitModal" title="提交 Bot" preset="card" style="width:640px;max-height:90vh;overflow-y:auto">
      <NForm :model="submitForm" label-placement="left" label-width="110px">
        <NFormItem label="Bot 名称" required>
          <NInput v-model:value="submitForm.title" placeholder="给你的 Bot 起个名字" />
        </NFormItem>
        <NFormItem label="Bot 类型">
          <NRadioGroup v-model:value="submitForm.type">
            <NSpace vertical :size="6">
              <NRadio value="code">🖥️ 代码 Bot — 上传代码，在服务器沙箱运行</NRadio>
              <NRadio value="external">🔗 外部 Bot — 你的程序主动轮询服务器（无需公网 IP）</NRadio>
              <NRadio value="webhook">📡 Webhook Bot — 服务器主动调你的 URL（需公网 IP）</NRadio>
              <NRadio v-if="game?.allowHuman" value="human">🧑 真人 — 在浏览器网页上手动输入移动</NRadio>
            </NSpace>
          </NRadioGroup>
        </NFormItem>
        <NFormItem v-if="submitForm.type === 'code'" label="是否开源">
          <NSwitch v-model:value="submitForm.opensource" />
        </NFormItem>
        <template v-if="submitForm.type === 'code'">
          <NFormItem label="语言" required>
            <NSelect v-model:value="submitForm.language" :options="botLanguageOptions" style="width:180px" />
          </NFormItem>
          <NFormItem label="代码" required>
            <NInput v-model:value="submitForm.code" type="textarea" :rows="14" :placeholder="codePlaceholder" style="font-family:monospace;font-size:13px" />
          </NFormItem>
        </template>
        <template v-else-if="submitForm.type === 'external'">
          <NAlert type="success" :show-icon="false" style="font-size:13px">
            <b>无需公网 IP，你的程序主动轮询服务器获取回合：</b>
            <pre style="margin:8px 0;font-size:11px;white-space:pre-wrap">{{ externalBotDoc }}</pre>
          </NAlert>
        </template>
        <template v-else-if="submitForm.type === 'webhook'">
          <NFormItem label="Webhook URL" required>
            <NInput v-model:value="submitForm.webhookUrl" placeholder="https://your-server.com/bot" />
          </NFormItem>
          <NFormItem label="签名密钥">
            <NInput v-model:value="submitForm.webhookSecret" placeholder="可选" />
          </NFormItem>
          <NAlert type="warning" :show-icon="false" style="font-size:13px">
            ⚠️ 需要公网 IP 或域名。
          </NAlert>
        </template>

      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="showSubmitModal = false">取消</NButton>
          <NButton type="primary" :loading="submitting" @click="handleSubmitBot">提交</NButton>
        </NSpace>
      </template>
    </NModal>

    <!-- API Key 弹窗 -->
    <NModal v-model:show="showApiKeyModal" preset="card" title="🔑 Bot API Key" style="width:580px">
      <NAlert type="success" style="margin-bottom:12px">Bot 创建成功！API Key <b>只显示一次</b>，请立即保存。</NAlert>
      <NFormItem label="Bot API Key">
        <NInputGroup>
          <NInput :value="createdApiKey" readonly style="font-family:monospace;font-size:13px" />
          <NButton @click="copyApiKey">复制</NButton>
        </NInputGroup>
      </NFormItem>
      <NFormItem label="Gamer ID">
        <NInput :value="String(createdGamerId)" readonly style="font-family:monospace" />
      </NFormItem>
      <NAlert type="info" :show-icon="false" style="font-size:13px;margin-top:8px">
        <b>Python 示例代码：</b>
        <pre style="margin:8px 0;font-size:11px;white-space:pre-wrap">{{ generatedExternalCode }}</pre>
      </NAlert>
      <template #footer>
        <NSpace justify="end">
          <NButton type="primary" @click="showApiKeyModal = false">关闭</NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>

<script setup lang="ts">
import { h, computed } from 'vue'
import { NButton, NTag, NSpace, NInputGroup, NEmpty, useMessage } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import dayjs from 'dayjs'

definePageMeta({ layout: 'default' })

const route = useRoute()
const gameId = computed(() => Number(route.params.id))
const competeApi = useCompeteApi()
const authStore = useAuthStore()
const message = useMessage()

// ── Game ──
const loading = ref(true)
const game = ref<any>(null)
const activeTab = ref('leaderboard')

onMounted(async () => {
  try {
    const res = await competeApi.getGame(gameId.value)
    game.value = res.data || null
  } catch (e) { console.error(e) }
  finally { loading.value = false }

  // Prefetch on mount
  fetchLeaderboard()
})

watch(activeTab, (tab) => {
  if (tab === 'participate') { fetchMyBots(); fetchAllGamers() }
  if (tab === 'matches') fetchMatches()
})

// ── Leaderboard ──
const leaderboard = ref<any[]>([])
const leaderboardLoading = ref(false)
const showNonBot = ref(false)
const leaderboardBoard = computed(() => showNonBot.value ? 'outer' : 'inner')

const TYPE_LABEL: Record<string, string> = { code: '', human: '🧑 真人', external: '🔗 外部', webhook: '🔗 Webhook' }

async function fetchLeaderboard() {
  leaderboardLoading.value = true
  try {
    const res = await competeApi.getLeaderboard(gameId.value, leaderboardBoard.value as 'inner'|'outer')
    leaderboard.value = Array.isArray(res.data) ? res.data : []
  } catch (e) { console.error(e) }
  finally { leaderboardLoading.value = false }
}

const leaderboardColumns = computed<DataTableColumns<any>>(() => [
  { title: '#', key: '_rank', width: 50, render: (_r:any, i:number) => i + 1 },
  { title: 'Bot 名称', key: 'name', render: (r:any) => {
    const tag = TYPE_LABEL[r.type] || ''
    return h('span', [
      h(NButton, { text: true, type: 'primary', onClick: () => navigateTo(`/compete/gamer/${r.gamerId}`) }, () => r.name || `Bot#${r.gamerId}`),
      tag ? h('span', { style: 'margin-left:6px;font-size:12px;color:#999' }, tag) : null,
    ])
  }},
  { title: showNonBot.value ? 'ELO（外榜）' : 'ELO（内榜）', key: 'elo', width: 100 },
  { title: '胜场', key: 'wins', width: 70 },
  { title: '总场', key: 'total', width: 70 },
  { title: '胜率', key: 'winRate', width: 80, render: (r:any) => r.winRate != null ? `${(r.winRate*100).toFixed(1)}%` : '-' },
])

// ── My Bots ──
const myBots = ref<any[]>([])
const myBotsLoading = ref(false)

async function fetchMyBots() {
  if (!authStore.user) return
  myBotsLoading.value = true
  try {
    const res = await competeApi.listGamers({ gameId: gameId.value, page: 1, perPage: 100 })
    const all: any[] = (res.data as any)?.items || []
    myBots.value = all.filter((g:any) => g.userId === authStore.user?.id)
  } catch (e) { console.error(e) }
  finally { myBotsLoading.value = false }
}

// ── All Gamers ──
const allGamers = ref<any[]>([])
const allGamersLoading = ref(false)
const otherGamers = computed(() => allGamers.value.filter((g:any) => !myBots.value.some((mb:any) => mb.id === g.id) && g.type === 'code' && !g.disabled))

async function fetchAllGamers() {
  allGamersLoading.value = true
  try {
    const res = await competeApi.listGamers({ gameId: gameId.value, page: 1, perPage: 100 })
    allGamers.value = (res.data as any)?.items || []
  } catch (e) { console.error(e) }
  finally { allGamersLoading.value = false }
}

// ── Launch Match ──
const selectedGamerIds = ref<number[]>([])
const launching = ref(false)

const selectedGamerNames = computed(() =>
  selectedGamerIds.value.map(id => {
    const b = [...myBots.value, ...allGamers.value].find((g:any) => g.id === id)
    return b?.title || b?.name || `Bot#${id}`
  })
)

function toggleGamer(id: number, checked: boolean) {
  if (checked) {
    if (selectedGamerIds.value.length < (game.value?.gamerQuantity ?? 2)) {
      selectedGamerIds.value = [...selectedGamerIds.value, id]
    }
  } else {
    selectedGamerIds.value = selectedGamerIds.value.filter(x => x !== id)
  }
}

async function handleLaunchMatch() {
  launching.value = true
  try {
    const res = await competeApi.launchMatch(gameId.value, selectedGamerIds.value)
    message.success('对局已发起！')
    selectedGamerIds.value = []
    navigateTo(`/compete/matches/${(res.data as any)?.id || ''}`)
  } catch (e: any) {
    message.error(e?.response?.data?.message || '发起失败')
  } finally {
    launching.value = false
  }
}

function botTypeLabel(bot: any) {
  const m: Record<string, string> = { code: bot.language || 'code', webhook: 'Webhook', external: '外部轮询', human: '真人' }
  return m[bot.type] || bot.type
}
function botTagType(type: string): 'default'|'info'|'success'|'warning'|'error' {
  const m: Record<string, any> = { code: 'info', webhook: 'warning', external: 'success', human: 'error' }
  return m[type] || 'default'
}
function eloTagType(elo: number): 'default'|'info'|'success'|'warning'|'error' {
  if (!elo || elo < 1100) return 'default'
  if (elo < 1250) return 'info'
  if (elo < 1400) return 'success'
  return 'warning'
}

const allGamerColumns: DataTableColumns<any> = [
  { type: 'selection', disabled: (row) => selectedGamerIds.value.length >= (game.value?.gamerQuantity ?? 2) && !selectedGamerIds.value.includes(row.id) },
  { title: 'Bot 名称', key: 'name', render: (r:any) => h(NButton, { text: true, type: 'primary', onClick: () => navigateTo(`/compete/gamer/${r.id}`) }, () => r.title || r.name) },
  { title: 'ELO', key: 'elo', width: 80 },
  { title: '用户', key: 'user', width: 100, render: (r:any) => r.user?.username || '-' },
]

// ── Human bot join flow ──
const joiningAsHuman = ref<number | null>(null)
const joiningHumanBotId = ref<number | null>(null)
const showJoinModal = ref(false)
const selectedOpponents = ref<number[]>([])

const opponentColumns: DataTableColumns<any> = [
  { type: 'selection', disabled: (row) => selectedOpponents.value.length >= (game.value?.gamerQuantity ?? 2) - 1 && !selectedOpponents.value.includes(row.id) },
  { title: 'Bot 名称', key: 'name', render: (r:any) => r.title || r.name || `Bot#${r.id}` },
  { title: 'ELO', key: 'elo', width: 80 },
]

function joinAsHuman(bot: any) {
  joiningHumanBotId.value = bot.id
  selectedOpponents.value = []
  showJoinModal.value = true
  if (!allGamers.value.length) fetchAllGamers()
}

// 一键参赛：自动找/创建 human bot，然后弹选对手窗
async function quickJoinAsHuman() {
  joiningAsHuman.value = -1 // loading state
  try {
    // Check if already has a human bot for this game
    await fetchMyBots()
    const existing = myBots.value.find((b: any) => b.type === 'human')
    if (existing) {
      joinAsHuman(existing)
    } else {
      // Auto-create human bot silently
      const username = authStore.user?.username || authStore.user?.email || '玩家'
      const res = await competeApi.createGamer({
        gameId: gameId.value,
        title: `${username} 的参赛席位`,
        type: 'human' as any,
        language: 'webhook',
        code: '',
        opensource: false,
      })
      await fetchMyBots()
      const created = res.data as any
      joinAsHuman({ id: created.id })
    }
  } catch (e: any) {
    message.error(e?.response?.data?.message || '操作失败')
  } finally {
    if (!showJoinModal.value) joiningAsHuman.value = null
  }
}

async function confirmJoinAsHuman() {
  if (!joiningHumanBotId.value) return
  launching.value = true
  try {
    const ids = [joiningHumanBotId.value, ...selectedOpponents.value]
    const res = await competeApi.launchMatch(gameId.value, ids)
    showJoinModal.value = false
    message.success('对局已发起，请在详情页等待你的回合')
    navigateTo(`/compete/matches/${(res.data as any)?.id || ''}`)
  } catch (e: any) {
    message.error(e?.response?.data?.message || '发起失败')
  } finally {
    launching.value = false
  }
}

// ── Matches ──
const matches = ref<any[]>([])
const matchesLoading = ref(false)
const matchPage = ref(1)
const matchPerPage = 10
const matchTotal = ref(0)

async function fetchMatches() {
  matchesLoading.value = true
  try {
    const res = await competeApi.listMatches({ gameId: gameId.value, page: matchPage.value, perPage: matchPerPage })
    const data = res.data as any
    matches.value = data?.items || []
    matchTotal.value = data?.total || 0
  } catch (e) { console.error(e) }
  finally { matchesLoading.value = false }
}

const statusLabel: Record<number,string> = { 0:'等待中', 1:'进行中', 2:'已完成', 3:'错误' }
const statusType: Record<number,any> = { 0:'default', 1:'info', 2:'success', 3:'error' }

function getWinner(r: any): string {
  try {
    const fr = typeof r.result === 'string' ? JSON.parse(r.result).finalResult : r.result?.finalResult
    if (!fr) return '-'
    const maxScore = Math.max(...Object.values(fr) as number[])
    const winnerIds = Object.entries(fr).filter(([,v]) => v === maxScore).map(([k]) => k)
    if (winnerIds.length === Object.keys(fr).length) return '平局'
    const gamerMap = Object.fromEntries((r.links||[]).map((l:any) => [String(l.gamerId), l.gamer?.title||`Bot#${l.gamerId}`]))
    return winnerIds.map(id => gamerMap[id]||`Bot#${id}`).join(', ')
  } catch { return '-' }
}

function gamerLink(gamerId: number | string, name: string) {
  return h(NButton, { text: true, type: 'primary', size: 'small', onClick: () => navigateTo(`/compete/gamer/${gamerId}`) }, () => name)
}

function matchLink(matchId: number, content: any) {
  return h(NButton, { text: true, type: 'default', size: 'small', onClick: () => navigateTo(`/compete/matches/${matchId}`) }, () => content)
}

const matchColumns: DataTableColumns<any> = [
  { title: 'ID', key: 'id', width: 55, render: r => matchLink(r.id, `#${r.id}`) },
  { title: '状态', key: 'status', width: 80, render: r => h(NTag, { size:'small', type:statusType[r.status] }, () => statusLabel[r.status]??r.status) },
  { title: '参与者', key: 'links', render: r => {
    const links = r.links?.slice().sort((a:any,b:any) => a.index - b.index) || []
    if (!links.length) return h('span', { style: 'color:#aaa' }, '-')
    const parts: any[] = []
    links.forEach((l: any, i: number) => {
      if (i > 0) parts.push(h('span', { style: 'color:#999;margin:0 4px' }, 'vs'))
      parts.push(gamerLink(l.gamerId, l.gamer?.title || l.gamer?.name || `Bot#${l.gamerId}`))
    })
    return h('span', parts)
  }},
  { title: '胜者', key: 'winner', width: 150, render: r => {
    if (r.status !== 2) return h('span', { style: 'color:#aaa' }, '-')
    try {
      const fr = typeof r.result === 'string' ? JSON.parse(r.result).finalResult : r.result?.finalResult
      if (!fr) return h('span', { style: 'color:#aaa' }, '-')
      const maxScore = Math.max(...Object.values(fr) as number[])
      const winnerEntries = Object.entries(fr).filter(([,v]) => v === maxScore)
      if (winnerEntries.length === Object.keys(fr).length) return h('span', { style: 'color:#f0a020' }, '平局')
      const gamerMap = Object.fromEntries((r.links||[]).map((l:any) => [String(l.gamerId), { name: l.gamer?.title||l.gamer?.name||`Bot#${l.gamerId}`, id: l.gamerId }]))
      const parts: any[] = []
      winnerEntries.forEach(([id], i) => {
        if (i > 0) parts.push(h('span', ', '))
        const g = gamerMap[id]
        if (g) parts.push(gamerLink(g.id, g.name))
        else parts.push(h('span', `Bot#${id}`))
      })
      return h('span', { style: 'color:#18a058;font-weight:600' }, parts)
    } catch { return h('span', { style: 'color:#aaa' }, '-') }
  }},
  { title: '时间', key: 'createdAt', width: 120, render: r => matchLink(r.id, r.createdAt ? dayjs(r.createdAt).format('MM-DD HH:mm') : '-') },
]

// ── Submit Bot ──
const showSubmitModal = ref(false)
const showApiKeyModal = ref(false)
const createdApiKey = ref('')
const createdGamerId = ref(0)

function copyApiKey() {
  navigator.clipboard?.writeText(createdApiKey.value)
}
const submitting = ref(false)
const submitForm = ref({
  title: '', type: 'code' as string,
  language: 'python', code: '', opensource: true, webhookUrl: '', webhookSecret: '',
})

const botLanguageOptions = [
  { label: 'Python 3', value: 'python' },
  { label: 'C++', value: 'cpp' },
  { label: 'Java', value: 'java' },
  { label: 'JavaScript', value: 'javascript' },
]
const codePlaceholder = `import json
inp = json.loads(input())
requests = inp.get("requests", [])
last = json.loads(requests[-1]) if requests else {}
print(json.dumps({"0": 4}))`

const webhookRequestDoc = `POST https://your-server.com/bot\n{ "requests": ["<JSON>", ...], "responses": [...] }\n// 返回: {"0": 4}`

const externalBotDoc = computed(() => {
  const server = typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:3000` : 'http://SERVER:3000'
  return `import requests, time, json
SERVER = "${server}"
GAMER_ID = <你的GamerId>
BOT_KEY = "<你的BotApiKey>"
HEADERS = {"X-Bot-Key": BOT_KEY}

while True:
    r = requests.get(f"{SERVER}/compete/bot-turn",
                     params={"gamerId": GAMER_ID},
                     headers=HEADERS, timeout=35)
    if r.status_code == 200:
        data = r.json()
        if not data.get("waiting"):
            move = json.dumps({"0": 4})  # 你的决策
            requests.post(f"{SERVER}/compete/bot-respond",
                          json={"turnToken": data["turnToken"], "response": move},
                          headers=HEADERS, timeout=10)
    time.sleep(0.1)`
})

const generatedExternalCode = computed(() => {
  const server = typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:3000` : 'http://SERVER:3000'
  return `import requests, time, json
SERVER = "${server}"
GAMER_ID = ${createdGamerId.value}
BOT_KEY = "${createdApiKey.value}"
HEADERS = {"X-Bot-Key": BOT_KEY}

while True:
    r = requests.get(f"{SERVER}/compete/bot-turn",
                     params={"gamerId": GAMER_ID},
                     headers=HEADERS, timeout=35)
    if r.status_code == 200:
        data = r.json()
        if not data.get("waiting"):
            move = json.dumps({"0": 4})  # TODO: 实现你的决策
            requests.post(f"{SERVER}/compete/bot-respond",
                          json={"turnToken": data["turnToken"], "response": move},
                          headers=HEADERS, timeout=10)
    time.sleep(0.1)`
})

async function handleSubmitBot() {
  if (!submitForm.value.title.trim()) { message.warning('请填写 Bot 名称'); return }
  const t = submitForm.value.type
  if (t === 'code' && !submitForm.value.code.trim()) { message.warning('请填写代码'); return }
  if (t === 'webhook' && !submitForm.value.webhookUrl.trim()) { message.warning('请填写 Webhook URL'); return }

  submitting.value = true
  const isExternal = t === 'webhook' || t === 'external' || t === 'human'
  try {
    const res = await competeApi.createGamer({
      gameId: gameId.value,
      title: submitForm.value.title,
      type: t as any,
      language: isExternal ? 'webhook' : submitForm.value.language,
      code: isExternal ? '' : submitForm.value.code,
      opensource: submitForm.value.opensource,
      webhookUrl: t === 'webhook' ? submitForm.value.webhookUrl : undefined,
      webhookSecret: t === 'webhook' && submitForm.value.webhookSecret ? submitForm.value.webhookSecret : undefined,
    })
    const created = res.data as any
    showSubmitModal.value = false
    submitForm.value = { title: '', type: 'code', language: 'python', code: '', opensource: true, webhookUrl: '', webhookSecret: '' }
    fetchMyBots()

    if (t === 'external' && created?.botApiKey) {
      createdGamerId.value = created.id
      createdApiKey.value = created.botApiKey
      showApiKeyModal.value = true
    } else if (t === 'human') {
      message.success('真人 Bot 创建成功！在参赛页面点击 🎮 加入对局')
    } else {
      message.success('Bot 提交成功！')
    }
  } catch (e: any) {
    message.error(e?.response?.data?.message || e?.message || '提交失败')
  } finally {
    submitting.value = false
  }
}

useHead(computed(() => ({ title: `${game.value?.title || '游戏'} — Leverage OJ` })))
</script>

<style scoped>
.compete-game-page { display: flex; flex-direction: column; gap: 16px; }
.game-header { }

.bot-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border: 1px solid var(--n-border-color, #e0e0e6);
  border-radius: 8px;
  gap: 12px;
  transition: border-color 0.2s;
}
.bot-card.selected {
  border-color: #18a058;
  background: #f0faf4;
}

.bot-card.disabled {
  opacity: 0.5;
  background: #fafafa;
  cursor: not-allowed;
}
</style>
