<template>
  <div class="compete-page">
    <div class="page-header">
      <NH2>Bot 对战</NH2>
      <NButton type="primary" @click="showCreateRoom = true">
        创建房间
      </NButton>
    </div>

    <NTabs v-model:value="activeTab" type="line" animated>
      <!-- 游戏列表 -->
      <NTabPane name="games" tab="游戏列表">
        <NSpin :show="gamesLoading">
          <NDataTable
            :columns="gameColumns"
            :data="games"
            :bordered="false"
            :row-key="(row: any) => row.id"
          />
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

definePageMeta({
  layout: 'default',
  middleware: 'auth',
})

const competeApi = useCompeteApi()
const message = useMessage()

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
        { text: true, type: 'primary', onClick: () => navigateTo(`/compete/${row.id}`) },
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
        { size: 'small', type: 'primary', onClick: () => navigateTo(`/compete/${row.id}`) },
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
          { text: true, type: 'primary', onClick: () => navigateTo(`/compete/${row.game.id}`) },
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
      return h('span', row.game?.name || '-')
    },
  },
  {
    title: '参与 Bot',
    key: 'gamers',
    render(row) {
      const names = (row.gamers || []).map((g: any) =>
        typeof g === 'object' ? g.name : `Bot#${g}`,
      ).join(', ')
      return h('span', names || '-')
    },
  },
  {
    title: '胜者',
    key: 'winner',
    render(row) {
      return h('span', row.winner?.name || '-')
    },
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render(row) {
      const statusMap: Record<string, 'default' | 'info' | 'success' | 'warning' | 'error'> = {
        pending: 'default',
        running: 'info',
        done: 'success',
        failed: 'error',
      }
      const s = (row.status || '').toLowerCase()
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
</style>
