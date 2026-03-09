<template>
  <div class="admin-sus-recent">
    <div class="page-header">
      <NH2 style="margin: 0">最近可疑提交</NH2>
      <NText depth="3">显示最近 50 条可疑提交</NText>
    </div>

    <NDataTable
      :columns="columns"
      :data="items"
      :loading="loading"
      :row-key="(row: any) => row.id"
    />
  </div>
</template>

<script setup lang="ts">
import { h, ref } from 'vue'
import { NSwitch, NButton, NText, useMessage } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const suspicionsApi = useSuspicionsApi()
const message = useMessage()

const items = ref<any[]>([])
const loading = ref(false)

async function fetchRecent() {
  loading.value = true
  try {
    const res = await suspicionsApi.list({ page: 1, perPage: 50 })
    // 按 submissionId DESC 排序（越大越新）
    items.value = (res.data.items ?? []).sort(
      (a: any, b: any) => (b.submissionId ?? 0) - (a.submissionId ?? 0),
    )
  }
  catch (e) {
    console.error(e)
  }
  finally {
    loading.value = false
  }
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
    width: 100,
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
    title: '用户名',
    key: 'user',
    render(row: any) {
      const u = row.submission?.user ?? row.user
      return h('span', u?.username ?? String(row.submission?.userId ?? '-'))
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

onMounted(fetchRecent)

useHead({ title: '最近可疑提交' })
</script>

<style scoped>
.admin-sus-recent {
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
