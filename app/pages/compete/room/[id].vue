<template>
  <div class="room-page">
    <NSpin :show="loading">
      <NGrid v-if="roomInfo" :cols="12" :x-gap="16" :y-gap="16">
        <!-- 左侧：比赛信息 -->
        <NGridItem :span="3">
          <NSpace vertical :size="12">
            <!-- 比赛信息卡片 -->
            <NCard title="比赛信息" size="small">
              <NDescriptions :column="1" size="small">
                <NDescriptionsItem label="房间 ID">
                  #{{ roomInfo.id }}
                </NDescriptionsItem>
                <NDescriptionsItem label="游戏">
                  <NButton text type="primary" @click="navigateTo(`/compete/${roomInfo.game?.id}`)">
                    {{ roomInfo.game?.name || '-' }}
                  </NButton>
                </NDescriptionsItem>
                <NDescriptionsItem label="房主">
                  {{ roomInfo.owner?.username || '-' }}
                </NDescriptionsItem>
                <NDescriptionsItem label="状态">
                  <NTag :type="roomInfo.open ? 'success' : 'default'" size="small" :bordered="false">
                    {{ roomInfo.open ? '开放中' : '未开放' }}
                  </NTag>
                </NDescriptionsItem>
                <NDescriptionsItem label="创建时间">
                  {{ formatTime(roomInfo.createdAt) }}
                </NDescriptionsItem>
              </NDescriptions>
            </NCard>

            <!-- 倒计时提示 -->
            <NAlert v-if="showCountdownWarning" type="warning" :show-icon="true">
              房间十分钟有效，请尽快开始对局！
            </NAlert>

            <!-- 房主操作 -->
            <NCard v-if="isOwner" title="房主操作" size="small">
              <NSpace vertical>
                <NButton
                  v-if="!roomInfo.open"
                  type="warning"
                  block
                  :loading="actionLoading"
                  @click="handleOpenRoom"
                >
                  开放房间
                </NButton>
                <NButton
                  v-else
                  type="info"
                  block
                  :loading="actionLoading"
                  @click="handleCloseRoom"
                >
                  关闭房间
                </NButton>
                <NButton
                  type="primary"
                  block
                  :loading="actionLoading"
                  :disabled="submitters.length < 2"
                  @click="handleStartRoom"
                >
                  开始对局
                </NButton>
              </NSpace>
            </NCard>

            <!-- 参赛者（提交的 Bot）列表 -->
            <NCard title="参赛 Bot" size="small">
              <div v-if="submitters.length === 0" class="empty-tip">
                <NText depth="3">暂无参赛者</NText>
              </div>
              <NList v-else :show-divider="false" size="small">
                <NListItem v-for="s in submitters" :key="s.id || s.gamerId">
                  <div class="gamer-item">
                    <span class="gamer-name">{{ s.gamer?.name || s.name || `Bot#${s.gamerId}` }}</span>
                    <NTag size="small" :bordered="false">{{ s.gamer?.language || s.language || '-' }}</NTag>
                  </div>
                </NListItem>
              </NList>
            </NCard>
          </NSpace>
        </NGridItem>

        <!-- 右侧：玩家列表 + 提交记录 -->
        <NGridItem :span="9">
          <NSpace vertical :size="12">
            <!-- 玩家位置列表 -->
            <NCard title="玩家列表" size="small">
              <div v-if="players.length === 0" class="empty-tip">
                <NText depth="3">暂无玩家加入</NText>
              </div>
              <NDataTable
                v-else
                :columns="playerColumns"
                :data="players"
                :bordered="false"
                size="small"
                :row-key="(row: any) => row.id || row.userId"
              />
            </NCard>

            <!-- 非房主：提交 Bot -->
            <NCard v-if="!isOwner && authStore.isLoggedIn" title="提交我的 Bot" size="small">
              <NSpace align="center">
                <NSelect
                  v-model:value="selectedGamerId"
                  :options="myGamerOptions"
                  placeholder="选择你的 Bot"
                  style="width: 240px"
                />
                <NButton
                  type="primary"
                  :loading="submitLoading"
                  :disabled="!selectedGamerId"
                  @click="handleSubmitGamer"
                >
                  提交
                </NButton>
              </NSpace>
            </NCard>

            <!-- 提交记录 -->
            <NCard title="提交记录" size="small">
              <template #header-extra>
                <NText depth="3" style="font-size: 12px">每 5 秒自动刷新</NText>
              </template>
              <div v-if="submitters.length === 0" class="empty-tip">
                <NText depth="3">暂无提交记录</NText>
              </div>
              <NDataTable
                v-else
                :columns="submitterColumns"
                :data="submitters"
                :bordered="false"
                size="small"
                :row-key="(row: any) => row.id || row.gamerId"
              />
            </NCard>
          </NSpace>
        </NGridItem>
      </NGrid>

      <NResult v-else-if="!loading" status="404" title="房间不存在或已失效">
        <template #footer>
          <NButton @click="navigateTo('/compete')">返回竞赛列表</NButton>
        </template>
      </NResult>
    </NSpin>
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

const route = useRoute()
const roomId = computed(() => Number(route.params.id))
const competeApi = useCompeteApi()
const authStore = useAuthStore()
const message = useMessage()

// ─── State ────────────────────────────────────────────────────────────────────
const loading = ref(true)
const actionLoading = ref(false)
const submitLoading = ref(false)
const roomInfo = ref<any>(null)
const players = ref<any[]>([])
const submitters = ref<any[]>([])
const myGamers = ref<any[]>([])
const selectedGamerId = ref<number | null>(null)

let pollingTimer: ReturnType<typeof setInterval> | null = null

