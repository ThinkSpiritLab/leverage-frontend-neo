<template>
  <div class="messages-page">
    <div class="page-header">
      <NH2>收件箱</NH2>
      <NSpace>
        <NButton
          size="small"
          :loading="markingAllRead"
          :disabled="!hasUnread"
          @click="handleMarkAllRead"
        >
          全部标记已读
        </NButton>
        <NButton type="primary" size="small" @click="showContactModal = true">
          联系管理员
        </NButton>
      </NSpace>
    </div>

    <NSpin :show="loading">
      <div v-if="!loading && messages.length === 0" class="empty-state">
        <NEmpty description="暂无消息" />
      </div>

      <div v-else class="message-list">
        <NCard
          v-for="msg in messages"
          :key="msg.id"
          :class="['message-item', { unread: !msg.read }]"
          size="small"
          hoverable
          style="cursor: pointer"
          @click="navigateTo(`/messages/${msg.id}`)"
        >
          <div class="message-header">
            <div class="message-title">
              <NBadge v-if="!msg.read" dot type="error" />
              <NIcon v-else size="14" style="color: #bbb"><MailOutline /></NIcon>
              <span :style="{ fontWeight: msg.read ? 'normal' : 'bold', marginLeft: '6px' }">
                {{ msgPreview(msg.content) }}
              </span>
            </div>
            <div class="message-meta">
              <span class="message-sender">
                来自：{{ msg.sender?.username ?? '系统' }}
              </span>
              <span class="message-time">{{ formatDate(msg.createdAt) }}</span>
              <NTag v-if="msg.closed" size="small" type="default">已关闭</NTag>
            </div>
          </div>
        </NCard>
      </div>
    </NSpin>

    <!-- 分页 -->
    <div v-if="total > pageSize" class="pagination">
      <NPagination
        v-model:page="page"
        :page-count="Math.ceil(total / pageSize)"
        @update:page="fetchMessages"
      />
    </div>

    <!-- 联系管理员弹窗 -->
    <NModal v-model:show="showContactModal" title="联系管理员" preset="card" style="max-width: 500px">
      <NForm :model="contactForm" label-placement="top">
        <NFormItem label="标题" path="title">
          <NInput
            v-model:value="contactForm.title"
            placeholder="请输入标题"
            maxlength="100"
            show-count
          />
        </NFormItem>
        <NFormItem label="内容" path="content">
          <NInput
            v-model:value="contactForm.content"
            type="textarea"
            placeholder="请输入消息内容"
            :rows="5"
            maxlength="2000"
            show-count
          />
        </NFormItem>
      </NForm>
      <template #footer>
        <div style="display: flex; justify-content: flex-end; gap: 8px">
          <NButton @click="showContactModal = false">取消</NButton>
          <NButton
            type="primary"
            :loading="sending"
            :disabled="!contactForm.title.trim() || !contactForm.content.trim()"
            @click="handleContactAdmin"
          >
            发送
          </NButton>
        </div>
      </template>
    </NModal>
  </div>
</template>

<script setup lang="ts">
import { useMessage } from 'naive-ui'
import { MailOutline } from '@vicons/ionicons5'
import dayjs from 'dayjs'
import type { Message } from '~/composables/api/messages'

definePageMeta({
  layout: 'default',
  middleware: 'auth',
})

const msgApi = useMessageApi()
const notificationsApi = useNotificationsApi()
const uiMsg = useMessage()

const messages = ref<Message[]>([])
const loading = ref(false)
const markingAllRead = ref(false)
const page = ref(1)
const pageSize = 20
const total = ref(0)

const showContactModal = ref(false)
const sending = ref(false)
const contactForm = reactive({ title: '', content: '' })

function formatDate(date: string) {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

function msgPreview(content: string) {
  return content.length > 60 ? content.slice(0, 60) + '…' : content
}

async function fetchMessages() {
  loading.value = true
  try {
    const res = await msgApi.getInbox({ page: page.value, perPage: pageSize })
    const data = (res as any).data ?? res
    messages.value = data.items ?? data
    total.value = data.total ?? 0
  }
  catch (e) {
    console.error(e)
    uiMsg.error('加载失败')
  }
  finally {
    loading.value = false
  }
}

const hasUnread = computed(() => messages.value.some(m => !m.read))

async function handleMarkAllRead() {
  markingAllRead.value = true
  try {
    await notificationsApi.markAllRead()
    messages.value = messages.value.map(m => ({ ...m, read: true }))
    uiMsg.success('已全部标记为已读')
  }
  catch {
    uiMsg.error('操作失败')
  }
  finally {
    markingAllRead.value = false
  }
}

async function handleContactAdmin() {
  if (sending.value) return
  if (!contactForm.title.trim() || !contactForm.content.trim()) return
  sending.value = true
  try {
    await msgApi.contactAdmin(contactForm.title, contactForm.content)
    uiMsg.success('消息已发送')
    showContactModal.value = false
    contactForm.title = ''
    contactForm.content = ''
    fetchMessages()
  }
  catch {
    uiMsg.error('发送失败，请重试')
  }
  finally {
    sending.value = false
  }
}

onMounted(fetchMessages)

useHead({ title: '收件箱 — Leverage OJ' })
</script>

<style scoped>
.messages-page {
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

.message-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.message-item {
  border-left: 3px solid transparent;
  transition: border-color 0.2s;
}

.message-item.unread {
  border-left-color: #2080f0;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.message-title {
  display: flex;
  align-items: center;
  font-size: 14px;
  flex: 1;
  min-width: 0;
}

.message-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.message-sender {
  font-size: 12px;
  color: #666;
}

.message-time {
  font-size: 12px;
  color: #999;
}

.empty-state {
  padding: 48px 0;
}

.pagination {
  display: flex;
  justify-content: center;
}
</style>
