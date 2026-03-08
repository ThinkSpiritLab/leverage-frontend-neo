<template>
  <div class="home-page">
    <!-- 欢迎横幅 -->
    <NCard class="welcome-banner">
      <div class="banner-content">
        <div>
          <NH1 style="margin: 0 0 8px">欢迎来到 LevOJ</NH1>
          <p style="color: #666; margin: 0 0 20px">在线评测平台 · 挑战自我 · 精进算法</p>
          <NSpace>
            <NButton type="primary" size="large" @click="navigateTo('/problems')">
              开始刷题
            </NButton>
            <NButton size="large" @click="navigateTo('/ranklist')">
              查看排行榜
            </NButton>
          </NSpace>
        </div>
      </div>
    </NCard>

    <!-- 平台统计 -->
    <div class="stats-row">
      <NCard class="stat-card">
        <NStatistic label="总题目数" :value="stats?.problem ?? '-'">
          <template #prefix>📚</template>
        </NStatistic>
      </NCard>
      <NCard class="stat-card">
        <NStatistic label="注册用户" :value="stats?.user ?? '-'">
          <template #prefix>👤</template>
        </NStatistic>
      </NCard>
      <NCard class="stat-card">
        <NStatistic label="总提交数" :value="stats?.submission ?? '-'">
          <template #prefix>📤</template>
        </NStatistic>
      </NCard>
      <NCard class="stat-card">
        <NStatistic label="竞赛数" :value="stats?.contest ?? '-'">
          <template #prefix>✅</template>
        </NStatistic>
      </NCard>
    </div>

    <div class="main-content">
      <!-- 快速入口 -->
      <NCard title="快速入口" class="quick-links">
        <div class="link-grid">
          <NButton block @click="navigateTo('/problems')">📝 题目列表</NButton>
          <NButton block @click="navigateTo('/submissions')">📋 提交记录</NButton>
          <NButton block @click="navigateTo('/contests')">🏅 竞赛列表</NButton>
          <NButton block @click="navigateTo('/ranklist')">🏆 排行榜</NButton>
        </div>
      </NCard>

      <!-- 公告/通知 -->
      <NCard title="最新公告" class="announcements">
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
  // 加载统计数据
  try {
    const res = await statisticsApi.get()
    stats.value = res.data
  }
  catch {
    // 静默失败
  }

  // 加载通知
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
  background: linear-gradient(135deg, #e8f4fd 0%, #f0f9ff 100%);
}

.banner-content {
  padding: 12px 0;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-card {
  text-align: center;
}

.main-content {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 20px;
}

.quick-links {
  height: fit-content;
}

.link-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.notif-list {
  display: flex;
  flex-direction: column;
}

.notif-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: color 0.2s;
}

.notif-item:last-child {
  border-bottom: none;
}

.notif-item:hover .notif-title {
  color: #2080f0;
}

.notif-title {
  font-size: 14px;
}

.notif-time {
  font-size: 12px;
  color: #999;
  white-space: nowrap;
  margin-left: 12px;
}
</style>
