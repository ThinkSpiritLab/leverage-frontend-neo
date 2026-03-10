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
          <NButton type="primary" size="small" @click="navigateTo(`/compete/${gameId}`)">⚔️ 创建对局</NButton>
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
          <NSpace vertical :size="4">
            <NRadioGroup v-model:value="submitForm.type">
              <NSpace vertical :size="6">
                <NRadio value="code">🖥️ 代码 Bot — 上传代码，在服务器沙箱运行</NRadio>
                <NRadio value="external">🔗 外部 Bot — 你的程序主动轮询服务器（无需公网 IP）</NRadio>
                <NRadio value="webhook">📡 Webhook Bot — 服务器主动调你的 URL（需公网 IP）</NRadio>
                <NRadio value="human">🧑 真人 — 在浏览器网页上手动输入移动</NRadio>
              </NSpace>
            </NRadioGroup>
          </NSpace>
        </NFormItem>
        <NFormItem v-if="submitForm.type === 'code'" label="是否开源">
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

        <!-- external bot (poll mode) -->
        <template v-else-if="submitForm.type === 'external'">
          <NAlert type="success" :show-icon="false" style="margin-bottom:8px;font-size:13px">
            <div><b>你的程序主动拉取轮到自己的回合，无需公网 IP：</b></div>
            <pre style="margin:8px 0;font-size:12px">{{ externalBotDoc }}</pre>
          </NAlert>
        </template>

        <!-- webhook bot (passive, server calls user) -->
        <template v-else-if="submitForm.type === 'webhook'">
          <NFormItem label="Webhook URL" required>
            <NInput v-model:value="submitForm.webhookUrl" placeholder="https://your-bot.example.com/move" />
          </NFormItem>
          <NFormItem label="签名密钥">
            <NInput v-model:value="submitForm.webhookSecret" placeholder="可选，用于验证请求来源" />
          </NFormItem>
          <NAlert type="warning" :show-icon="false" style="margin-bottom:8px;font-size:13px">
            <div>⚠️ 需要公网 IP 或域名。服务器 POST 到你的 URL：</div>
            <pre style="margin:4px 0;font-size:12px">{{ webhookRequestDoc }}</pre>
          </NAlert>
        </template>

        <!-- human player -->
        <template v-else-if="submitForm.type === 'human'">
          <NAlert type="info" :show-icon="false" style="margin-bottom:8px;font-size:13px">
            🧑 对局开始后，在<b>对局详情页</b>实时看到棋盘状态，并手动输入你的移动。<br>
            每轮有 <b>5 分钟</b>输入时间，超时自动弃权。
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

    <!-- API Key 弹窗（external/human bot创建后显示） -->
    <NModal v-model:show="showApiKeyModal" preset="card" title="🔑 Bot API Key" style="width:580px">
      <NAlert type="success" style="margin-bottom:12px">
        Bot 创建成功！以下是你的 API Key（<b>只显示一次，请立即保存</b>）
      </NAlert>
      <NFormItem label="Bot API Key">
        <NInputGroup>
          <NInput :value="createdApiKey" readonly style="font-family:monospace;font-size:13px" />
          <NButton @click="() => { navigator.clipboard?.writeText(createdApiKey); }">复制</NButton>
        </NInputGroup>
      </NFormItem>
      <NFormItem label="Gamer ID">
        <NInput :value="String(createdGamerId)" readonly style="font-family:monospace" />
      </NFormItem>
      <NAlert type="info" :show-icon="false" style="font-size:13px;margin-top:8px">
        <b>Python 外部 Bot 示例代码：</b>
        <pre style="margin:8px 0;font-size:12px;white-space:pre-wrap">{{ generatedExternalCode }}</pre>
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
import { h } from 'vue'
import { NButton, NTag, NSpace, NInputGroup, useMessage } from 'naive-ui'
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
  {
    title: '类型', key: 'type', width: 90,
    render: (r: any) => {
      const map: Record<string, { label: string; type: 'info' | 'warning' | 'success' | 'error' }> = {
        code: { label: '代码', type: 'info' },
        webhook: { label: 'Webhook', type: 'warning' },
        external: { label: '外部轮询', type: 'success' },
        human: { label: '真人', type: 'error' },
      }
      const m = map[r.type] ?? { label: r.type, type: 'info' }
      return h(NTag, { size: 'small', type: m.type }, () => m.label)
    },
  },
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
const showApiKeyModal = ref(false)
const createdApiKey = ref('')
const createdGamerId = ref(0)
const submitting = ref(false)
const submitForm = ref({
  title: '',
  type: 'code' as 'code' | 'webhook' | 'external' | 'human',
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
{ "requests": ["<JSON>", ...], "responses": [...] }
// 返回: {"0": 4}`

const externalBotDoc = `import requests, time
SERVER = "http://${location?.hostname ?? 'localhost'}:3000"
GAMER_ID = <你的GamerId>
TOKEN = "<你的JWT Token>"

while True:
    r = requests.get(f"{SERVER}/compete/bot-turn",
                     params={"gamerId": GAMER_ID},
                     headers={"Authorization": f"Bearer {TOKEN}"},
                     timeout=35)
    if r.status_code == 200 and not r.json().get("waiting"):
        state = r.json()
        move = my_logic(state["gameState"])
        requests.post(f"{SERVER}/compete/bot-respond",
                      json={"turnToken": state["turnToken"], "response": move},
                      headers={"Authorization": f"Bearer {TOKEN}"})
    time.sleep(0.1)`

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
  const t = submitForm.value.type
  const isExternal = t === 'webhook' || t === 'external' || t === 'human'
  try {
    const res = await competeApi.createGamer({
      gameId,
      title: submitForm.value.title,
      type: t,
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

    // 仅 external 类型弹 API Key 窗口（human 用浏览器 JWT，不需要 key）
    if (t === 'external' && created?.botApiKey) {
      createdGamerId.value = created.id
      createdApiKey.value = created.botApiKey
      showApiKeyModal.value = true
    } else if (t === 'human') {
      message.success('真人 Bot 创建成功！对局开始后在"对局详情"页面操作。')
    } else {
      message.success('Bot 提交成功！')
    }
  } catch (e: any) {
    message.error(e?.response?.data?.message || e?.message || '提交失败')
  } finally {
    submitting.value = false
  }
}

const generatedExternalCode = computed(() => {
  const server = typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:3000` : 'http://SERVER:3000'
  return `import requests, time, json

SERVER = "${server}"
GAMER_ID = ${createdGamerId.value}
BOT_KEY = "${createdApiKey.value}"
HEADERS = {"X-Bot-Key": BOT_KEY, "Content-Type": "application/json"}

def my_logic(game_state):
    # TODO: 实现你的决策逻辑
    # game_state 包含当前棋盘状态
    import random
    return json.dumps({"0": random.randint(0, 8)})

while True:
    try:
        r = requests.get(f"{SERVER}/compete/bot-turn",
                         params={"gamerId": GAMER_ID},
                         headers=HEADERS, timeout=35)
        if r.status_code == 200:
            data = r.json()
            if not data.get("waiting"):
                move = my_logic(data["gameState"])
                requests.post(f"{SERVER}/compete/bot-respond",
                              json={"turnToken": data["turnToken"], "response": move},
                              headers=HEADERS, timeout=10)
        time.sleep(0.1)
    except Exception as e:
        print(f"Error: {e}")
        time.sleep(2)`
})

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
