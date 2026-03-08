<template>
  <div class="home-page">
    <NCard class="welcome-banner" :bordered="false">
      <div class="banner-content">
        <div class="banner-copy">
          <NH1 style="margin: 0 0 8px">欢迎来到 Leverage OJ</NH1>
          <p class="banner-subtitle">在线评测平台 · 挑战自我 · 精进算法</p>
          <NSpace>
            <NButton type="primary" size="large" @click="navigateTo('/problems')">
              开始刷题
            </NButton>
            <NButton size="large" ghost @click="navigateTo('/ranklist')">
              查看排行榜
            </NButton>
          </NSpace>
        </div>
      </div>
    </NCard>

    <div class="stats-row">
      <NCard class="stat-card stat-blue" :bordered="false">
        <NStatistic label="总题目数" :value="stats?.problem ?? '-'" />
      </NCard>
      <NCard class="stat-card stat-green" :bordered="false">
        <NStatistic label="注册用户" :value="stats?.user ?? '-'" />
      </NCard>
      <NCard class="stat-card stat-orange" :bordered="false">
        <NStatistic label="总提交数" :value="stats?.submission ?? '-'" />
      </NCard>
      <NCard class="stat-card stat-purple" :bordered="false">
        <NStatistic label="竞赛数" :value="stats?.contest ?? '-'" />
      </NCard>
    </div>

    <div class="main-content">
      <NCard title="快速入口" class="quick-links" :bordered="false">
        <div class="link-grid">
          <NButton class="quick-btn quick-blue" block @click="navigateTo('/problems')">📝 题目列表</NButton>
          <NButton class="quick-btn quick-green" block @click="navigateTo('/submissions')">📋 提交记录</NButton>
          <NButton class="quick-btn quick-orange" block @click="navigateTo('/contests')">🏅 竞赛列表</NButton>
          <NButton class="quick-btn quick-purple" block @click="navigateTo('/ranklist')">🏆 排行榜</NButton>
        </div>
      </NCard>

      <NCard title="最新公告" class="announcements" :bordered="false">
        <NSpin :show="notifLoading">
          <div v-if="!notifLoading && notifications.length === 0">
            <NEmpty description="暂无公告" />
          </div>
          <div v-else class="notif-list">
            <div
              v-for="n in notifications"
              :key="n.id"
              class="notif-item"
              @click="navigateTo('/notification')"
            >
              <div class="notif-title">{{ n.title }}</div>
              <div class="notif-time">{{ formatDate(n.createdAt) }}</div>
            </div>
          </div>
        </NSpin>
        <template #action>
          <NButton text type="primary" size="small" @click="navigateTo('/notification')">
            查看全部
          </NButton>
        </template>
      </NCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { StatResult } from '~/composables/api/statistics'
import type { Notification } from '~/composables/api/notifications'
import dayjs from 'dayjs'

definePageMeta({
  layout: 'default',
})

const statisticsApi = useStatisticsApi()
const notificationsApi = useNotificationsApi()

const stats = ref<StatResult | null>(null)
const notifications = ref<Notification[]>([])
const notifLoading = ref(false)

function formatDate(date: string) {
  return dayjs(date).format('MM-DD HH:mm')
}

onMounted(async () => {
  try {
    const res = await statisticsApi.get()
    stats.value = res.data
  }
  catch {
    // 静默失败
  }

  notifLoading.value = true
  try {
    const res = await notificationsApi.list({ page: 1, perPage: 5 })
    notifications.value = res.data.items ?? []
  }
  catch {
    notifications.value = []
  }
  finally {
    notifLoading.value = false
  }
})

useHead({ title: '首页 — Leverage OJ' })
</script>

<style scoped>
.home-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.welcome-banner {
  position: relative;
  overflow: hidden;
  border-radius: 16px;
  color: #fff;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
}

.welcome-banner::before,
.welcome-banner::after {
  content: '';
  position: absolute;
  border-radius: 999px;
  pointer-events: none;
}

.welcome-banner::before {
  width: 220px;
  height: 220px;
  background: rgba(255, 255, 255, 0.13);
  top: -90px;
  right: -40px;
}

.welcome-banner::after {
  width: 180px;
  height: 180px;
  background: rgba(255, 255, 255, 0.1);
  bottom: -90px;
  left: 40%;
}

.banner-content {
  position: relative;
  z-index: 1;
  padding: 14px 6px;
}

.banner-copy {
  max-width: 620px;
}

.banner-subtitle {
  color: rgba(255, 255, 255, 0.85);
  margin: 0 0 22px;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-card {
  border-radius: 12px;
  color: #fff;
}

.stat-card :deep(.n-statistic .n-statistic-value) {
  color: #fff;
  font-size: 34px;
  font-weight: 700;
}

.stat-card :deep(.n-statistic .n-statistic-label) {
  color: #fff;
  font-weight: 600;
  font-size: 13px;
  letter-spacing: 0.3px;
}

.stat-blue {
  background: linear-gradient(135deg, #3b82f6, #60a5fa);
}

.stat-green {
  background: linear-gradient(135deg, #10b981, #34d399);
}

.stat-orange {
  background: linear-gradient(135deg, #f59e0b, #fb923c);
}

.stat-purple {
  background: linear-gradient(135deg, #8b5cf6, #a78bfa);
}

.main-content {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 20px;
}

.quick-links {
  height: fit-content;
  border-radius: 12px;
}

.link-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.quick-btn {
  height: 44px;
  border-radius: 10px;
  color: #fff;
  border: none;
  transition: transform 0.2s ease, filter 0.2s ease;
}

.quick-btn:hover {
  transform: translateY(-2px);
  filter: brightness(1.04);
}

.quick-blue {
  background: linear-gradient(135deg, #2563eb, #3b82f6);
}

.quick-green {
  background: linear-gradient(135deg, #059669, #10b981);
}

.quick-orange {
  background: linear-gradient(135deg, #ea580c, #f59e0b);
}

.quick-purple {
  background: linear-gradient(135deg, #7c3aed, #8b5cf6);
}

.announcements {
  border-radius: 12px;
}

.notif-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.notif-item {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border-radius: 8px;
  background: #fafcff;
  cursor: pointer;
  transition: background 0.2s;
}

.notif-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 8px;
  bottom: 8px;
  width: 3px;
  border-radius: 4px;
  background: linear-gradient(180deg, #3b82f6 0%, #8b5cf6 100%);
}

.notif-item:hover {
  background: #f2f7ff;
}

.notif-item:hover .notif-title {
  color: #2563eb;
}

.notif-title {
  padding-left: 8px;
  font-size: 14px;
}

.notif-time {
  font-size: 12px;
  color: #94a3b8;
  white-space: nowrap;
  margin-left: 12px;
}

@media (max-width: 1100px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }

  .main-content {
    grid-template-columns: 1fr;
  }
}
</style>
