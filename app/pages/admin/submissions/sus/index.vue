<template>
  <div class="admin-sus">
    <div class="page-header">
      <NH2 style="margin: 0">抄袭检测列表</NH2>
    </div>

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
import { NSwitch, NButton } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { useMessage } from 'naive-ui'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const suspicionsApi = useSuspicionsApi()
const message = useMessage()

const items = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const loading = ref(false)

async function fetchItems() {
  loading.value = true
  try {
    const res = await suspicionsApi.list({ page: page.value, perPage: pageSize.value })
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

onMounted(fetchItems)

function onPageChange({ page: p, pageSize: ps }: { page: number; pageSize: number }) {
  page.value = p
  pageSize.value = ps
  fetchItems()
}

async function toggleChecked(row: any) {
  try {
    await suspicionsApi.markChecked(row.id, !row.checked)
    row.checked = !row.checked
    message.success('已更新')
  }
  catch (e: any) {
    message.error(e?.response?.data?.message || '操作失败')
  }
}

const columns: DataTableColumns = [
  {
    title: '提交ID',
    key: 'id',
    width: 80,
    render(row: any) {
      return h(
        NButton,
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
    render(row: any) {
      if (row.problem) {
        return h('span', `${row.problem.prefix ?? ''}${row.problem.logicId ?? ''} ${row.problem.title ?? ''}`)
      }
      return h('span', String(row.problemId ?? '-'))
    },
  },
  {
    title: '用户',
    key: 'user',
    render(row: any) {
      return h('span', row.user?.username ?? String(row.userId ?? '-'))
    },
  },
  {
    title: '相似哈希',
    key: 'hashsum',
    render(row: any) {
      const hash = row.hashsum ?? row.ss_hashsum ?? ''
      return h(
        NButton,
        {
          text: true,
          type: 'info',
          onClick: () => navigateTo(`/admin/submissions/sus/${hash}`),
        },
        { default: () => hash.slice(0, 8) },
      )
    },
  },
  {
    title: '已审查',
    key: 'checked',
    width: 100,
    render(row: any) {
      return h(NSwitch, {
        value: !!row.checked,
        onUpdateValue: () => toggleChecked(row),
      })
    },
  },
]
</script>

<style scoped>
.admin-sus {
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
