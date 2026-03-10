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
        <NSpace>
          <NText depth="3">⏱ 时限 {{ game.timeLimit }}ms</NText>
          <NText depth="3">💾 内存 {{ game.memoryLimit }}MB</NText>
          <NText depth="3">👥 {{ game.gamerQuantity }} 人对战</NText>
        </NSpace>
      </div>

      <NTabs v-model:value="activeTab" type="line" animated style="margin-top:16px">
        <!-- 排行榜 -->
        <NTabPane name="leaderboard" tab="🏆 排行榜">
          <div style="margin-top:12px">
            <NSpace style="margin-bottom:12px" align="center">
              <NSwitch v-model:value="showNonBot" @update:value="fetchLeaderboard">
                <template #checked>显示真人/外部</template>
                <template #unchecked>仅 Bot 竞争</template>
              </NSwitch>
              <NButton size="small" @click="fetchLeaderboard">刷新</NButton>
            </NSpace>
            <NDataTable
              :columns="leaderboardColumns"
              :data="leaderboard"
              :loading="leaderboardLoading"
              :row-key="(r: any) => r.gamerId"
              size="small"
            />
          </div>
        </NTabPane>

        <!-- 我的 Bot -->
        <NTabPane name="my-bots" tab="🤖 我的 Bot">
          <div style="margin-top:12px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
              <NText>已提交的 Bot</NText>
              <NButton type="primary" @click="showSubmitModal = true">+ 提交 Bot</NButton>
            </div>
            <NDataTable
              :columns="myBotColumns"
              :data="myBots"
              :loading="myBotsLoading"
              :row-key="(r: any) => r.id"
              size="small"
            />
          </div>
        </NTabPane>

        <!-- 对局记录 -->
        <NTabPane name="matches" tab="⚔️ 对局记录">
          <div style="margin-top:12px">
            <NButton size="small" style="margin-bottom:12px" @click="fetchMatches">刷新</NButton>
            <NDataTable
              :columns="matchColumns"
              :data="matches"
              :loading="matchesLoading"
              :row-key="(r: any) => r.id"
              size="small"
            />
            <NPagination
              v-if="matchTotal > matchPerPage"
              v-model:page="matchPage"
              :page-count="Math.ceil(matchTotal / matchPerPage)"
              style="margin-top:12px;justify-content:flex-end"
              @update:page="fetchMatches"
            />
          </div>
        </NTabPane>
      </NTabs>
    </NSpin>

    <!-- 提交 Bot 弹窗 -->
    <NModal
      v-model:show="showSubmitModal"
      title="提交 Bot"
      preset="card"
      style="width:640px;max-height:90vh;overflow-y:auto"
    >
      <NForm :model="submitForm" label-placement="left" label-width="110px">
        <NFormItem label="Bot 名称" required>
          <NInput v-model:value="submitForm.title" placeholder="给你的 Bot 起个名字" />
        </NFormItem>
        <NFormItem label="Bot 类型">
          <NRadioGroup v-model:value="submitForm.type">
            <NRadio value="code">代码 Bot（在沙箱中运行）</NRadio>
            <NRadio value="webhook">Webhook Bot（调用外部服务）</NRadio>
          </NRadioGroup>
        </NFormItem>
        <NFormItem label="是否开源">
          <NSwitch v-model:value="submitForm.opensource" />
        </NFormItem>

        <!-- code bot -->
        <template v-if="submitForm.type === 'code'">
          <NFormItem label="语言" required>
            <NSelect
              v-model:value="submitForm.language"
              :options="botLanguageOptions"
              style="width:180px"
            />
          </NFormItem>
          <NFormItem label="代码" required>
            <NInput
              v-model:value="submitForm.code"
              type="textarea"
              :rows="14"
              :placeholder="codePlaceholder"
              style="font-family:monospace;font-size:13px"
            />
          </NFormItem>
        </template>

        <!-- webhook bot -->
        <template v-else>
          <NFormItem label="Webhook URL" required>
            <NInput v-model:value="submitForm.webhookUrl" placeholder="https://your-bot.example.com/move" />
          </NFormItem>
          <NFormItem label="签名密钥">
            <NInput v-model:value="submitForm.webhookSecret" placeholder="可选，用于验证请求来源" />
          </NFormItem>
          <NAlert type="info" :show-icon="false" style="margin-bottom:8px;font-size:13px">
            <div><b>请求格式（POST JSON）：</b></div>
            <pre style="margin:4px 0;font-size:12px">{{ webhookRequestDoc }}</pre>
            <div><b>响应格式（纯文本或 JSON）：</b></div>
            <pre style="margin:4px 0;font-size:12px">{{ webhookResponseDoc }}</pre>
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
  </div>
