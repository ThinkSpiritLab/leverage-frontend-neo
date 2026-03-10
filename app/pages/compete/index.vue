<template>
  <div class="compete-page">
    <div class="page-header">
      <NH2>Bot 对战</NH2>
      <NSpace>
        <NButton secondary @click="navigateTo('/compete/playground')">🧪 Playground</NButton>
        <NButton
          v-if="canCreateGame"
          secondary
          type="info"
          @click="navigateTo('/admin/compete/game/new')"
        >
          ➕ 创建新游戏
        </NButton>
        <NButton type="primary" @click="showCreateRoom = true">创建房间</NButton>
      </NSpace>
    </div>

    <NTabs v-model:value="activeTab" type="line" animated>
      <!-- 游戏列表 -->
      <NTabPane name="games" tab="游戏列表">
        <NSpin :show="gamesLoading">
          <div class="game-grid">
            <NCard
              v-for="g in games"
              :key="g.id"
              class="game-card"
              hoverable
              @click="navigateTo(`/compete/games/${g.id}`)"
            >
              <template #header>
                <NSpace align="center" justify="space-between">
                  <NText strong>{{ g.title }}</NText>
                  <NTag size="small" :type="g.disabled ? 'error' : 'success'" :bordered="false">
                    {{ g.disabled ? '已禁用' : '进行中' }}
                  </NTag>
                </NSpace>
              </template>
              <NText depth="3" style="font-size:13px;display:block;min-height:36px">{{ g.description || '暂无描述' }}</NText>
              <NDivider style="margin:10px 0" />
              <NSpace size="small">
                <NTag size="small" :bordered="false">⏱ {{ g.timeLimit }}ms</NTag>
                <NTag size="small" :bordered="false">💾 {{ g.memoryLimit }}MB</NTag>
                <NTag size="small" :bordered="false">👥 {{ g.gamerQuantity }}人</NTag>
              </NSpace>
            </NCard>
            <NEmpty v-if="!games.length" description="暂无游戏" style="grid-column:1/-1;padding:48px 0" />
          </div>
        </NSpin>
        <NPagination
          v-if="gamesTotal > gamesPageSize"
          v-model:page="gamesPage"
          :page-size="gamesPageSize"
          :item-count="gamesTotal"
          style="margin-top: 16px; justify-content: flex-end"
          @update:page="fetchGames"
        />
      </NTabPane>

      <!-- 活跃房间 -->
      <NTabPane name="rooms" tab="活跃房间">
        <NSpin :show="roomsLoading">
          <NEmpty v-if="!roomsLoading && rooms.length === 0" description="暂无活跃房间" />
          <NDataTable
            v-else
            :columns="roomColumns"
            :data="rooms"
            :bordered="false"
            :row-key="(row: any) => row.id"
          />
        </NSpin>
      </NTabPane>

      <!-- 历史对局 -->
      <NTabPane name="history" tab="历史对局">
        <NSpin :show="matchesLoading">
          <NEmpty v-if="!matchesLoading && matches.length === 0" description="暂无对局记录" />
          <NDataTable
            v-else
            :columns="matchColumns"
            :data="matches"
            :bordered="false"
            :row-key="(row: any) => row.id"
          />
        </NSpin>
        <NPagination
          v-if="matchesTotal > matchesPageSize"
          v-model:page="matchesPage"
          :page-size="matchesPageSize"
          :item-count="matchesTotal"
          style="margin-top: 16px; justify-content: flex-end"
          @update:page="fetchMatches"
        />
      </NTabPane>
    </NTabs>

    <!-- 创建房间弹窗 -->
    <NModal
      v-model:show="showCreateRoom"
      title="创建房间"
      preset="card"
      style="width: 420px"
    >
      <NForm label-placement="left" label-width="80">
        <NFormItem label="选择游戏">
          <NSelect
            v-model:value="newRoomGameId"
            :options="gameOptions"
            placeholder="请选择游戏"
          />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="showCreateRoom = false">取消</NButton>
          <NButton
            type="primary"
            :loading="creating"
            :disabled="!newRoomGameId"
            @click="handleCreateRoom"
          >
            创建
          </NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>

