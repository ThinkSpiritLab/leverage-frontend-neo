<template>
  <div class="ranklist-page">
    <div class="page-header">
      <NH1>🏆 全站排行榜</NH1>
    </div>

    <NCard>
      <NDataTable
        :columns="columns"
        :data="users"
        :loading="loading"
        :pagination="pagination"
        remote
        :row-key="(row: any) => row.id"
        @update:page="onPageChange"
      />
      <div v-if="!loading && users.length === 0" style="display: flex; justify-content: center; padding: 40px 0">
        <NEmpty description="暂无排行数据" />
      </div>
    </NCard>
  </div>
</template>

<script setup lang="ts">
import { h } from 'vue'
import type { DataTableColumns } from 'naive-ui'
import { NButton } from 'naive-ui'
import type { User } from '~/types'

definePageMeta({
  layout: 'default',
})

const usersApi = useUsersApi()

const page = ref(1)
const pageSize = 50
const users = ref<User[]>([])
const total = ref(0)
const loading = ref(false)

const pagination = computed(() => ({
  page: page.value,
  pageSize,
  pageCount: Math.ceil(total.value / pageSize),
  itemCount: total.value,
  showSizePicker: false,
}))

function getRankLabel(globalRank: number) {
  if (globalRank === 1) return '🥇'
  if (globalRank === 2) return '🥈'
  if (globalRank === 3) return '🥉'
  return `${globalRank}`
}

const columns: DataTableColumns = [
  {
    title: '排名',
    key: 'rank',
    width: 90,
    render: (_row: any, idx: number) => {
      const globalRank = (page.value - 1) * pageSize + idx + 1
      return getRankLabel(globalRank)
    },
  },
  {
    title: '用户名',
    key: 'username',
    render: (row: any) =>
      h(NButton, { text: true, type: 'primary', onClick: () => navigateTo(`/users/${row.id}`) }, () => row.username),
  },
  {
    title: 'AC 数',
    key: 'accepts',
    width: 120,
    render: (row: any) => row.accepts ?? 0,
  },
  {
    title: '提交数',
    key: 'submits',
    width: 120,
    render: (row: any) => row.submits ?? 0,
  },
]

async function fetchUsers() {
  loading.value = true
  try {
    const res = await usersApi.list({
      page: page.value,
      perPage: pageSize,
      orderBy: 'accepts',
      order: 'desc',
    })
    users.value = res.data.items
    total.value = res.data.total
  }
  catch (e) {
    console.error(e)
  }
  finally {
    loading.value = false
  }
}

function onPageChange(p: number) {
  page.value = p
  fetchUsers()
}

onMounted(fetchUsers)

useHead({ title: '排行榜 — Leverage OJ' })
</script>

<style scoped>
.ranklist-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  text-align: center;
}
</style>
