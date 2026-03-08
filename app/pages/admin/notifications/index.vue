<template>
  <div class="admin-notifications">
    <div class="page-header">
      <NH2 style="margin: 0">通知管理</NH2>
      <NButton type="primary" @click="openSendModal">
        + 发送通知
      </NButton>
    </div>

    <PaginatedTable
      :columns="columns"
      :data="notifications"
      :loading="loading"
      :total="total"
      :page="page"
      :page-size="pageSize"
      :row-key="(row: any) => row.id"
      @page-change="onPageChange"
    />

    <!-- 发送通知弹窗 -->
    <NModal v-model:show="showModal" title="发送通知" preset="dialog" style="width: 560px">
      <NForm :model="form" label-placement="left" label-width="90px" style="margin-top: 12px">
        <NFormItem label="标题" required>
          <NInput v-model:value="form.title" placeholder="通知标题" />
        </NFormItem>
        <NFormItem label="内容" required>
          <NInput
            v-model:value="form.content"
            type="textarea"
            :rows="5"
            placeholder="通知内容"
          />
        </NFormItem>
        <NFormItem label="目标用户">
          <NInputNumber
            v-model:value="form.targetUserId"
            :min="1"
            placeholder="留空则发送给全体用户"
            clearable
            style="width: 100%"
          />
          <template #feedback>
            <NText depth="3" style="font-size: 12px">留空则发送给全体用户</NText>
          </template>
        </NFormItem>
      </NForm>

      <template #action>
        <NSpace justify="end">
          <NButton @click="showModal = false">取消</NButton>
          <NButton type="primary" :loading="sending" @click="handleSend">发送</NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>

<script setup lang="ts">
import { h, ref } from 'vue'
import { NButton, NSpace, NText, useMessage, useDialog } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const notificationsApi = useNotificationsApi()
const message = useMessage()
const dialog = useDialog()

const notifications = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const loading = ref(false)

const showModal = ref(false)
const sending = ref(false)
const form = ref({
  title: '',
  content: '',
  targetUserId: null as number | null,
})

async function fetchNotifications() {
  loading.value = true
  try {
    const res = await notificationsApi.list({ page: page.value, perPage: pageSize.value })
    notifications.value = res.data.items
    total.value = res.data.total
  }
  catch (e) {
    console.error(e)
  }
  finally {
    loading.value = false
  }
}

onMounted(fetchNotifications)

function onPageChange({ page: p, pageSize: ps }: { page: number; pageSize: number }) {
  page.value = p
  pageSize.value = ps
  fetchNotifications()
}

function openSendModal() {
  form.value = { title: '', content: '', targetUserId: null }
  showModal.value = true
}

async function handleSend() {
  if (!form.value.title.trim()) {
    message.warning('请填写通知标题')
    return
  }
  if (!form.value.content.trim()) {
    message.warning('请填写通知内容')
    return
  }
  sending.value = true
  try {
    const dto: any = { title: form.value.title, content: form.value.content }
    if (form.value.targetUserId) dto.targetUserId = form.value.targetUserId
    await notificationsApi.create(dto)
    message.success('通知已发送')
    showModal.value = false
    fetchNotifications()
  }
  catch (e: any) {
    message.error(e?.response?.data?.message || '发送失败')
  }
  finally {
    sending.value = false
  }
}

function handleDelete(row: any) {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除通知「${row.title}」吗？`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await notificationsApi.delete(row.id)
        message.success('已删除')
        fetchNotifications()
      }
      catch (e: any) {
        message.error(e?.response?.data?.message || '删除失败')
      }
    },
  })
}

const columns: DataTableColumns = [
  { title: '#', key: 'id', width: 80 },
  { title: '标题', key: 'title' },
  {
    title: '内容',
    key: 'content',
    render(row: any) {
      const text = row.content ?? ''
      return h(NText, { depth: 2 }, { default: () => text.length > 60 ? `${text.slice(0, 60)}...` : text })
    },
  },
  {
    title: '目标',
    key: 'targetUserId',
    width: 120,
    render(row: any) {
      return row.targetUserId ? h('span', `用户 #${row.targetUserId}`) : h('span', { style: 'color: #999' }, '全体用户')
    },
  },
  {
    title: '发送时间',
    key: 'createdAt',
    width: 160,
    render(row: any) {
      return row.createdAt ? new Date(row.createdAt).toLocaleString('zh-CN') : '-'
    },
  },
  {
    title: '操作',
    key: 'actions',
    width: 100,
    render(row: any) {
      return h(
        NButton,
        {
          size: 'small',
          type: 'error',
          ghost: true,
          onClick: () => handleDelete(row),
        },
        { default: () => '删除' },
      )
    },
  },
]

useHead({ title: '通知管理' })
</script>

<style scoped>
.admin-notifications {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
