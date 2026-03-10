<template>
  <div class="compete-detail-page">
    <!-- 游戏标题 -->
    <NSpin :show="gameLoading">
      <div class="game-header">
        <NH2>{{ game?.name || '游戏详情' }}</NH2>
        <NText depth="3">{{ game?.description }}</NText>
      </div>
    </NSpin>

    <!-- Tab 切换 -->
    <NTabs v-model:value="activeTab" type="line" animated>
      <!-- 排行榜 -->
      <NTabPane name="leaderboard" tab="排行榜">
        <NSpin :show="leaderboardLoading">
          <NDataTable
            :columns="leaderboardColumns"
            :data="leaderboard"
            :bordered="false"
            :row-key="(row: any) => row.gamerId || row.id"
          />
        </NSpin>
      </NTabPane>

      <!-- Bot 列表 -->
      <NTabPane name="gamers" tab="Bot 列表">
        <div class="tab-actions">
          <NButton
            type="primary"
            :disabled="selectedGamerIds.length < 2"
            @click="handleLaunchMatch"
          >
            发起对局 (已选 {{ selectedGamerIds.length }})
          </NButton>
          <NText depth="3" style="margin-left: 8px">选择 2-4 个 Bot 发起对局</NText>
        </div>
        <NSpin :show="gamersLoading">
          <NDataTable
            :columns="gamerColumns"
            :data="gamers"
            :bordered="false"
            :row-key="(row: any) => row.id"
            :checked-row-keys="selectedGamerIds"
            @update:checked-row-keys="onGamerSelect"
          />
        </NSpin>
      </NTabPane>

      <!-- 我的 Bot -->
      <NTabPane v-if="authStore.isLoggedIn" name="my-gamers" tab="我的 Bot">
        <div class="tab-actions">
          <NButton type="primary" @click="openCreateGamerModal">
            + 创建 Bot
          </NButton>
        </div>
        <NSpin :show="gamersLoading">
          <NDataTable
            :columns="myGamerColumns"
            :data="myGamers"
            :bordered="false"
            :row-key="(row: any) => row.id"
          />
        </NSpin>
      </NTabPane>

      <!-- 活跃房间 -->
      <NTabPane name="rooms" tab="活跃房间">
        <div class="tab-actions">
          <NButton type="primary" @click="handleCreateRoom">
            创建房间
          </NButton>
        </div>
        <NSpin :show="roomsLoading">
          <NEmpty v-if="!roomsLoading && gameRooms.length === 0" description="暂无活跃房间" />
          <NDataTable
            v-else
            :columns="roomColumns"
            :data="gameRooms"
            :bordered="false"
            :row-key="(row: any) => row.id"
          />
        </NSpin>
      </NTabPane>

      <!-- 对局记录 -->
      <NTabPane name="matches" tab="对局记录">
        <NSpin :show="matchesLoading">
          <NDataTable
            :columns="matchColumns"
            :data="matches"
            :bordered="false"
            :row-key="(row: any) => row.id"
          />
        </NSpin>
        <NPagination
          v-if="matchTotal > matchPageSize"
          v-model:page="matchPage"
          :page-size="matchPageSize"
          :item-count="matchTotal"
          style="margin-top: 16px; justify-content: flex-end"
          @update:page="fetchMatches"
        />
      </NTabPane>
    </NTabs>

    <!-- 创建/编辑 Bot 弹窗 -->
    <NModal
      v-model:show="gamerModalVisible"
      :title="editingGamer ? '编辑 Bot' : '创建 Bot'"
      preset="card"
      style="width: 720px"
    >
      <NForm
        ref="gamerFormRef"
        :model="gamerForm"
        :rules="gamerRules"
        label-placement="left"
        label-width="80"
      >
        <NFormItem label="Bot 名称" path="name">
          <NInput v-model:value="gamerForm.name" placeholder="输入 Bot 名称" />
        </NFormItem>
        <NFormItem label="语言" path="language">
          <NSelect
            v-model:value="gamerForm.language"
            :options="languageOptions"
            placeholder="选择编程语言"
          />
        </NFormItem>
        <NFormItem label="Bot 代码" path="code">
          <div style="width: 100%">
            <CodeEditor
              v-model="gamerForm.code"
              :language="gamerForm.language || 'cpp'"
              height="320px"
            />
          </div>
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="gamerModalVisible = false">取消</NButton>
          <NButton type="primary" :loading="submitting" @click="submitGamer">
            {{ editingGamer ? '保存' : '创建' }}
          </NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>

