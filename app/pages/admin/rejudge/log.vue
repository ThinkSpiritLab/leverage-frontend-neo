<template>
  <div class="rejudge-log">
    <div class="page-header">
      <NH2 style="margin: 0">重评测记录</NH2>
    </div>

    <!-- 筛选栏 -->
    <NCard size="small">
      <NSpace align="center" wrap>
        <NInput
          v-model:value="filterName"
          placeholder="用户名"
          clearable
          style="width: 160px"
          @update:value="onFilterChange"
        />
        <NInput
          v-model:value="filterTitle"
          placeholder="题目名"
          clearable
          style="width: 200px"
          @update:value="onFilterChange"
        />
        <NSelect
          v-model:value="filterStatus"
          :options="statusOptions"
          placeholder="全部状态"
          clearable
          style="width: 160px"
          @update:value="onFilterChange"
        />
        <NButton @click="resetFilters">重置</NButton>
      </NSpace>
    </NCard>

    <PaginatedTable
      :columns="columns"
      :data="items"
      :loading="loading"
      :total="total"
      :page="page"
      :page-size="pageSize"
      :row-key="(row: any) => row.id"
      @page-change="onPageChange"
    />
  </div>
</template>

<script setup lang="ts">
import { h, ref } from 'vue'
import type { DataTableColumns } from 'naive-ui'
import { STATUS_LABEL } from '~/types'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const api = useApi()

const items = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const loading = ref(false)

const filterName = ref<string | null>(null)
const filterTitle = ref<string | null>(null)
const filterStatus = ref<number | null>(null)

const statusOptions = Object.entries(STATUS_LABEL).map(([value, label]) => ({
  label,
  value: Number(value),
}))

async function fetchLog() {
  loading.value = true
  try {
    const body: any = {}
    if (filterName.value) body.name = filterName.value
    if (filterTitle.value) body.title = filterTitle.value
    if (filterStatus.value !== null) body.status = filterStatus.value

    const res = await api.post<{ items: any[]; total: number }>(
      '/submissions/rejudge-log',
      body,
      { params: { page: page.value, perPage: pageSize.value } },
    )
    items.value = res.data.items
    total.value = res.data.total
  }
  catch (e) {
    console.error(e)
  }
  finally {
    loading.value = false
  }
}

onMounted(fetchLog)

function onFilterChange() {
  page.value = 1
  fetchLog()
}

function resetFilters() {
  filterName.value = null
  filterTitle.value = null
  filterStatus.value = null
  page.value = 1
  fetchLog()
}

function onPageChange({ page: p, pageSize: ps }: { page: number; pageSize: number }) {
  page.value = p
  pageSize.value = ps
  fetchLog()
}

const columns: DataTableColumns<any> = [
  { title: '#', key: 'id', width: 80 },
  {
    title: '用户',
    key: 'user',
    render(row) {
      return h('span', row.user?.username ?? String(row.userId))
    },
  },
  {
    title: '题目',
    key: 'problem',
    render(row) {
      if (row.problem) {
        return h('span', `${row.problem.prefix}${row.problem.logicId} - ${row.problem.title}`)
      }
      return h('span', String(row.problemId))
    },
  },
  { title: '语言', key: 'language', width: 100 },
  {
    title: '原状态',
    key: 'originalStatus',
    width: 120,
    render(row) {
      return h(resolveComponent('StatusTag'), { status: row.originalStatus ?? row.status })
    },
  },
  {
    title: '重评状态',
    key: 'newStatus',
    width: 120,
    render(row) {
      return row.newStatus !== undefined
        ? h(resolveComponent('StatusTag'), { status: row.newStatus })
        : h('span', '-')
    },
  },
  {
    title: '原时间(ms)',
    key: 'originalTime',
    width: 110,
    render(row) {
      return row.originalTime !== undefined ? String(row.originalTime) : '-'
    },
  },
  {
    title: '重评时间(ms)',
    key: 'newTime',
    width: 120,
    render(row) {
      return row.newTime !== undefined ? String(row.newTime) : '-'
    },
  },
  {
    title: '提交时间',
    key: 'createdAt',
    width: 160,
    render(row) {
      return new Date(row.createdAt).toLocaleString('zh-CN')
    },
  },
  {
    title: '重评时间',
    key: 'updatedAt',
    width: 160,
    render(row) {
      const d = row.updatedAt || row.rejudgedAt
      return d ? new Date(d).toLocaleString('zh-CN') : '-'
    },
  },
]

useHead({ title: '重测日志' })
</script>

<style scoped>
.rejudge-log {
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
