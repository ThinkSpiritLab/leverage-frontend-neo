<template>
  <div class="compete-page">
    <div class="page-header">
      <NH2>Bot 对战</NH2>
    </div>

    <NSpin :show="loading">
      <NDataTable
        :columns="columns"
        :data="games"
        :bordered="false"
        :row-key="(row: any) => row.id"
      />
    </NSpin>

    <NPagination
      v-if="total > pageSize"
      v-model:page="page"
      :page-size="pageSize"
      :item-count="total"
      style="margin-top: 16px; justify-content: flex-end"
      @update:page="fetchGames"
    />
  </div>
</template>

<script setup lang="ts">
import { h } from 'vue'
import { NButton, NTag } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'

definePageMeta({
  layout: 'default',
  middleware: 'auth',
})

const competeApi = useCompeteApi()

const page = ref(1)
const pageSize = ref(20)
const games = ref<any[]>([])
const total = ref(0)
const loading = ref(false)

async function fetchGames() {
  loading.value = true
  try {
    const res = await competeApi.listGames({ page: page.value, perPage: pageSize.value })
    games.value = res.data.items
    total.value = res.data.total
  }
  catch (e) {
    console.error(e)
  }
  finally {
    loading.value = false
  }
}

onMounted(fetchGames)

const columns: DataTableColumns<any> = [
  {
    title: 'ID',
    key: 'id',
    width: 80,
  },
  {
    title: '游戏名称',
    key: 'name',
    render(row) {
      return h(
        NButton,
        {
          text: true,
          type: 'primary',
          onClick: () => navigateTo(`/compete/${row.id}`),
        },
        { default: () => row.name },
      )
    },
  },
  {
    title: '描述',
    key: 'description',
    render(row) {
      return h('span', row.description || '-')
    },
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render(row) {
      return h(
        NTag,
        { type: 'success', size: 'small', bordered: false },
        { default: () => row.status || '进行中' },
      )
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
          type: 'primary',
          onClick: () => navigateTo(`/compete/${row.id}`),
        },
        { default: () => '查看' },
      )
    },
  },
]
</script>

<style scoped>
.compete-page {
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