<script setup lang="ts">
import { h } from 'vue'
import { NButton, NTag, NSpace, useMessage } from 'naive-ui'
import type { DataTableColumns, FormInst } from 'naive-ui'
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  layout: 'default',
  middleware: 'auth',
})

const route = useRoute()
const gameId = computed(() => Number(route.params.id))
const competeApi = useCompeteApi()
const authStore = useAuthStore()
const message = useMessage()

// ─── 游戏基本信息 ──────────────────────────────────────────────────────────────
const game = ref<any>(null)
const gameLoading = ref(false)

async function fetchGame() {
  gameLoading.value = true
  try {
    const res = await competeApi.getGame(gameId.value)
    game.value = res.data || null
  }
  catch (e) {
    console.error(e)
  }
  finally {
    gameLoading.value = false
  }
}

// ─── Tab ───────────────────────────────────────────────────────────────────────
const activeTab = ref('leaderboard')

// ─── 排行榜 ────────────────────────────────────────────────────────────────────
const leaderboard = ref<any[]>([])
const leaderboardLoading = ref(false)

async function fetchLeaderboard() {
  leaderboardLoading.value = true
  try {
    // 用 gamers 列表（含 elo），按 elo 降序展示所有 bot
    const res = await competeApi.getGamers({ gameId: gameId.value, page: 1, perPage: 100 })
    const raw = Array.isArray(res.data?.items) ? res.data.items : []
    leaderboard.value = [...raw].sort((a, b) => (b.elo ?? 1200) - (a.elo ?? 1200))
  }
  catch (e) {
    console.error(e)
  }
  finally {
    leaderboardLoading.value = false
  }
}

const leaderboardColumns: DataTableColumns<any> = [
  {
    title: '排名',
    key: 'rank',
    width: 60,
    render(_row, index) {
      const medals: Record<number, string> = { 0: '🥇', 1: '🥈', 2: '🥉' }
      return h('span', medals[index] ?? `#${index + 1}`)
    },
  },
  {
    title: 'Bot 名称',
    key: 'name',
    render(row) {
      return h(
        NButton,
        { text: true, type: 'primary', onClick: () => navigateTo(`/compete/gamer/${row.id ?? row.gamerId}`) },
        { default: () => row.name || '-' },
      )
    },
  },
  {
    title: 'ELO',
    key: 'elo',
    width: 100,
    render(row) {
      const elo = row.elo ?? 1200
      return h(NTag, { type: 'info', size: 'small', bordered: false }, { default: () => String(elo) })
    },
  },
  {
    title: '胜率',
    key: 'winRate',
    render(row) {
      const rate = row.winRate ?? row.score
      if (rate === undefined || rate === null) return h('span', '-')
      const pct = typeof rate === 'number' && rate <= 1 ? `${(rate * 100).toFixed(1)}%` : String(rate)
      return h('span', pct)
    },
  },
  {
    title: '对局数',
    key: 'matchCount',
    render(row) {
      return h('span', row.matchCount ?? '-')
    },
  },
]

// ─── Bot 列表 ──────────────────────────────────────────────────────────────────
const gamers = ref<any[]>([])
const gamersLoading = ref(false)
const selectedGamerIds = ref<number[]>([])

async function fetchGamers() {
  gamersLoading.value = true
  try {
    const res = await competeApi.listGamers({ gameId: gameId.value, page: 1, perPage: 100 })
    gamers.value = res.data.items
  }
  catch (e) {
    console.error(e)
  }
  finally {
    gamersLoading.value = false
  }
}

const myGamers = computed(() => {
  if (!authStore.user) return []
  return gamers.value.filter((g: any) => g.userId === authStore.user!.id)
})

function onGamerSelect(keys: (string | number)[]) {
  if (keys.length > 4) {
    message.warning('最多选择 4 个 Bot')
    return
  }
  selectedGamerIds.value = keys as number[]
}

