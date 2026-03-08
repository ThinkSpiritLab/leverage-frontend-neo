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
import { NSwitch, NButton, useMessage  } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'

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
    key: 'submissionId',
    width: 80,
    render(row: any) {
      const id = row.submissionId ?? row.submission?.id
      return h(
        NButton,
        { text: true, type: 'primary', onClick: () => navigateTo(`/submissions/${id}`) },
        { default: () => `#${id}` },
      )
    },
  },
  {
    title: '题目',
    key: 'problem',
    render(row: any) {
      const p = row.submission?.problem ?? row.problem
      if (p) return h('span', `${p.prefix ?? ''}${p.logicId ?? ''} ${p.title ?? ''}`)
      return h('span', String(row.submission?.problemId ?? '-'))
    },
  },
  {
    title: '用户',
    key: 'user',
    render(row: any) {
      const u = row.submission?.user ?? row.user
      return h('span', u?.username ?? String(row.submission?.userId ?? '-'))
    },
  },
  {
    title: '相似哈希',
    key: 'hashsum',
    render(row: any) {
      const hash = row.hashsum ?? ''
      if (!hash) return h('span', { style: 'color:#aaa' }, '-')
      return h(
        NButton,
        { text: true, type: 'info', onClick: () => navigateTo(`/admin/submissions/sus/${hash}`) },
        { default: () => hash.slice(0, 8) + '…' },
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

useHead({ title: '可疑提交' })
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
