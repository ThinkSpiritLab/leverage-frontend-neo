<template>
  <div class="users-page">
    <div class="page-header">
      <NH2>用户列表</NH2>
      <NInput
        v-model:value="searchText"
        placeholder="搜索用户名..."
        clearable
        style="width: 260px"
        @input="debouncedFetch"
      />
    </div>

    <PaginatedTable
      :columns="columns"
      :data="(users as any)"
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
import { NButton } from 'naive-ui'
import type { User } from '~/types'
import { useDebounceFn } from '@vueuse/core'

definePageMeta({
  layout: 'default',
  middleware: 'auth',
})

const usersApi = useUsersApi()

const searchText = ref('')
const page = ref(1)
const pageSize = ref(20)
const users = ref<User[]>([])
const total = ref(0)
const loading = ref(false)

const columns: DataTableColumns = [
  {
    title: '排名',
    key: 'rank',
    width: 80,
    render: (_row: any, idx: number) => (page.value - 1) * pageSize.value + idx + 1,
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
    width: 100,
    render: (row: any) => row.accepts ?? 0,
  },
  {
    title: '提交数',
    key: 'submits',
    width: 100,
    render: (row: any) => row.submits ?? 0,
  },
  {
    title: '通过率',
    key: 'rate',
    width: 100,
    render: (row: any) => {
      const submits = row.submits ?? 0
      const accepts = row.accepts ?? 0
      if (submits === 0) return '-'
      return `${Math.round((accepts / submits) * 100)}%`
    },
  },
]

async function fetchUsers() {
  loading.value = true
  try {
    const res = await usersApi.list({
      page: page.value,
      perPage: pageSize.value,
      search: searchText.value || undefined,
    })
    const data = (res as any).data ?? res
    users.value = data.items ?? data
    total.value = data.total ?? 0
  }
  catch (e) {
    console.error(e)
  }
  finally {
    loading.value = false
  }
}

const debouncedFetch = useDebounceFn(() => {
  page.value = 1
  fetchUsers()
}, 400)

function onPageChange({ page: p }: { page: number; pageSize: number }) {
  page.value = p
  fetchUsers()
}

onMounted(fetchUsers)

useHead({ title: '用户列表 — Leverage OJ' })
</script>

<style scoped>
.users-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
