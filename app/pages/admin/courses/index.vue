<template>
  <div class="admin-courses">
    <div class="page-header">
      <NH2 style="margin: 0">课程管理</NH2>
      <NButton type="primary" @click="openCreateModal">
        + 新增课程
      </NButton>
    </div>

    <PaginatedTable
      :columns="columns"
      :data="(courses as any)"
      :loading="loading"
      :total="total"
      :page="page"
      :page-size="pageSize"
      :row-key="(row: any) => row.id"
      @page-change="onPageChange"
    />

    <!-- 新增/编辑弹窗 -->
    <NModal v-model:show="showModal" :title="editingId ? '编辑课程' : '新增课程'" preset="dialog" style="width: 560px">
      <NForm :model="form" label-placement="left" label-width="90px" style="margin-top: 12px">
        <NFormItem label="标题" required>
          <NInput v-model:value="form.title" placeholder="输入课程标题" />
        </NFormItem>
        <NFormItem label="描述">
          <NInput
            v-model:value="form.description"
            type="textarea"
            placeholder="输入课程描述（可选）"
            :rows="4"
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
import { NButton, NSpace, useMessage, useDialog } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import dayjs from 'dayjs'
import type { Course, CreateCourseDto } from '~/composables/api/courses'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const coursesApi = useCoursesApi()
const message = useMessage()
const dialog = useDialog()

const courses = ref<Course[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const loading = ref(false)

const showModal = ref(false)
const editingId = ref<number | null>(null)
const saving = ref(false)
const problemIdsText = ref('')

const defaultForm = (): CreateCourseDto => ({
  title: '',
  description: '',
  problemIds: [],
})

const form = ref<CreateCourseDto>(defaultForm())

async function fetchCourses() {
  loading.value = true
  try {
    const res = await coursesApi.list({ page: page.value, perPage: pageSize.value })
    const data = res.data as any
    courses.value = data?.items || data || []
    total.value = data?.total || courses.value.length
  }
  catch (e) {
    console.error(e)
  }
  finally {
    loading.value = false
  }
}

onMounted(fetchCourses)

function onPageChange({ page: p, pageSize: ps }: { page: number; pageSize: number }) {
  page.value = p
  pageSize.value = ps
  fetchCourses()
}

function openCreateModal() {
  editingId.value = null
  form.value = defaultForm()
  problemIdsText.value = ''
  showModal.value = true
}

function openEditModal(row: Course) {
  editingId.value = row.id
  form.value = {
    title: row.title,
    description: row.description || '',
    problemIds: (row.problems as any[])?.map((p: any) => typeof p === 'object' ? p.id : p) || [],
  }
  problemIdsText.value = form.value.problemIds?.join(',') || ''
  showModal.value = true
}

async function handleSave() {
  if (!form.value.title.trim()) {
    message.warning('请填写课程标题')
    return
  }

  const ids = problemIdsText.value
    .split(',')
    .map(s => parseInt(s.trim()))
    .filter(n => !isNaN(n) && n > 0)
  form.value.problemIds = ids

  saving.value = true
  try {
    if (editingId.value) {
      await coursesApi.update(editingId.value, form.value)
      message.success('编辑成功')
    }
    else {
      await coursesApi.create(form.value)
      message.success('创建成功')
    }
    showModal.value = false
    fetchCourses()
  }
  catch (e: any) {
    message.error(e?.message || '操作失败')
  }
  finally {
    saving.value = false
  }
}

function handleDelete(row: Course) {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除课程「${row.title}」吗？此操作不可恢复。`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await coursesApi.delete(row.id)
        message.success('删除成功')
        fetchCourses()
      }
      catch (e: any) {
        message.error(e?.message || '删除失败')
      }
    },
  })
}

const columns: DataTableColumns<Course> = [
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
          onClick: () => navigateTo(`/admin/courses/${row.id}`),
        },
        row.title,
      )
    },
  },
  {
    title: '描述',
    key: 'description',
    render(row) {
      const desc = row.description || '-'
      return h('span', desc.length > 50 ? desc.slice(0, 50) + '...' : desc)
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
    title: '成员数',
    key: 'members',
    width: 80,
    render(row) {
      return h('span', row.members?.length || 0)
    },
  },
  {
    title: '创建时间',
    key: 'createdAt',
    width: 160,
    render(row) {
      return h('span', row.createdAt ? dayjs(row.createdAt).format('YYYY-MM-DD HH:mm') : '-')
    },
  },
  {
    title: '操作',
    key: 'actions',
    width: 200,
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
                type: 'info',
                ghost: true,
                onClick: () => navigateTo(`/admin/courses/${row.id}`),
              },
              { default: () => '详情' },
            ),
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
.admin-courses {
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
