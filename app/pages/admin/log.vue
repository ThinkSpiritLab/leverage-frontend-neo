<template>
  <div class="admin-log">
    <div class="page-header">
      <NH2 style="margin: 0">系统日志</NH2>
    </div>

    <!-- 筛选栏 -->
    <NCard size="small">
      <NSpace align="center" wrap>
        <NSelect
          v-model:value="filterAction"
          :options="actionOptions"
          placeholder="全部操作类型"
          clearable
          style="width: 160px"
          @update:value="onFilterChange"
        />
        <NDatePicker
          v-model:value="filterDateRange"
          type="daterange"
          clearable
          style="width: 280px"
          @update:value="onFilterChange"
        />
        <NButton @click="resetFilters">重置</NButton>
      </NSpace>
    </NCard>

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
import dayjs from 'dayjs'

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

const filterAction = ref<string | null>(null)
const filterDateRange = ref<[number, number] | null>(null)

const actionOptions = computed(() => {
  const actions = [...new Set(logs.value.map(l => l.action).filter(Boolean))]
  return actions.map(a => ({ label: a, value: a }))
})

function onFilterChange() {
  currentPage.value = 1
  fetchLogs(1)
}

function resetFilters() {
  filterAction.value = null
  filterDateRange.value = null
  currentPage.value = 1
  fetchLogs(1)
}

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
    const params: Record<string, any> = { page, perPage }
    if (filterAction.value) params.action = filterAction.value
    if (filterDateRange.value) {
      params.startDate = dayjs(filterDateRange.value[0]).format('YYYY-MM-DD')
      params.endDate = dayjs(filterDateRange.value[1]).format('YYYY-MM-DD')
    }
    const res = await api.get<{ items: any[]; total: number; page: number; perPage: number }>(
      '/logs',
      { params },
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

useHead({ title: '系统日志' })
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
