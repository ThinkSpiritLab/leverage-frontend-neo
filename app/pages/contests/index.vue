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
      :row-props="getRowProps"
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
const allContests = ref<Contest[]>([])
const total = ref(0)
const loading = ref(false)

function filterByTab(items: Contest[]): Contest[] {
  const now = Date.now()
  return items.filter((c) => {
    const start = new Date(c.startTime).getTime()
    const end = new Date(c.endTime).getTime()
    switch (activeTab.value) {
      case 'upcoming': return start > now
      case 'ongoing': return start <= now && end > now
      case 'ended': return end <= now
      default: return true
    }
  })
}

const contests = computed(() => filterByTab(allContests.value))

async function fetchContests() {
  loading.value = true
  try {
    const res = await contestsApi.list({
      page: page.value,
      perPage: pageSize.value,
      state: activeTab.value,
    })
    allContests.value = res.data.items
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

function getRowProps(row: Contest) {
  return {
    style: 'cursor: pointer;',
    onClick: () => navigateTo(`/contests/${row.id}`),
  }
}

const columns: DataTableColumns<Contest> = [
  {
    title: '标题',
    key: 'title',
    render(row) {
      return h(
        'a',
        {
          style: 'color: #2080f0; cursor: pointer; text-decoration: none;',
          onClick: (e: Event) => {
            e.preventDefault()
            navigateTo(`/contests/${row.id}`)
          },
        },
        row.title || '-',
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

useHead({ title: '竞赛列表 — Leverage OJ' })
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
