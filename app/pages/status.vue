<template>
  <div class="status-page">
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px">
      <NH2 style="margin: 0">系统状态</NH2>
      <NText depth="3">最后更新: {{ lastUpdatedText }}</NText>
    </div>

    <NGrid :x-gap="16" :y-gap="16" :cols="4" responsive="screen" item-responsive>
      <NGridItem v-for="svc in services" :key="svc.key" span="4 s:2 m:1">
        <NCard size="small">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px">
            <div class="status-dot" :class="svc.status" />
            <NText strong>{{ svc.label }}</NText>
            <NTag size="small" :type="statusTagType(svc.status)" round>
              {{ statusLabel(svc.status) }}
            </NTag>
          </div>
          <NText v-if="svc.message" depth="3" style="display: block; margin-bottom: 8px; font-size: 13px">
            {{ svc.message }}
          </NText>
          <div v-if="svc.pings.length" class="ping-stats">
            <NText depth="3" style="font-size: 12px">
              延迟: {{ svc.latestPing }}ms (min {{ svc.minPing }} / avg {{ svc.avgPing }} / max {{ svc.maxPing }})
            </NText>
          </div>
        </NCard>
      </NGridItem>
    </NGrid>

    <NCard size="small" style="margin-top: 16px" title="平台统计">
      <NText v-if="recentMatchCount !== null">
        已完成对战总数: <NText strong>{{ recentMatchCount }}</NText>
      </NText>
      <NText v-else depth="3">加载中...</NText>
    </NCard>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const api = useApi()
const competeApi = useCompeteApi()

interface ServiceInfo {
  key: string
  label: string
  status: 'up' | 'degraded' | 'down'
  message: string
  pings: number[]
  latestPing: number
  minPing: number
  maxPing: number
  avgPing: number
}

const lastUpdated = ref<Date | null>(null)
const recentMatchCount = ref<number | null>(null)

const services = ref<ServiceInfo[]>([
  { key: 'api', label: 'API Server', status: 'down', message: '', pings: [], latestPing: 0, minPing: 0, maxPing: 0, avgPing: 0 },
  { key: 'database', label: 'Database', status: 'down', message: '', pings: [], latestPing: 0, minPing: 0, maxPing: 0, avgPing: 0 },
  { key: 'redis', label: 'Redis', status: 'down', message: '', pings: [], latestPing: 0, minPing: 0, maxPing: 0, avgPing: 0 },
  { key: 'memory', label: 'Memory', status: 'down', message: '', pings: [], latestPing: 0, minPing: 0, maxPing: 0, avgPing: 0 },
])

const lastUpdatedText = computed(() => {
  if (!lastUpdated.value) return '从未'
  return lastUpdated.value.toLocaleTimeString('zh-CN')
})

function statusTagType(status: string) {
  if (status === 'up') return 'success'
  if (status === 'degraded') return 'warning'
  return 'error'
}

function statusLabel(status: string) {
  if (status === 'up') return '正常'
  if (status === 'degraded') return '异常'
  return '离线'
}

function pushPing(svc: ServiceInfo, ping: number) {
  svc.pings.push(ping)
  if (svc.pings.length > 20) svc.pings.shift()
  svc.latestPing = ping
  svc.minPing = Math.min(...svc.pings)
  svc.maxPing = Math.max(...svc.pings)
  svc.avgPing = Math.round(svc.pings.reduce((a, b) => a + b, 0) / svc.pings.length)
}

function findService(key: string) {
  return services.value.find(s => s.key === key)!
}

async function pollHealth() {
  const start = performance.now()
  try {
    const res = await api.get<{
      status: string
      info: Record<string, { status: string; message?: string }>
    }>('/health')
    const elapsed = Math.round(performance.now() - start)
    const data = res.data

    // API server is up if we got a response
    const apiSvc = findService('api')
    apiSvc.status = data.status === 'ok' ? 'up' : 'degraded'
    pushPing(apiSvc, elapsed)

    // Individual services
    const infoMap: Record<string, string> = {
      database: 'database',
      redis: 'redis',
      memory_heap: 'memory',
    }
    for (const [infoKey, svcKey] of Object.entries(infoMap)) {
      const svc = findService(svcKey)
      const info = data.info?.[infoKey]
      if (info) {
        svc.status = info.status === 'up' ? 'up' : 'degraded'
        svc.message = info.message || ''
        pushPing(svc, elapsed)
      }
      else {
        svc.status = 'down'
      }
    }
  }
  catch {
    // All services down
    for (const svc of services.value) {
      svc.status = 'down'
    }
  }
  lastUpdated.value = new Date()
}

async function fetchMatchCount() {
  try {
    const res = await competeApi.listMatches({ perPage: 1, status: 2 })
    recentMatchCount.value = (res as any).data?.total ?? 0
  }
  catch {
    recentMatchCount.value = null
  }
}

let timer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  pollHealth()
  fetchMatchCount()
  timer = setInterval(() => {
    pollHealth()
    fetchMatchCount()
  }, 10000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.status-page {
  max-width: 960px;
  margin: 0 auto;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-dot.up {
  background: #18a058;
  box-shadow: 0 0 6px rgba(24, 160, 88, 0.5);
}

.status-dot.degraded {
  background: #f0a020;
  box-shadow: 0 0 6px rgba(240, 160, 32, 0.5);
}

.status-dot.down {
  background: #d03050;
  box-shadow: 0 0 6px rgba(208, 48, 80, 0.5);
}

.ping-stats {
  padding-top: 4px;
  border-top: 1px solid #f0f0f0;
}
</style>
