<template>
  <div class="message-detail-page">
    <div class="page-header">
      <NButton text @click="navigateTo('/messages')">
        <template #icon><NIcon><ArrowBackOutline /></NIcon></template>
        返回收件箱
      </NButton>
    </div>

    <NSpin :show="loading">
      <template v-if="!loading && session">
        <!-- 根消息 -->
        <NCard class="message-card root-message" size="medium">
          <div class="message-meta">
            <NIcon size="16"><MailOutline /></NIcon>
            <span class="sender-name">{{ session.sender?.username ?? '系统' }}</span>
            <NTag v-if="session.closed" size="small" type="default" style="margin-left: 8px">已关闭</NTag>
            <span class="message-time">{{ formatDate(session.createdAt) }}</span>
          </div>
          <NDivider />
          <p class="message-body">{{ session.content }}</p>
        </NCard>

        <!-- 回复列表 -->
        <div v-if="replies.length > 0" class="reply-list">
          <div class="reply-section-title">回复记录（{{ replies.length }}）</div>
          <NCard
            v-for="r in replies"
            :key="r.id"
            class="message-card reply-card"
            size="small"
          >
            <div class="message-meta">
              <NIcon size="14"><PersonOutline /></NIcon>
              <span class="sender-name">{{ r.sender?.username ?? '系统' }}</span>
              <span class="message-time">{{ formatDate(r.createdAt) }}</span>
            </div>
            <p class="message-body">{{ r.content }}</p>
          </NCard>
        </div>

        <!-- 回复框 -->
        <NCard v-if="!session.closed" class="reply-box" size="medium">
          <div class="reply-box-title">回复</div>
          <NInput
            v-model:value="replyContent"
            type="textarea"
            placeholder="输入回复内容..."
            :rows="4"
            maxlength="2000"
            show-count
            :disabled="sending"
          />
          <div class="reply-actions">
            <NButton
              type="primary"
              :loading="sending"
              :disabled="!replyContent.trim()"
              @click="handleReply"
            >
              发送回复
            </NButton>
          </div>
        </NCard>

        <NAlert v-else type="warning" title="会话已关闭" style="margin-top: 12px">
          此会话已关闭，无法继续回复。
        </NAlert>
      </template>

      <div v-if="!loading && !session" class="empty-state">
        <NEmpty description="消息不存在或已删除" />
      </div>
    </NSpin>
  </div>
</template>

<script setup lang="ts">
import { useMessage } from 'naive-ui'
import { ArrowBackOutline, MailOutline, PersonOutline } from '@vicons/ionicons5'
import dayjs from 'dayjs'
import type { Message } from '~/composables/api/messages'

definePageMeta({
  layout: 'default',
  middleware: 'auth',
})

const route = useRoute()
const msgApi = useMessageApi()
const uiMsg = useMessage()

const id = computed(() => Number(route.params.id))

const loading = ref(false)
const allMessages = ref<Message[]>([])
const replyContent = ref('')
const sending = ref(false)

// 根消息是返回数组中 sessionId === null 的那条（最后一个）
const session = computed(() => allMessages.value.find(m => m.sessionId === null) ?? null)
// 回复按时间升序展示（服务端返回的是 DESC，所以 reverse）
const replies = computed(() => {
  const rs = allMessages.value.filter(m => m.sessionId !== null)
  return [...rs].reverse()
})

function formatDate(date: string) {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

async function fetchMessage() {
  loading.value = true
  try {
    const res = await msgApi.getMessage(id.value)
    const data = res.data ?? res
    allMessages.value = Array.isArray(data) ? data : [data]
  }
  catch (e) {
    console.error(e)
    uiMsg.error('加载失败')
  }
  finally {
    loading.value = false
  }
}

async function markRead() {
  try {
    await msgApi.markRead(id.value)
  }
  catch {
    // 忽略标记已读失败
  }
}

async function handleReply() {
  if (!replyContent.value.trim()) return
  sending.value = true
  try {
    const res = await msgApi.reply(id.value, replyContent.value.trim())
    const newReply = res.data ?? res
    allMessages.value = [newReply, ...allMessages.value.filter(m => m.sessionId !== null), session.value!]
    replyContent.value = ''
    uiMsg.success('回复已发送')
  }
  catch {
    uiMsg.error('回复失败，请重试')
  }
  finally {
    sending.value = false
  }
}

onMounted(async () => {
  await fetchMessage()
  await markRead()
})

useHead({ title: '消息详情 — Leverage OJ' })
</script>

<style scoped>
.message-detail-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 800px;
  margin: 0 auto;
}

.page-header {
  padding: 4px 0;
}

.message-card {
  transition: box-shadow 0.2s;
}

.root-message {
  border-left: 4px solid #2080f0;
}

.reply-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.reply-section-title {
  font-size: 13px;
  color: #888;
  margin-bottom: 4px;
}

.reply-card {
  border-left: 4px solid #18a058;
}

.message-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #555;
}

.sender-name {
  font-weight: 600;
  color: #333;
}

.message-time {
  margin-left: auto;
  font-size: 12px;
  color: #999;
}

.message-body {
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
  color: #333;
  white-space: pre-wrap;
  word-break: break-word;
}

.reply-box {
  margin-top: 4px;
}

.reply-box-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 10px;
  color: #555;
}

.reply-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}

.empty-state {
  padding: 48px 0;
}
</style>