</template>

<script setup lang="ts">
import { h } from 'vue'
import { NButton, NTag, NSpace, useMessage } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import dayjs from 'dayjs'

definePageMeta({ layout: 'default' })

const route = useRoute()
const gameId = Number(route.params.id)
const competeApi = useCompeteApi()
const message = useMessage()

// ── Game info ──
const game = ref<any>(null)
const loading = ref(false)
const activeTab = ref('leaderboard')

async function fetchGame() {
  loading.value = true
  try {
    const res = await competeApi.getGame(gameId)
    game.value = res.data
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

onMounted(fetchGame)

// ── Leaderboard ──
const leaderboard = ref<any[]>([])
const leaderboardLoading = ref(false)
const showNonBot = ref(false)
const leaderboardBoard = computed(() => showNonBot.value ? 'outer' : 'inner')

const TYPE_LABEL: Record<string, string> = {
  code: '',
  human: '🧑 真人',
  external: '🔗 外部',
  webhook: '🔗 Webhook',
}

async function fetchLeaderboard() {
  leaderboardLoading.value = true
  try {
    const res = await competeApi.getLeaderboard(gameId, leaderboardBoard.value as 'inner' | 'outer')
    leaderboard.value = Array.isArray(res.data) ? res.data : []
  } catch (e) { console.error(e) }
  finally { leaderboardLoading.value = false }
}

const leaderboardColumns = computed<DataTableColumns<any>>(() => [
  { title: '#', key: '_rank', width: 50, render: (_r: any, i: number) => i + 1 },
  {
    title: 'Bot 名称',
    key: 'name',
    render: (r: any) => {
      const tag = TYPE_LABEL[r.type] || ''
      return h('span', [
        h(NButton, { text: true, type: 'primary', onClick: () => navigateTo(`/compete/gamer/${r.gamerId}`) }, () => r.name || `Bot#${r.gamerId}`),
        tag ? h('span', { style: 'margin-left:6px;font-size:12px;color:#999' }, tag) : null,
      ])
    },
  },
  { title: showNonBot.value ? 'ELO（外榜）' : 'ELO（内榜）', key: 'elo', width: 100 },
  { title: '胜场', key: 'wins', width: 70 },
  { title: '总场', key: 'total', width: 70 },
  { title: '胜率', key: 'winRate', width: 80, render: (r: any) => r.winRate != null ? `${(r.winRate * 100).toFixed(1)}%` : '-' },
])

// ── My Bots ──
const myBots = ref<any[]>([])
const myBotsLoading = ref(false)

async function fetchMyBots() {
  myBotsLoading.value = true
  try {
    const res = await competeApi.listGamers({ gameId })
    myBots.value = (res.data as any)?.items || []
  } catch (e) { console.error(e) }
  finally { myBotsLoading.value = false }
}

const myBotColumns: DataTableColumns<any> = [
  { title: 'ID', key: 'id', width: 60 },
  { title: '名称', key: 'name', render: r => h(NButton, { text: true, type: 'primary', onClick: () => navigateTo(`/compete/gamer/${r.id}`) }, () => r.title || r.name) },
  { title: '类型', key: 'type', width: 90, render: r => h(NTag, { size: 'small', type: r.type === 'webhook' ? 'warning' : 'info' }, () => r.type === 'webhook' ? 'Webhook' : '代码') },
  { title: '语言', key: 'language', width: 90 },
  { title: 'ELO', key: 'elo', width: 70 },
  { title: '操作', key: 'actions', width: 80, render: r => h(NButton, { size: 'small', onClick: () => navigateTo(`/compete/gamer/${r.id}`) }, () => '查看/编辑') },
]

// ── Matches ──
const matches = ref<any[]>([])
const matchesLoading = ref(false)
const matchPage = ref(1)
const matchTotal = ref(0)
const matchPerPage = 15

async function fetchMatches() {
  matchesLoading.value = true
  try {
    const res = await competeApi.listMatches({ gameId, page: matchPage.value, perPage: matchPerPage })
    const data = res.data as any
    matches.value = data?.items || []
    matchTotal.value = data?.total || 0
  } catch (e) { console.error(e) }
  finally { matchesLoading.value = false }
}

const statusLabel: Record<number, string> = { 0: '等待中', 1: '进行中', 2: '已完成', 3: '错误' }
const statusType: Record<number, any> = { 0: 'default', 1: 'info', 2: 'success', 3: 'error' }

const matchColumns: DataTableColumns<any> = [
  { title: 'ID', key: 'id', width: 60 },
  { title: '状态', key: 'status', width: 90, render: r => h(NTag, { size: 'small', type: statusType[r.status] }, () => statusLabel[r.status] ?? r.status) },
  { title: '参与者', key: 'links', render: r => r.links?.map((l: any) => l.gamer?.title || `Bot#${l.gamerId}`).join(' vs ') || '-' },
  { title: '时间', key: 'createdAt', width: 150, render: r => r.createdAt ? dayjs(r.createdAt).format('MM-DD HH:mm') : '-' },
  { title: '', key: 'actions', width: 60, render: r => h(NButton, { size: 'small', text: true, type: 'primary', onClick: () => navigateTo(`/compete/matches/${r.id}`) }, () => '查看') },
]

// ── Submit Bot modal ──
const showSubmitModal = ref(false)
const submitting = ref(false)
const submitForm = ref({
  title: '',
  type: 'code' as 'code' | 'webhook',
  language: 'python',
  code: '',
  opensource: true,
  webhookUrl: '',
  webhookSecret: '',
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
# 处理游戏状态并输出你的决策
print(json.dumps({"0": 4}))`

const webhookRequestDoc = `POST https://your-server.com/bot
Content-Type: application/json

{
  "requests": ["<JSON>", ...],
  "responses": [...],
  "time_limit": 2,
  "memory_limit": 256
}`

const webhookResponseDoc = `// 返回你的决策（纯文本或 JSON）
{"0": 4}    // 玩家0落子位置4`

async function handleSubmitBot() {
  if (!submitForm.value.title.trim()) {
    message.warning('请填写 Bot 名称')
    return
  }
  if (submitForm.value.type === 'code' && !submitForm.value.code.trim()) {
    message.warning('请填写代码')
    return
  }
  if (submitForm.value.type === 'webhook' && !submitForm.value.webhookUrl.trim()) {
    message.warning('请填写 Webhook URL')
    return
  }
  submitting.value = true
  try {
    await competeApi.createGamer({
      gameId,
      title: submitForm.value.title,
      type: submitForm.value.type,
      language: submitForm.value.type === 'code' ? submitForm.value.language : 'webhook',
      code: submitForm.value.type === 'code' ? submitForm.value.code : '',
      opensource: submitForm.value.opensource,
      webhookUrl: submitForm.value.type === 'webhook' ? submitForm.value.webhookUrl : undefined,
      webhookSecret: submitForm.value.type === 'webhook' && submitForm.value.webhookSecret ? submitForm.value.webhookSecret : undefined,
    })
    message.success('Bot 提交成功！')
    showSubmitModal.value = false
    submitForm.value = { title: '', type: 'code', language: 'python', code: '', opensource: true, webhookUrl: '', webhookSecret: '' }
    fetchMyBots()
  } catch (e: any) {
    message.error(e?.response?.data?.message || e?.message || '提交失败')
  } finally {
    submitting.value = false
  }
}

// ── Tab lazy load ──
watch(activeTab, (tab) => {
  if (tab === 'leaderboard' && !leaderboard.value.length) fetchLeaderboard()
  if (tab === 'my-bots' && !myBots.value.length) fetchMyBots()
  if (tab === 'matches' && !matches.value.length) fetchMatches()
})

onMounted(fetchLeaderboard)

useHead(computed(() => ({ title: game.value?.title ? `${game.value.title} - Bot 对战` : 'Bot 对战' })))
</script>

<style scoped>
.compete-game-page {
  max-width: 900px;
  margin: 0 auto;
}
.game-header {
  padding: 16px 0 0;
}
</style>
