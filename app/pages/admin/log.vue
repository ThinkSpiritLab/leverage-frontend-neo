<template>
  <div class="admin-log">
    <div class="page-header">
      <NH2 style="margin: 0">系统日志</NH2>
    </div>

    <NSpin :show="loading">
      <NDataTable
        :columns="columns"
        :data="logs"
        :row-key="(row: any) => row.id"
        size="small"
        bordered
        :pagination="false"
      />
    </NSpin>

    <div class="pagination-wrap">
      <NPagination
        v-model:page="currentPage"
        :page-count="totalPages"
        :page-size="perPage"
        show-quick-jumper
        @update:page="fetchLogs"
      />
    </div>

    <!-- Payload 详情弹窗 -->
    <NModal v-model:show="modalVisible" preset="card" title="Payload 详情" style="max-width: 600px">
      <NScrollbar style="max-height: 400px">
        <pre style="white-space: pre-wrap; word-break: break-all; font-size: 13px">{{ selectedPayload }}</pre>
      </NScrollbar>
    </NModal>
  </div>
</template>

<script setup lang="ts">
import { h, ref, computed, onMounted } from 'vue'
import { NButton, NTag } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const api = useApi()

const logs = ref<any[]>([])
const total = ref(0)
const currentPage = ref(1)
const perPage = 20
const loading = ref(false)

const modalVisible = ref(false)
const selectedPayload = ref('')

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / perPage)))

function showPayload(payload: string) {
  selectedPayload.value = payload
  modalVisible.value = true
}

function formatTime(val: string) {
  if (!val) return '-'
  return new Date(val).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

const columns: DataTableColumns = [
  {
    title: '#',
    key: 'id',
    width: 60,
  },
  {
    title: '时间',
    key: 'createdAt',
    width: 180,
    render: (row: any) => formatTime(row.createdAt),
  },
  {
    title: '操作者',
    key: 'caller',
    width: 140,
    render: (row: any) => {
      const username = row.caller?.username ?? `#${row.callerId}`
      return h(NTag, { size: 'small', bordered: false }, { default: () => username })
    },
  },
  {
    title: '字段',
    key: 'field',
    width: 120,
    render: (row: any) => row.field ?? '-',
  },
  {
    title: '操作类型',
    key: 'action',
    render: (row: any) => row.action ?? '-',
  },
  {
    title: 'Payload',
    key: 'payload',
    width: 100,
    render: (row: any) => {
      if (!row.payload) return '-'
      return h(NButton, {
        size: 'small',
        type: 'primary',
        ghost: true,
        onClick: () => showPayload(row.payload),
      }, { default: () => 'Show' })
    },
  },
]

async function fetchLogs(page = currentPage.value) {
  loading.value = true
  currentPage.value = page
  try {
    const res = await api.get<{ items: any[]; total: number; page: number; perPage: number }>(
      '/logs',
      { params: { page, perPage } },
    )
    logs.value = res.data?.items ?? []
    total.value = res.data?.total ?? 0
  }
  catch (e) {
    console.error('fetchLogs error', e)
  }
  finally {
    loading.value = false
  }
}

onMounted(() => fetchLogs(1))
</script>

<style scoped>
.admin-log {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  padding: 8px 0;
}
</style>
