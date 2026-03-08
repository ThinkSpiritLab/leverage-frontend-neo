<template>
  <div class="admin-sus">
    <div class="page-header">
      <NH2 style="margin: 0">抄袭检测列表</NH2>
      <NSpace>
        <NSelect
          v-model:value="selectedCourseId"
          :options="courseOptions"
          placeholder="按课程过滤（可选）"
          clearable
          style="width: 240px"
          @update:value="onCourseChange"
        />
        <NButton type="error" :disabled="checkedKeys.length === 0" @click="showBanModal = true">
          批量封禁选中用户 ({{ checkedKeys.length }})
        </NButton>
      </NSpace>
    </div>

    <PaginatedTable
      :columns="columns"
      :data="items"
      :loading="loading"
      :total="total"
      :page="page"
      :page-size="pageSize"
      :row-key="(row: any) => row.id"
      :checked-row-keys="checkedKeys"
      @update:checked-row-keys="(keys: any[]) => checkedKeys = keys"
      @page-change="onPageChange"
    />

    <NModal
      v-model:show="showBanModal"
      preset="dialog"
      title="批量封禁选中用户"
      positive-text="确认封禁"
      negative-text="取消"
      :loading="banning"
      @positive-click="handleBatchBan"
    >
      <NInput
        v-model:value="banReason"
        type="textarea"
        placeholder="请输入封禁原因"
        :rows="3"
      />
    </NModal>
  </div>
</template>

<script setup lang="ts">
import { h, ref } from 'vue'
import { NSwitch, NButton, NSpace, NSelect, NModal, NInput, useMessage } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const suspicionsApi = useSuspicionsApi()
const usersApi = useUsersApi()
const coursesApi = useCoursesApi()
const message = useMessage()

const items = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const loading = ref(false)

const checkedKeys = ref<Array<string | number>>([])
const showBanModal = ref(false)
const banReason = ref('')
const banning = ref(false)

const selectedCourseId = ref<number | null>(null)
const courseOptions = ref<Array<{ label: string; value: number }>>([])

async function fetchCourses() {
  try {
    const res = await coursesApi.list({ page: 1, perPage: 100 })
    const list = res.data?.items ?? res.data ?? []
    courseOptions.value = list.map((c: any) => ({
      label: c.name || c.title || `课程 #${c.id}`,
      value: c.id,
    }))
  }
  catch { /* ignore */ }
}

async function fetchItems() {
  loading.value = true
  try {
    const res = await suspicionsApi.list({
      page: page.value,
      perPage: pageSize.value,
      courseId: selectedCourseId.value ?? undefined,
    })
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

onMounted(() => {
  fetchCourses()
  fetchItems()
})

function onPageChange({ page: p, pageSize: ps }: { page: number; pageSize: number }) {
  page.value = p
  pageSize.value = ps
  fetchItems()
}

function onCourseChange() {
  page.value = 1
  checkedKeys.value = []
  fetchItems()
}

async function handleBatchBan() {
  const selectedRows = items.value.filter(row => checkedKeys.value.includes(row.id))
  const userIds = [...new Set(selectedRows.map(row => row.submission?.userId ?? row.userId).filter(Boolean))]
  if (userIds.length === 0) {
    message.warning('未找到可封禁的用户')
    return false
  }
  banning.value = true
  try {
    await Promise.all(userIds.map(uid => usersApi.update(uid, { status: 2, remarks: banReason.value })))
    message.success(`已封禁 ${userIds.length} 人`)
    showBanModal.value = false
    banReason.value = ''
    checkedKeys.value = []
  }
  catch (e: any) {
    message.error(e?.response?.data?.message || e?.message || '封禁失败')
    return false
  }
  finally {
    banning.value = false
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
    type: 'selection',
  },
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