const gamerColumns: DataTableColumns<any> = [
  { type: 'selection', disabled: (row) => !!(selectedGamerIds.value.length >= 4 && !selectedGamerIds.value.includes(row.id)) },
  { title: 'Bot 名称', key: 'name' },
  {
    title: '创建者',
    key: 'user',
    render(row) {
      return h('span', row.user?.username || row.userId || '-')
    },
  },
  {
    title: '语言',
    key: 'language',
    render(row) {
      return h(NTag, { size: 'small', bordered: false }, { default: () => row.language || '-' })
    },
  },
]

const myGamerColumns: DataTableColumns<any> = [
  { title: 'Bot 名称', key: 'name' },
  {
    title: '语言',
    key: 'language',
    render(row) {
      return h(NTag, { size: 'small', bordered: false }, { default: () => row.language || '-' })
    },
  },
  {
    title: '操作',
    key: 'actions',
    render(row) {
      return h(
        NButton,
        { size: 'small', onClick: () => openEditGamerModal(row) },
        { default: () => '编辑' },
      )
    },
  },
]

async function handleLaunchMatch() {
  if (selectedGamerIds.value.length < 2) {
    message.warning('请至少选择 2 个 Bot')
    return
  }
  try {
    const res = await competeApi.launchMatch(gameId.value, selectedGamerIds.value)
    message.success('对局已发起')
    selectedGamerIds.value = []
    navigateTo(`/compete/matches/${res.data.id}`)
  }
  catch (e: any) {
    message.error(e?.response?.data?.message || '发起对局失败')
  }
}

// ─── 活跃房间 ──────────────────────────────────────────────────────────────
const gameRooms = ref<any[]>([])
const roomsLoading = ref(false)

async function fetchRooms() {
  roomsLoading.value = true
  try {
    const res = await competeApi.listRooms({ gameId: gameId.value })
    gameRooms.value = Array.isArray(res.data) ? res.data : []
  }
  catch (e) {
    console.error(e)
  }
  finally {
    roomsLoading.value = false
  }
}

async function handleCreateRoom() {
  try {
    const res = await competeApi.createRoom({ gameId: gameId.value })
    message.success('房间创建成功')
    navigateTo(`/compete/room/${res.data.id}`)
  }
  catch (e: any) {
    message.error(e?.response?.data?.message || '创建房间失败')
  }
}

const roomColumns: DataTableColumns<any> = [
  {
    title: '房间 ID',
    key: 'id',
    width: 100,
    render(row) {
      return h(
        NButton,
        { text: true, type: 'primary', onClick: () => navigateTo(`/compete/room/${row.id}`) },
        { default: () => `#${row.id}` },
      )
    },
  },
  {
    title: '房主',
    key: 'owner',
    render(row) {
      return h('span', row.owner?.username || '-')
    },
  },
  {
    title: '状态',
    key: 'open',
    width: 100,
    render(row) {
      return h(NTag, { type: row.open ? 'success' : 'default', size: 'small', bordered: false }, { default: () => row.open ? '开放中' : '等待中' })
    },
  },
  {
    title: '创建时间',
    key: 'createdAt',
    width: 180,
    render(row) {
      if (!row.createdAt) return h('span', '-')
      return h('span', new Date(row.createdAt).toLocaleString('zh-CN'))
    },
  },
  {
    title: '操作',
    key: 'actions',
    width: 100,
    render(row) {
      return h(
        NButton,
        { size: 'small', type: 'primary', onClick: () => navigateTo(`/compete/room/${row.id}`) },
        { default: () => '进入' },
      )
    },
  },
]

// ─── 对局记录 ──────────────────────────────────────────────────────────────────
const matches = ref<any[]>([])
const matchesLoading = ref(false)
const matchPage = ref(1)
const matchPageSize = ref(20)
const matchTotal = ref(0)

async function fetchMatches() {
  matchesLoading.value = true
  try {
    const res = await competeApi.listMatches({ gameId: gameId.value, page: matchPage.value, perPage: matchPageSize.value })
    matches.value = res.data.items
    matchTotal.value = res.data.total
  }
  catch (e) {
    console.error(e)
  }
  finally {
    matchesLoading.value = false
  }
}

