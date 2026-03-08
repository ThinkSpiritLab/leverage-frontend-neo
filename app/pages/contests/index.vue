<template>
  <div class="contests-page">
    <div class="page-header">
      <NH2>竞赛列表</NH2>
    </div>

    <NTabs v-model:value="activeTab" type="line" animated @update:value="onTabChange">
      <NTabPane name="upcoming" tab="即将开始" />
      <NTabPane name="ongoing" tab="进行中" />
      <NTabPane name="ended" tab="已结束" />
    </NTabs>

    <PaginatedTable
      :columns="columns"
      :data="(contests as any)"
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
import { NButton, NTag } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import dayjs from 'dayjs'
import type { Contest } from '~/types'

definePageMeta({
  layout: 'default',
  middleware: 'auth',
})

const contestsApi = useContestsApi()

const activeTab = ref<'upcoming' | 'ongoing' | 'ended'>('ongoing')
const page = ref(1)
const pageSize = ref(20)
const contests = ref<Contest[]>([])
const total = ref(0)
const loading = ref(false)

async function fetchContests() {
  loading.value = true
  try {
    const res = await contestsApi.list({
      page: page.value,
      perPage: pageSize.value,
      state: activeTab.value,
    })
    contests.value = res.data.items
    total.value = res.data.total
  }
  catch (e) {
    console.error(e)
  }
  finally {
    loading.value = false
  }
}

onMounted(fetchContests)

function onTabChange() {
  page.value = 1
  fetchContests()
}

function onPageChange({ page: p, pageSize: ps }: { page: number; pageSize: number }) {
  page.value = p
  pageSize.value = ps
  fetchContests()
}

const typeColorMap: Record<string, 'default' | 'info' | 'success' | 'warning' | 'error'> = {
  icpc: 'info',
  ioi: 'success',
  oi: 'warning',
  cf: 'error',
}

const columns: DataTableColumns<Contest> = [
  {
    title: '标题',
    key: 'title',
    render(row) {
      return h(
        NButton,
        {
          text: true,
          type: 'primary',
          onClick: () => navigateTo(`/contests/${row.id}`),
        },
        { default: () => row.title },
      )
    },
  },
  {
    title: '开始时间',
    key: 'startTime',
    width: 180,
    render(row) {
      return h('span', dayjs(row.startTime).format('YYYY-MM-DD HH:mm'))
    },
  },
  {
    title: '结束时间',
    key: 'endTime',
    width: 180,
    render(row) {
      return h('span', dayjs(row.endTime).format('YYYY-MM-DD HH:mm'))
    },
  },
  {
    title: '类型',
    key: 'type',
    width: 100,
    render(row) {
      const type = (row.type || '').toLowerCase()
      return h(
        NTag,
        {
          type: typeColorMap[type] || 'default',
          size: 'small',
          bordered: false,
        },
        { default: () => row.type?.toUpperCase() || '-' },
      )
    },
  },
]
</script>

<style scoped>
.contests-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.page-header :deep(.n-h2) {
  margin: 0;
}
</style>