<script setup lang="ts">
import { h } from 'vue'
import { NButton, NTag, useMessage } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  layout: 'default',
  middleware: 'auth',
})

const competeApi = useCompeteApi()
const message = useMessage()
const authStore = useAuthStore()

const canCreateGame = computed(() =>
  ['supervisor', 'admin', 'sa'].includes(authStore.user?.role ?? ''),
)

const activeTab = ref('games')

// ─── 游戏列表 ──────────────────────────────────────────────────────────────────
const gamesPage = ref(1)
const gamesPageSize = ref(20)
const games = ref<any[]>([])
const gamesTotal = ref(0)
const gamesLoading = ref(false)

async function fetchGames() {
  gamesLoading.value = true
  try {
    const res = await competeApi.listGames({ page: gamesPage.value, perPage: gamesPageSize.value })
    games.value = res.data.items
    gamesTotal.value = res.data.total
  }
  catch (e) {
    console.error(e)
  }
  finally {
    gamesLoading.value = false
  }
}

const gameColumns: DataTableColumns<any> = [
  {
    title: 'ID',
    key: 'id',
    width: 80,
  },
  {
    title: '游戏名称',
    key: 'name',
    render(row) {
      return h(
        NButton,
        { text: true, type: 'primary', onClick: () => navigateTo(`/compete/games/${row.id}`) },
        { default: () => row.name },
      )
    },
  },
  {
    title: '描述',
    key: 'description',
    ellipsis: { tooltip: true },
    render(row) {
      return h('span', row.description || '-')
    },
  },
  {
    title: '操作',
    key: 'actions',
    width: 120,
    render(row) {
      return h(
        NButton,
        { size: 'small', type: 'primary', onClick: () => navigateTo(`/compete/games/${row.id}`) },
        { default: () => '进入' },
      )
    },
  },
]

// ─── 活跃房间 ──────────────────────────────────────────────────────────────────
const rooms = ref<any[]>([])
const roomsLoading = ref(false)