// ─── Computed ─────────────────────────────────────────────────────────────────
const isOwner = computed(() => {
  if (!authStore.user || !roomInfo.value?.owner) return false
  return authStore.user.id === roomInfo.value.owner.id
})

const showCountdownWarning = computed(() => {
  if (!roomInfo.value?.createdAt) return false
  const created = new Date(roomInfo.value.createdAt).getTime()
  return created + 600000 - Date.now() < 180000
})

const myGamerOptions = computed(() =>
  myGamers.value.map(g => ({
    label: `${g.name} (${g.language || 'unknown'})`,
    value: g.id,
  })),
)

// ─── Columns ──────────────────────────────────────────────────────────────────
const playerColumns: DataTableColumns<any> = [
  {
    title: '位置',
    key: 'slot',
    width: 80,
    render(_row, index) {
      return h('span', `P${index + 1}`)
    },
  },
  {
    title: '玩家',
    key: 'user',
    render(row) {
      return h('span', row.user?.username || row.userId || '-')
    },
  },
  {
    title: 'Bot',
    key: 'gamer',
    render(row) {
      return h('span', row.gamer?.name || row.gamerId || '-')
    },
  },
]

const submitterColumns: DataTableColumns<any> = [
  {
    title: 'Bot 名称',
    key: 'name',
    render(row) {
      return h('span', row.gamer?.name || row.name || `Bot#${row.gamerId}`)
    },
  },
  {
    title: '玩家',
    key: 'user',
    render(row) {
      return h('span', row.user?.username || row.userId || '-')
    },
  },
  {
    title: '语言',
    key: 'language',
    width: 100,
    render(row) {
      return h(NTag, { size: 'small', bordered: false }, { default: () => row.gamer?.language || row.language || '-' })
    },
  },
  {
    title: '提交时间',
    key: 'createdAt',
    width: 160,
    render(row) {
      if (!row.createdAt) return h('span', '-')
      return h('span', new Date(row.createdAt).toLocaleString('zh-CN'))
    },
  },
]

// ─── Methods ──────────────────────────────────────────────────────────────────
function formatTime(t: string | undefined) {
  if (!t) return '-'
  return new Date(t).toLocaleString('zh-CN')
}

async function fetchRoom() {
  try {
    const res = await competeApi.getRoom(roomId.value)
    const data = res.data

    // 若对局已开始，跳转到对局详情
    if (data.matchId) {
      navigateTo(`/compete/matches/${data.matchId}`)
      return
    }

    if (data.info || data.id) {
      const info = data.info || data
      roomInfo.value = info
      if (Array.isArray(data.players)) players.value = data.players
      else if (Array.isArray(info.players)) players.value = info.players

      // submitters 可能是对象映射或数组
      if (data.submitters) {
        if (Array.isArray(data.submitters)) {
          submitters.value = data.submitters
        }
        else {
          submitters.value = Object.values(data.submitters).map((s: any) =>
            typeof s === 'string' ? JSON.parse(s) : s,
          )
        }
      }
    }
  }
  catch (e) {
    console.error(e)
  }
}

async function fetchMyGamers() {
  if (!authStore.isLoggedIn || !roomInfo.value?.game?.id) return
  try {
    const res = await competeApi.listGamers({ gameId: roomInfo.value.game.id, page: 1, perPage: 100 })
    const all: any[] = res.data.items || []
    myGamers.value = all.filter((g: any) => g.userId === authStore.user?.id)
  }
  catch (e) {
    console.error(e)
  }
}

async function handleOpenRoom() {
  actionLoading.value = true
  try {
    await competeApi.openRoom(roomId.value)
    if (roomInfo.value) roomInfo.value.open = true
    message.success('房间已开放')
  }
  catch (e: any) {
    message.error(e?.response?.data?.message || '操作失败')
  }
  finally {
    actionLoading.value = false
  }
}

async function handleCloseRoom() {
  actionLoading.value = true
  try {
    await competeApi.closeRoom(roomId.value)
    if (roomInfo.value) roomInfo.value.open = false
    message.success('房间已关闭')
  }
  catch (e: any) {
    message.error(e?.response?.data?.message || '操作失败')
  }
  finally {
    actionLoading.value = false
  }
}

async function handleStartRoom() {
  actionLoading.value = true
  try {
    const res = await competeApi.startRoom(roomId.value)
    message.success('对局已开始！')
    if (res.data?.id) {
      navigateTo(`/compete/matches/${res.data.id}`)
    }
  }
  catch (e: any) {
    message.error(e?.response?.data?.message || '开始对局失败')
  }
  finally {
    actionLoading.value = false
  }
}

async function handleSubmitGamer() {
  if (!selectedGamerId.value) return
  submitLoading.value = true
  try {
    await competeApi.submitGamerToRoom(roomId.value, selectedGamerId.value)
    message.success('Bot 提交成功！')
    await fetchRoom()
  }
  catch (e: any) {
    message.error(e?.response?.data?.message || '提交失败')
  }
  finally {
    submitLoading.value = false
  }
}

// ─── Polling ──────────────────────────────────────────────────────────────────
function startPolling() {
  pollingTimer = setInterval(async () => {
    await fetchRoom()
  }, 5000)
}

function stopPolling() {
  if (pollingTimer) {
    clearInterval(pollingTimer)
    pollingTimer = null
  }
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────
onMounted(async () => {
  try {
    await fetchRoom()
    if (roomInfo.value) {
      await fetchMyGamers()
      startPolling()
    }
  }
  finally {
    loading.value = false
  }
})

onBeforeUnmount(() => {
  stopPolling()
})

useHead({ title: '对战房间 — Leverage OJ' })
</script>

<style scoped>
.room-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.empty-tip {
  padding: 8px 0;
  text-align: center;
}

.gamer-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.gamer-name {
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
