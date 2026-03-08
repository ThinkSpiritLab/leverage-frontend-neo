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
                {{ match.status || '-' }}
              </NTag>
            </NDescriptionsItem>
            <NDescriptionsItem label="胜者">
              <span v-if="winnerName" style="font-weight: 600; color: #18a058">
                🏆 {{ winnerName }}
              </span>
              <span v-else>-</span>
            </NDescriptionsItem>
            <NDescriptionsItem label="创建时间">
              {{ match.createdAt ? new Date(match.createdAt).toLocaleString('zh-CN') : '-' }}
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

        <!-- 回放数据 -->
        <NCard v-if="hasPlayback" title="对局回放">
          <NCode :code="playbackText" language="json" word-wrap />
        </NCard>

        <!-- 错误信息 -->
        <NCard v-if="match.error" title="错误信息">
          <NAlert type="error">
            <pre style="white-space: pre-wrap; margin: 0">{{ match.error }}</pre>
          </NAlert>
        </NCard>
      </template>

      <NEmpty v-else-if="!loading" description="对局不存在" />
    </NSpin>
  </div>
</template>

<script setup lang="ts">
import { h } from 'vue'
import { NTag } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'

definePageMeta({
  layout: 'default',
  middleware: 'auth',
})

const route = useRoute()
const matchId = computed(() => Number(route.params.id))
const competeApi = useCompeteApi()

const match = ref<any>(null)
const loading = ref(false)

async function fetchMatch() {
  loading.value = true
  try {
    const res = await competeApi.getMatch(matchId.value)
    match.value = res.data
  }
  catch (e) {
    console.error(e)
  }
  finally {
    loading.value = false
  }
}

onMounted(fetchMatch)

const statusType = computed((): 'default' | 'info' | 'success' | 'warning' | 'error' => {
  const statusMap: Record<string, 'default' | 'info' | 'success' | 'warning' | 'error'> = {
    pending: 'default',
    running: 'info',
    done: 'success',
    failed: 'error',
  }
  return statusMap[(match.value?.status || '').toLowerCase()] || 'default'
})

const winnerName = computed(() => {
  if (!match.value) return null
  return match.value.winner?.name || (match.value.winnerId ? `Bot#${match.value.winnerId}` : null)
})

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
    render(row) {
      const isWinner = match.value?.winner?.id === row.id || match.value?.winnerId === row.id
      return h('span', { style: isWinner ? 'font-weight:600;color:#18a058' : '' }, isWinner ? `🏆 ${row.name}` : row.name)
    },
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
    title: '得分',
    key: 'score',
    render(row) {
      return h('span', row.score !== undefined ? String(row.score) : '-')
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

// 回放数据处理
const hasPlayback = computed(() => {
  return !!(match.value?.playback || match.value?.replay || match.value?.log)
})

const playbackText = computed(() => {
  if (!match.value) return ''
  const raw = match.value.playback || match.value.replay || match.value.log
  if (!raw) return ''
  if (typeof raw === 'string') return raw
  try {
    return JSON.stringify(raw, null, 2)
  }
  catch {
    return String(raw)
  }
})
</script>

<style scoped>
.match-detail-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
