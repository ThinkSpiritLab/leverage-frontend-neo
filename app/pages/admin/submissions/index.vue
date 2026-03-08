<template>
  <div class="admin-submissions">
    <div class="page-header">
      <NH2 style="margin: 0">提交管理</NH2>
    </div>

    <!-- 筛选栏 -->
    <NCard size="small">
      <NSpace align="center" wrap>
        <NInputGroup style="width: 200px">
          <NInputGroupLabel>用户ID</NInputGroupLabel>
          <NInputNumber v-model:value="filterUserId" :min="1" placeholder="用户ID" clearable @update:value="onFilterChange" />
        </NInputGroup>
        <NInputGroup style="width: 220px">
          <NInputGroupLabel>题目ID</NInputGroupLabel>
          <NInputNumber v-model:value="filterProblemId" :min="1" placeholder="题目ID" clearable @update:value="onFilterChange" />
        </NInputGroup>
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
      :data="submissions"
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
import { NButton, NSpace, useMessage, useDialog } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import type { Submission } from '~/types'
import { STATUS_LABEL } from '~/types'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const submissionsApi = useSubmissionsApi()
const message = useMessage()
const dialog = useDialog()

const submissions = ref<Submission[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const loading = ref(false)

const filterUserId = ref<number | null>(null)
const filterProblemId = ref<number | null>(null)
const filterStatus = ref<number | null>(null)

const statusOptions = Object.entries(STATUS_LABEL).map(([value, label]) => ({
  label,
  value: Number(value),
}))

async function fetchSubmissions() {
  loading.value = true
  try {
    const params: any = { page: page.value, perPage: pageSize.value }
    if (filterUserId.value) params.userId = filterUserId.value
    if (filterProblemId.value) params.problemId = filterProblemId.value
    if (filterStatus.value !== null) params.status = filterStatus.value
    const res = await submissionsApi.list(params)
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

function resetFilters() {
  filterUserId.value = null
  filterProblemId.value = null
  filterStatus.value = null
  page.value = 1
  fetchSubmissions()
}

function onPageChange({ page: p, pageSize: ps }: { page: number; pageSize: number }) {
  page.value = p
  pageSize.value = ps
  fetchSubmissions()
}

async function handleRejudge(row: Submission) {
  dialog.warning({
    title: '确认重判',
    content: `确定要重判提交 #${row.id} 吗？`,
    positiveText: '重判',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await submissionsApi.rejudge(row.id)
        message.success('重判已提交')
        fetchSubmissions()
      }
      catch (e: any) {
        message.error(e?.response?.data?.message || '重判失败')
      }
    },
  })
}

const columns: DataTableColumns<Submission> = [
  {
    title: '#',
    key: 'id',
    width: 80,
  },
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
  {
    title: '语言',
    key: 'language',
    width: 100,
  },
  {
    title: '状态',
    key: 'status',
    width: 120,
    render(row) {
      return h(resolveComponent('StatusTag'), { status: row.status })
    },
  },
  {
    title: '时间(ms)',
    key: 'time',
    width: 100,
    render(row) {
      return row.time !== undefined ? String(row.time) : '-'
    },
  },
  {
    title: '内存(KB)',
    key: 'memory',
    width: 100,
    render(row) {
      return row.memory !== undefined ? String(row.memory) : '-'
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
    title: '操作',
    key: 'actions',
    width: 100,
    render(row) {
      return h(
        NButton,
        {
          size: 'small',
          type: 'warning',
          ghost: true,
          onClick: () => handleRejudge(row),
        },
        { default: () => '重判' },
      )
    },
  },
]
</script>

<style scoped>
.admin-submissions {
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