async function fetchRooms() {
  roomsLoading.value = true
  try {
    const res = await competeApi.listRooms()
    rooms.value = Array.isArray(res.data) ? res.data : []
  }
  catch (e) {
    console.error(e)
  }
  finally {
    roomsLoading.value = false
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
    title: '游戏',
    key: 'game',
    render(row) {
      const name = row.game?.name || '-'
      if (row.game?.id) {
        return h(
          NButton,
          { text: true, type: 'primary', onClick: () => navigateTo(`/compete/games/${row.game.id}`) },
          { default: () => name },
        )
      }
      return h('span', name)
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
      return h(
        NTag,
        { type: row.open ? 'success' : 'default', size: 'small', bordered: false },
        { default: () => row.open ? '开放中' : '等待中' },
      )
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

// ─── 历史对局 ──────────────────────────────────────────────────────────────────
const matches = ref<any[]>([])
const matchesLoading = ref(false)
const matchesPage = ref(1)
const matchesPageSize = ref(20)
const matchesTotal = ref(0)

async function fetchMatches() {
  matchesLoading.value = true
  try {
    const res = await competeApi.listMatches({ page: matchesPage.value, perPage: matchesPageSize.value })
    matches.value = res.data.items
    matchesTotal.value = res.data.total
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
        { text: true, type: 'primary', onClick: () => navigateTo(`/compete/matches/${row.id}`) },
        { default: () => `#${row.id}` },
      )
    },
  },
  {
    title: '游戏',
    key: 'game',
    render(row) {
      if (!row.game) return h('span', '-')
      return h(NButton, { text: true, type: 'primary', onClick: () => navigateTo(`/compete/games/${row.game.id}`) }, () => row.game.name)
    },
  },
  {
    title: '参与 Bot',
    key: 'gamers',
    render(row) {
      const links = row.links?.slice().sort((a:any,b:any) => a.index - b.index)
      if (links?.length) {
        const parts: any[] = []
        links.forEach((l: any, i: number) => {
          if (i > 0) parts.push(h('span', { style: 'color:#999;margin:0 3px' }, 'vs'))
          parts.push(h(NButton, { text: true, type: 'primary', size: 'small', onClick: () => navigateTo(`/compete/gamer/${l.gamerId}`) }, () => l.gamer?.title || l.gamer?.name || `Bot#${l.gamerId}`))
        })
        return h('span', parts)
      }
      const names = (row.gamers || []).map((g: any) => typeof g === 'object' ? g.name : `Bot#${g}`).join(' vs ')
      return h('span', names || '-')
    },
  },
  {
    title: '胜者',
    key: 'winner',
    render(row) {
      if (row.status !== 2) return h('span', { style: 'color:#aaa' }, '-')
      try {
        const fr = typeof row.result === 'string' ? JSON.parse(row.result).finalResult : row.result?.finalResult
        if (!fr) return h('span', { style: 'color:#aaa' }, '-')
        const maxScore = Math.max(...Object.values(fr) as number[])
        const winnerEntries = Object.entries(fr).filter(([,v]) => v === maxScore)
        if (winnerEntries.length === Object.keys(fr).length) return h('span', { style: 'color:#f0a020' }, '平局')
        const gMap = Object.fromEntries((row.links||[]).map((l:any) => [String(l.gamerId), { name: l.gamer?.title||l.gamer?.name||`Bot#${l.gamerId}`, id: l.gamerId }]))
        const parts: any[] = []
        winnerEntries.forEach(([id], i) => {
          if (i > 0) parts.push(h('span', ', '))
          const g = gMap[id]
          parts.push(g ? h(NButton, { text: true, type: 'primary', size: 'small', onClick: () => navigateTo(`/compete/gamer/${g.id}`) }, () => g.name) : h('span', `Bot#${id}`))
        })
        return h('span', { style: 'color:#18a058;font-weight:600' }, parts)
      } catch { return h('span', { style: 'color:#aaa' }, '-') }
    },
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render(row) {
      // status is a number: 0=PENDING, 1=RUNNING, 2=FINISHED, 3=ERROR
      const statusNumMap: Record<number, { type: 'default' | 'info' | 'success' | 'error'; label: string }> = {
        0: { type: 'default', label: '待评测' },
        1: { type: 'info', label: '评测中' },
        2: { type: 'success', label: '已完成' },
        3: { type: 'error', label: '失败' },
      }
      const info = statusNumMap[row.status as number] ?? { type: 'default' as const, label: String(row.status ?? '-') }
      return h(NTag, { type: info.type, size: 'small', bordered: false }, { default: () => info.label })
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

// ─── 创建房间 ──────────────────────────────────────────────────────────────────
const showCreateRoom = ref(false)
const newRoomGameId = ref<number | null>(null)
const creating = ref(false)

const gameOptions = computed(() =>
  games.value.map(g => ({ label: g.name, value: g.id })),
)

async function handleCreateRoom() {
  if (!newRoomGameId.value) return
  creating.value = true
  try {
    const res = await competeApi.createRoom({ gameId: newRoomGameId.value })
    message.success('房间创建成功')
    showCreateRoom.value = false
    navigateTo(`/compete/room/${res.data.id}`)
  }
  catch (e: any) {
    message.error(e?.response?.data?.message || '创建房间失败')
  }
  finally {
    creating.value = false
  }
}

// ─── Init ──────────────────────────────────────────────────────────────────────
onMounted(() => {
  fetchGames()
  fetchRooms()
  fetchMatches()
})

useHead({ title: '对战竞技 — Leverage OJ' })
</script>

<style scoped>
.compete-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.page-header :deep(.n-h2) {
  margin: 0;
}

.game-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
  margin-top: 4px;
}

.game-card {
  cursor: pointer;
  transition: box-shadow 0.2s, transform 0.15s;
}

.game-card:hover {
  transform: translateY(-2px);
}
</style>