const matchColumns: DataTableColumns<any> = [
  {
    title: '对局 ID',
    key: 'id',
    width: 80,
    render(row) {
      return h(
        NButton,
        {
          text: true,
          type: 'primary',
          onClick: () => navigateTo(`/compete/matches/${row.id}`),
        },
        { default: () => `#${row.id}` },
      )
    },
  },
  {
    title: '参与 Bot',
    key: 'gamers',
    render(row) {
      const names = (row.gamers || row.gamerIds || []).map((g: any) =>
        typeof g === 'object' ? g.name : `Bot#${g}`,
      ).join(', ')
      return h('span', names || '-')
    },
  },
  {
    title: '胜者',
    key: 'winner',
    render(row) {
      const winner = row.winner?.name || row.winnerId || '-'
      return h('span', winner)
    },
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render(row) {
      const statusMap: Record<string, 'default' | 'info' | 'success' | 'warning' | 'error'> = {
        PENDING: 'default',
        RUNNING: 'info',
        COMPLETED: 'success',
        FAILED: 'error',
      }
      const s = (row.status || '').toUpperCase()
      return h(NTag, { type: statusMap[s] || 'default', size: 'small', bordered: false }, { default: () => row.status || '-' })
    },
  },
  {
    title: '时间',
    key: 'createdAt',
    width: 180,
    render(row) {
      if (!row.createdAt) return h('span', '-')
      return h('span', new Date(row.createdAt).toLocaleString('zh-CN'))
    },
  },
]

// ─── 创建/编辑 Bot 弹窗 ────────────────────────────────────────────────────────
const gamerModalVisible = ref(false)
const editingGamer = ref<any>(null)
const submitting = ref(false)
const gamerFormRef = ref<FormInst | null>(null)

const gamerForm = reactive({
  name: '',
  language: 'cpp',
  code: '',
})

const gamerRules = {
  name: [{ required: true, message: '请输入 Bot 名称', trigger: 'blur' }],
  language: [{ required: true, message: '请选择语言', trigger: 'change' }],
  code: [{ required: true, message: '请输入 Bot 代码', trigger: 'blur' }],
}

const languageOptions = [
  { label: 'C++', value: 'cpp' },
  { label: 'C', value: 'c' },
  { label: 'Java', value: 'java' },
  { label: 'Python 3', value: 'python3' },
  { label: 'Python 2', value: 'python2' },
  { label: 'JavaScript', value: 'javascript' },
]

function openCreateGamerModal() {
  editingGamer.value = null
  gamerForm.name = ''
  gamerForm.language = 'cpp'
  gamerForm.code = ''
  gamerModalVisible.value = true
}

function openEditGamerModal(gamer: any) {
  editingGamer.value = gamer
  gamerForm.name = gamer.name
  gamerForm.language = gamer.language || 'cpp'
  gamerForm.code = gamer.code || ''
  gamerModalVisible.value = true
}

async function submitGamer() {
  try {
    await gamerFormRef.value?.validate()
  }
  catch {
    return
  }

  submitting.value = true
  try {
    if (editingGamer.value) {
      await competeApi.updateGamer(editingGamer.value.id, {
        name: gamerForm.name,
        code: gamerForm.code,
        language: gamerForm.language,
      })
      message.success('Bot 已更新')
    }
    else {
      await competeApi.createGamer({
        gameId: gameId.value,
        name: gamerForm.name,
        code: gamerForm.code,
        language: gamerForm.language,
      })
      message.success('Bot 创建成功')
    }
    gamerModalVisible.value = false
    await fetchGamers()
  }
  catch (e: any) {
    message.error(e?.response?.data?.message || '操作失败')
  }
  finally {
    submitting.value = false
  }
}

// ─── Init ──────────────────────────────────────────────────────────────────────
onMounted(async () => {
  await fetchGame()
  await Promise.all([fetchLeaderboard(), fetchGamers(), fetchRooms(), fetchMatches()])
})

useHead(computed(() => ({ title: game.value?.name ? `${game.value.name} — Leverage OJ` : '游戏 — Leverage OJ' })))
</script>

<style scoped>
.compete-detail-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.game-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.game-header :deep(.n-h2) {
  margin: 0;
}

.tab-actions {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}
</style>
