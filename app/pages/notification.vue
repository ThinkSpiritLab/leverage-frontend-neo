<template>
  <div class="notification-page">
    <div class="page-header">
      <NH2>通知</NH2>
      <NButton
        v-if="notifications.length > 0"
        size="small"
        :loading="markingAll"
        @click="handleMarkAllRead"
      >
        全部标为已读
      </NButton>
    </div>

    <NSpin :show="loading">
      <div v-if="!loading && notifications.length === 0" class="empty-state">
        <NEmpty description="暂无通知" />
      </div>

      <div v-else class="notification-list">
        <NCard
          v-for="n in notifications"
          :key="n.id"
          :class="['notification-item', { unread: !n.read }]"
          size="small"
        >
          <div class="notification-header">
            <div class="notification-title">
              <NBadge v-if="!n.read" dot type="error" />
              <span :style="{ fontWeight: n.read ? 'normal' : 'bold' }">{{ n.title }}</span>
            </div>
            <div class="notification-actions">
              <span class="notification-time">{{ formatDate(n.createdAt) }}</span>
              <NButton
                v-if="!n.read"
                text
                size="small"
                type="primary"
                @click="handleMarkRead(n)"
              >
                标为已读
              </NButton>
            </div>
          </div>
          <p class="notification-content">{{ n.content }}</p>
        </NCard>
      </div>
    </NSpin>

    <!-- 分页 -->
    <div v-if="total > pageSize" class="pagination">
      <NPagination
        v-model:page="page"
        :page-count="Math.ceil(total / pageSize)"
        @update:page="fetchNotifications"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMessage } from 'naive-ui'
import type { Notification } from '~/composables/api/notifications'
import dayjs from 'dayjs'

definePageMeta({
  layout: 'default',
  middleware: 'auth',
})

const notificationsApi = useNotificationsApi()
const message = useMessage()

const notifications = ref<Notification[]>([])
const loading = ref(false)
const markingAll = ref(false)
const page = ref(1)
const pageSize = 20
const total = ref(0)

function formatDate(date: string) {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

async function fetchNotifications() {
  loading.value = true
  try {
    const res = await notificationsApi.list({ page: page.value, perPage: pageSize })
    const data = res.data ?? res
    notifications.value = data.items ?? data
    total.value = data.total ?? 0
  }
  catch (e) {
    console.error(e)
  }
  finally {
    loading.value = false
  }
}

async function handleMarkRead(n: Notification) {
  try {
    await notificationsApi.markRead(n.id)
    n.read = true
    message.success('已标为已读')
  }
  catch {
    message.error('操作失败')
  }
}

async function handleMarkAllRead() {
  markingAll.value = true
  try {
    await notificationsApi.markAllRead()
    notifications.value.forEach(n => (n.read = true))
    message.success('全部已读')
  }
  catch {
    message.error('操作失败')
  }
  finally {
    markingAll.value = false
  }
}

onMounted(fetchNotifications)
</script>

<style scoped>
.notification-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 800px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.notification-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.notification-item {
  border-left: 3px solid transparent;
  transition: border-color 0.2s;
}

.notification-item.unread {
  border-left-color: #2080f0;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.notification-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
}

.notification-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.notification-time {
  font-size: 12px;
  color: #999;
}

.notification-content {
  color: #444;
  font-size: 14px;
  margin: 0;
  white-space: pre-wrap;
}

.empty-state {
  padding: 48px 0;
}

.pagination {
  display: flex;
  justify-content: center;
}
</style>
