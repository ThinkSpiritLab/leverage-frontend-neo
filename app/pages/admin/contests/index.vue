<template>
  <div class="admin-contests">
    <div class="page-header">
      <NH2 style="margin: 0">竞赛管理</NH2>
      <NButton type="primary" @click="openCreateModal">
        + 新增竞赛
      </NButton>
    </div>

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

    <!-- 新增/编辑弹窗 -->
    <NModal v-model:show="showModal" :title="editingId ? '编辑竞赛' : '新增竞赛'" preset="dialog" style="width: 560px">
      <NForm :model="form" label-placement="left" label-width="90px" style="margin-top: 12px">
        <NFormItem label="标题" required>
          <NInput v-model:value="form.title" placeholder="输入竞赛标题" />
        </NFormItem>
        <NFormItem label="类型">
          <NSelect
            v-model:value="form.type"
            :options="typeOptions"
          />
        </NFormItem>
        <NFormItem label="开始时间" required>
          <NDatePicker
            v-model:value="startTimeMs"
            type="datetime"
            clearable
            style="width: 100%"
            @update:value="onStartTimeChange"
          />
        </NFormItem>
        <NFormItem label="结束时间" required>
          <NDatePicker
            v-model:value="endTimeMs"
            type="datetime"
            clearable
            style="width: 100%"
            @update:value="onEndTimeChange"
          />
        </NFormItem>
        <NFormItem label="题目ID列表">
          <NInput
            v-model:value="problemIdsText"
            placeholder="逗号分隔的题目ID，如: 1,2,3"
          />
        </NFormItem>
      </NForm>

      <template #action>
        <NSpace justify="end">
          <NButton @click="showModal = false">取消</NButton>
          <NButton type="primary" :loading="saving" @click="handleSave">保存</NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>

<script setup lang="ts">
import { h } from 'vue'
import { NButton, NSpace, NTag, useMessage, useDialog } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import dayjs from 'dayjs'
import type { Contest } from '~/types'
import type { CreateContestDto } from '~/composables/api/contests'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const contestsApi = useContestsApi()
const message = useMessage()
const dialog = useDialog()

const contests = ref<Contest[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const loading = ref(false)

const showModal = ref(false)
const editingId = ref<number | null>(null)
const saving = ref(false)

const startTimeMs = ref<number | null>(null)
const endTimeMs = ref<number | null>(null)
const problemIdsText = ref('')

const defaultForm = (): CreateContestDto => ({
  title: '',
  type: 'icpc',
  startTime: '',
  endTime: '',
  problemIds: [],
})

const form = ref<CreateContestDto>(defaultForm())

const typeOptions = [
  { label: 'ICPC', value: 'icpc' },
  { label: 'IOI', value: 'ioi' },
  { label: 'OI', value: 'oi' },
  { label: 'Codeforces', value: 'cf' },
]

const typeColorMap: Record<string, 'default' | 'info' | 'success' | 'warning' | 'error'> = {
  icpc: 'info',
  ioi: 'success',
  oi: 'warning',
  cf: 'error',
}

async function fetchContests() {
  loading.value = true
  try {
    const res = await contestsApi.list({ page: page.value, perPage: pageSize.value })
    contests.value = res.items
    total.value = res.total
  }
  catch (e) {
    console.error(e)
  }
  finally {
    loading.value = false
  }
}

onMounted(fetchContests)

function onPageChange({ page: p, pageSize: ps }: { page: number; pageSize: number }) {
  page.value = p
  pageSize.value = ps
  fetchContests()
}

function onStartTimeChange(val: number | null) {
  form.value.startTime = val ? dayjs(val).toISOString() : ''
}

function onEndTimeChange(val: number | null) {
  form.value.endTime = val ? dayjs(val).toISOString() : ''
}

function openCreateModal() {
  editingId.value = null
  form.value = defaultForm()
  startTimeMs.value = null
  endTimeMs.value = null
  problemIdsText.value = ''
  showModal.value = true
}

function openEditModal(row: Contest) {
  editingId.value = row.id
  form.value = {
    title: row.title,
    type: row.type,
    startTime: row.startTime,
    endTime: row.endTime,
    problemIds: row.problems?.map(p => p.id) || [],
  }
  startTimeMs.value = dayjs(row.startTime).valueOf()
  endTimeMs.value = dayjs(row.endTime).valueOf()
  problemIdsText.value = (row.problems?.map(p => p.id) || []).join(',')
  showModal.value = true
}

async function handleSave() {
  if (!form.value.title.trim()) {
    message.warning('请填写竞赛标题')
    return
  }
  if (!form.value.startTime || !form.value.endTime) {
    message.warning('请选择开始和结束时间')
    return
  }

  // Parse problemIds from text
  const ids = problemIdsText.value
    .split(',')
    .map(s => parseInt(s.trim()))
    .filter(n => !isNaN(n) && n > 0)
  form.value.problemIds = ids

  saving.value = true
  try {
    if (editingId.value) {
      await contestsApi.update(editingId.value, form.value)
      message.success('编辑成功')
    }
    else {
      await contestsApi.create(form.value)
      message.success('创建成功')
    }
    showModal.value = false
    fetchContests()
  }
  catch (e: any) {
    message.error(e?.message || '操作失败')
  }
  finally {
    saving.value = false
  }
}

function handleDelete(row: Contest) {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除竞赛「${row.title}」吗？此操作不可恢复。`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await contestsApi.delete(row.id)
        message.success('删除成功')
        fetchContests()
      }
      catch (e: any) {
        message.error(e?.message || '删除失败')
      }
    },
  })
}

const columns: DataTableColumns<Contest> = [
  {
    title: 'ID',
    key: 'id',
    width: 70,
  },
  {
    title: '标题',
    key: 'title',
    render(row) {
      return h(
        'a',
        {
          style: 'color: #2080f0; cursor: pointer;',
          onClick: () => navigateTo(`/contests/${row.id}`),
        },
        row.title,
      )
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
  {
    title: '开始时间',
    key: 'startTime',
    width: 170,
    render(row) {
      return h('span', dayjs(row.startTime).format('YYYY-MM-DD HH:mm'))
    },
  },
  {
    title: '结束时间',
    key: 'endTime',
    width: 170,
    render(row) {
      return h('span', dayjs(row.endTime).format('YYYY-MM-DD HH:mm'))
    },
  },
  {
    title: '题目数',
    key: 'problems',
    width: 80,
    render(row) {
      return h('span', row.problems?.length || 0)
    },
  },
  {
    title: '操作',
    key: 'actions',
    width: 140,
    render(row) {
      return h(
        NSpace,
        { size: 'small' },
        {
          default: () => [
            h(
              NButton,
              {
                size: 'small',
                type: 'primary',
                ghost: true,
                onClick: () => openEditModal(row),
              },
              { default: () => '编辑' },
            ),
            h(
              NButton,
              {
                size: 'small',
                type: 'error',
                ghost: true,
                onClick: () => handleDelete(row),
              },
              { default: () => '删除' },
            ),
          ],
        },
      )
    },
  },
]
</script>

<style scoped>
.admin-contests {
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
