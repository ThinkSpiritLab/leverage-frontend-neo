<template>
  <div class="submissions-page">
    <div class="page-header">
      <NH2>提交记录</NH2>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <NInput
        v-model:value="filterProblemId"
        placeholder="题目 ID"
        clearable
        style="width: 160px"
        @update:value="onFilterChange"
      />
      <NSelect
        v-model:value="filterStatus"
        placeholder="状态"
        clearable
        :options="statusOptions"
        style="width: 160px"
        @update:value="onFilterChange"
      />
    </div>

    <PaginatedTable
      :columns="columns"
      :data="(submissions as any)"
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
import { h } from 'vue'
import type { DataTableColumns } from 'naive-ui'
import { STATUS_LABEL, type Submission } from '~/types'
import dayjs from 'dayjs'

definePageMeta({
  layout: 'default',
  middleware: 'auth',
})

const submissionsApi = useSubmissionsApi()

const filterProblemId = ref('')
const filterStatus = ref<number | null>(null)
const page = ref(1)
const pageSize = ref(20)
const submissions = ref<Submission[]>([])
const total = ref(0)
const loading = ref(false)

const statusOptions = Object.entries(STATUS_LABEL).map(([value, label]) => ({
  label,
  value: Number(value),
}))

async function fetchSubmissions() {
  loading.value = true
  try {
    const params: Record<string, unknown> = {
      page: page.value,
      perPage: pageSize.value,
    }
    if (filterProblemId.value) params.problemId = Number(filterProblemId.value)
    if (filterStatus.value !== null && filterStatus.value !== undefined) params.status = filterStatus.value
    const res = await submissionsApi.list(params as any)
    submissions.value = res.data.items
    total.value = res.data.total
  }
  catch (e) {
    console.error(e)
  }
  finally {
    loading.value = false
  }
}

onMounted(fetchSubmissions)

function onFilterChange() {
  page.value = 1
  fetchSubmissions()
}

function onPageChange({ page: p, pageSize: ps }: { page: number; pageSize: number }) {
  page.value = p
  pageSize.value = ps
  fetchSubmissions()
}

const LANGUAGE_LABEL: Record<string, string> = {
  cpp: 'C++',
  java: 'Java',
  python: 'Python',
  javascript: 'JavaScript',
  c: 'C',
  python2: 'Python2',
  python3: 'Python3',
  typescript: 'TypeScript',
}

const columns: DataTableColumns<Submission> = [
  {
    title: 'ID',
    key: 'id',
    width: 80,
    render(row) {
      return h(
        resolveComponent('NButton') as any,
        {
          text: true,
          type: 'primary',
          onClick: () => navigateTo(`/submissions/${row.id}`),
        },
        { default: () => `#${row.id}` },
      )
    },
  },
  {
    title: '题目',
    key: 'problem',
    render(row) {
      if (!row.problem) return h('span', { style: 'color:#999' }, '-')
      return h(
        resolveComponent('NButton') as any,
        {
          text: true,
          type: 'primary',
          onClick: () => navigateTo(`/problems/${row.problem!.id}`),
        },
        { default: () => `${row.problem!.prefix}${row.problem!.logicId} ${row.problem!.title}` },
      )
    },
  },
  {
    title: '用户',
    key: 'user',
    render(row) {
      if (!row.user) return h('span', { style: 'color:#999' }, '-')
      return h(
        resolveComponent('UserLink') as any,
        { userId: row.user.id, username: row.user.username },
      )
    },
  },
  {
    title: '语言',
    key: 'language',
    width: 100,
    render(row) {
      return h('span', {}, LANGUAGE_LABEL[row.language] || row.language)
    },
  },
  {
    title: '状态',
    key: 'status',
    width: 120,
    render(row) {
      return h(resolveComponent('StatusTag') as any, { status: row.status })
    },
  },
  {
    title: '时间',
    key: 'time',
    width: 100,
    render(row) {
      return h('span', {}, row.time !== undefined && row.time !== null ? `${row.time}ms` : '-')
    },
  },
  {
    title: '内存',
    key: 'memory',
    width: 100,
    render(row) {
      return h('span', {}, row.memory !== undefined && row.memory !== null ? `${row.memory}KB` : '-')
    },
  },
  {
    title: '提交时间',
    key: 'createdAt',
    width: 160,
    render(row) {
      return h('span', { style: 'color:#666; font-size:13px' }, dayjs(row.createdAt).format('YYYY-MM-DD HH:mm:ss'))
    },
  },
]
</script>

<style scoped>
.submissions-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  align-items: center;
}

.page-header :deep(.n-h2) {
  margin: 0;
}

.filter-bar {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
</style>
