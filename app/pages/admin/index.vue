<template>
  <div class="admin-dashboard">
    <!-- 页头 -->
    <div class="dashboard-header">
      <NH2 style="margin: 0">管理后台</NH2>
      <NText depth="3">欢迎回来，{{ authStore.user?.username }}！</NText>
    </div>

    <!-- 统计数字 -->
    <NGrid :cols="5" :x-gap="16" :y-gap="16" responsive="screen" :item-responsive="true">
      <NGridItem span="1 m:1 s:1" style="min-width: 0">
        <NCard class="stat-card">
          <NStatistic label="👥 用户" :value="stat?.user ?? 0" :loading="statLoading">
            <template #suffix>
              <NButton text size="tiny" tag="a" href="/admin/users" style="color: #2080f0; font-size: 12px; margin-left: 6px">
                查看 →
              </NButton>
            </template>
          </NStatistic>
        </NCard>
      </NGridItem>
      <NGridItem span="1 m:1 s:1" style="min-width: 0">
        <NCard class="stat-card">
          <NStatistic label="📝 题目" :value="stat?.problem ?? 0" :loading="statLoading">
            <template #suffix>
              <NButton text size="tiny" tag="a" href="/admin/problems" style="color: #18a058; font-size: 12px; margin-left: 6px">
                查看 →
              </NButton>
            </template>
          </NStatistic>
        </NCard>
      </NGridItem>
      <NGridItem span="1 m:1 s:1" style="min-width: 0">
        <NCard class="stat-card">
          <NStatistic label="🚀 提交" :value="stat?.submission ?? 0" :loading="statLoading" />
        </NCard>
      </NGridItem>
      <NGridItem span="1 m:1 s:1" style="min-width: 0">
        <NCard class="stat-card">
          <NStatistic label="🏆 竞赛" :value="stat?.contest ?? 0" :loading="statLoading">
            <template #suffix>
              <NButton text size="tiny" tag="a" href="/admin/contests" style="color: #f0a020; font-size: 12px; margin-left: 6px">
                查看 →
              </NButton>
            </template>
          </NStatistic>
        </NCard>
      </NGridItem>
      <NGridItem span="1 m:1 s:1" style="min-width: 0">
        <NCard class="stat-card">
          <NStatistic label="📚 课程" :value="stat?.course ?? 0" :loading="statLoading">
            <template #suffix>
              <NButton text size="tiny" tag="a" href="/admin/courses" style="color: #8a2be2; font-size: 12px; margin-left: 6px">
                查看 →
              </NButton>
            </template>
          </NStatistic>
        </NCard>
      </NGridItem>
    </NGrid>

    <!-- 系统状态 -->
    <NCard class="section-card">
      <template #header>
        <div class="section-title">⚙️ 系统状态</div>
      </template>
      <NSpin :show="healthLoading">
        <NDescriptions :column="2" bordered>
          <NDescriptionsItem label="🗄️ 数据库">
            <NTag
              :type="dbStatus === 'up' ? 'success' : dbStatus === 'unknown' ? 'default' : 'error'"
              size="small"
            >
              {{ dbStatus === 'up' ? '✅ 正常' : dbStatus === 'unknown' ? '未知' : '❌ 异常' }}
            </NTag>
            <NText v-if="health?.info?.database?.message" depth="3" style="font-size: 12px; margin-left: 8px">
              {{ health.info.database.message }}
            </NText>
          </NDescriptionsItem>
          <NDescriptionsItem label="🔴 Redis">
            <NTag
              :type="redisStatus === 'up' ? 'success' : redisStatus === 'unknown' ? 'default' : 'error'"
              size="small"
            >
              {{ redisStatus === 'up' ? '✅ 正常' : redisStatus === 'unknown' ? '未知' : '❌ 异常' }}
            </NTag>
            <NText v-if="health?.info?.redis?.message" depth="3" style="font-size: 12px; margin-left: 8px">
              {{ health.info.redis.message }}
            </NText>
          </NDescriptionsItem>
          <NDescriptionsItem label="🧠 内存 (Heap)">
            <NTag
              :type="heapStatus === 'up' ? 'success' : heapStatus === 'unknown' ? 'default' : 'warning'"
              size="small"
            >
              {{ heapStatus === 'up' ? '✅ 正常' : heapStatus === 'unknown' ? '未知' : '⚠️ 偏高' }}
            </NTag>
            <NText v-if="health?.info?.memory_heap?.message" depth="3" style="font-size: 12px; margin-left: 8px">
              {{ health.info.memory_heap.message }}
            </NText>
          </NDescriptionsItem>
          <NDescriptionsItem label="🧠 内存 (RSS)">
            <NTag
              :type="rssStatus === 'up' ? 'success' : rssStatus === 'unknown' ? 'default' : 'warning'"
              size="small"
            >
              {{ rssStatus === 'up' ? '✅ 正常' : rssStatus === 'unknown' ? '未知' : '⚠️ 偏高' }}
            </NTag>
            <NText v-if="health?.info?.memory_rss?.message" depth="3" style="font-size: 12px; margin-left: 8px">
              {{ health.info.memory_rss.message }}
            </NText>
          </NDescriptionsItem>
        </NDescriptions>

        <!-- 评测队列 -->
        <div v-if="queues" class="queue-section">
          <NDivider style="margin: 16px 0" />
          <div class="queue-title">
            <NText strong>⚡ 评测队列</NText>
            <NText depth="3" style="font-size: 12px">{{ queues.queue }}</NText>
          </div>
          <NSpace style="margin-top: 8px">
            <NTag type="default" size="small">等待 {{ queues.waiting ?? 0 }}</NTag>
            <NTag type="info" size="small">活跃 {{ queues.active ?? 0 }}</NTag>
            <NTag type="success" size="small">完成 {{ queues.completed ?? 0 }}</NTag>
            <NTag type="error" size="small">失败 {{ queues.failed ?? 0 }}</NTag>
            <NTag type="warning" size="small" v-if="(queues.delayed ?? 0) > 0">延迟 {{ queues.delayed }}</NTag>
          </NSpace>
        </div>
        <div v-else-if="queuesLoading" class="queue-section">
          <NDivider style="margin: 16px 0" />
          <NText depth="3">正在加载队列信息…</NText>
        </div>
      </NSpin>
      <template #footer>
        <NText depth="3" style="font-size: 12px">
          最后更新：{{ healthUpdatedAt || '—' }}
          <NButton text size="tiny" style="margin-left: 8px" @click="fetchHealth">🔄 刷新</NButton>
        </NText>
      </template>
    </NCard>

    <!-- 最新公告 -->
    <NCard class="section-card">
      <template #header>
        <div class="section-header">
          <div class="section-title">📢 最新公告</div>
          <NButton size="small" @click="navigateTo('/admin/notifications')">查看全部 →</NButton>
        </div>
      </template>
      <NSpin :show="notifLoading">
        <NEmpty v-if="!notifLoading && notifications.length === 0" description="暂无公告" />
        <NList v-else bordered>
          <NListItem v-for="n in notifications" :key="n.id">
            <div class="notif-item">
              <div class="notif-meta">
                <NText strong>{{ n.title }}</NText>
                <NText depth="3" style="font-size: 12px">
                  {{ n.targetUserId ? `→ 用户 #${n.targetUserId}` : '全体用户' }}
                  ·
                  {{ formatTime(n.createdAt) }}
                </NText>
              </div>
              <NText depth="2" class="notif-content">{{ n.content }}</NText>
            </div>
          </NListItem>
        </NList>
      </NSpin>
    </NCard>
  </div>
</template>

<script setup lang="ts">
import type { HealthStatus, QueueHealth } from '~/composables/api/health'
import type { StatResult } from '~/composables/api/statistics'
import type { Notification } from '~/composables/api/notifications'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const authStore = useAuthStore()
const statisticsApi = useStatisticsApi()
const healthApi = useHealthApi()
const notificationsApi = useNotificationsApi()

// ── 统计数字 ─────────────────────────────────────────────────────────────────
const stat = ref<StatResult | null>(null)
const statLoading = ref(false)

async function fetchStat() {
  statLoading.value = true
  try {
    const res = await statisticsApi.getStat()
    stat.value = res.data
  }
  catch (e) {
    console.error('stat error', e)
  }
  finally {
    statLoading.value = false
  }
}

// ── 系统健康 ─────────────────────────────────────────────────────────────────
const health = ref<HealthStatus | null>(null)
const healthLoading = ref(false)
const queues = ref<QueueHealth | null>(null)
const queuesLoading = ref(false)
const healthUpdatedAt = ref('')

const dbStatus = computed(() => health.value?.info?.database?.status ?? 'unknown')
const redisStatus = computed(() => health.value?.info?.redis?.status ?? 'unknown')
const heapStatus = computed(() => health.value?.info?.memory_heap?.status ?? 'unknown')
const rssStatus = computed(() => health.value?.info?.memory_rss?.status ?? 'unknown')

async function fetchHealth() {
  healthLoading.value = true
  queuesLoading.value = true
  try {
    const [hRes, qRes] = await Promise.allSettled([
      healthApi.get(),
      healthApi.getQueues(),
    ])

    if (hRes.status === 'fulfilled') {
      health.value = hRes.value.data
    }
    else {
      // 503 ServiceUnavailableException — body is in error response
      const errData = (hRes.reason as any)?.response?.data
      if (errData?.info) {
        health.value = errData as HealthStatus
      }
    }

    if (qRes.status === 'fulfilled') {
      queues.value = qRes.value.data
    }

    healthUpdatedAt.value = new Date().toLocaleTimeString('zh-CN')
  }
  catch (e) {
    console.error('health error', e)
  }
  finally {
    healthLoading.value = false
    queuesLoading.value = false
  }
}

// ── 最新公告 ─────────────────────────────────────────────────────────────────
const notifications = ref<Notification[]>([])
const notifLoading = ref(false)

async function fetchNotifications() {
  notifLoading.value = true
  try {
    const res = await notificationsApi.list({ page: 1, perPage: 3 })
    notifications.value = res.data.items
  }
  catch (e) {
    console.error('notifications error', e)
  }
  finally {
    notifLoading.value = false
  }
}

function formatTime(ts: string) {
  if (!ts) return '—'
  return new Date(ts).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ── 初始化 ───────────────────────────────────────────────────────────────────
onMounted(() => {
  fetchStat()
  fetchHealth()
  fetchNotifications()
})
</script>

<style scoped>
.admin-dashboard {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.dashboard-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 4px;
}

.stat-card {
  height: 100%;
}

.section-card {
  width: 100%;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.queue-section {
  margin-top: 0;
}

.queue-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.notif-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
}

.notif-meta {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.notif-content {
  font-size: 13px;
  line-height: 1.5;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
