<template>
  <div class="admin-course-detail">
    <div class="page-header">
      <NSpace align="center">
        <NButton text @click="navigateTo('/admin/courses')">
          ← 返回课程列表
        </NButton>
        <NH2 style="margin: 0">
          {{ course?.title || '课程详情' }}
        </NH2>
      </NSpace>
    </div>

    <NSpin :show="loading">
      <NTabs v-model:value="activeTab" type="line" animated>
        <!-- ===== 基本信息 Tab ===== -->
        <NTabPane name="info" tab="基本信息">
          <NCard v-if="course" style="max-width: 600px; margin-top: 16px">
            <NDescriptions :column="1" label-placement="left" bordered>
              <NDescriptionsItem label="ID">{{ course.id }}</NDescriptionsItem>
              <NDescriptionsItem label="标题">{{ course.title }}</NDescriptionsItem>
              <NDescriptionsItem label="描述">{{ course.description || '-' }}</NDescriptionsItem>
              <NDescriptionsItem label="创建时间">{{ fmtTime(course.createdAt) }}</NDescriptionsItem>
              <NDescriptionsItem label="题目数">{{ course.problems?.length || 0 }}</NDescriptionsItem>
              <NDescriptionsItem label="成员数">{{ course.members?.length || 0 }}</NDescriptionsItem>
            </NDescriptions>
            <div style="margin-top: 16px">
              <NButton type="primary" @click="openEditModal">编辑课程</NButton>
            </div>
          </NCard>
        </NTabPane>

        <!-- ===== 题目管理 Tab ===== -->
        <NTabPane name="problems" tab="题目管理">
          <div style="margin-top: 16px">
            <NSpace style="margin-bottom: 12px">
              <NInputNumber v-model:value="addProblemId" placeholder="输入题目 ID" style="width: 160px" />
              <NButton type="primary" :loading="addingProblem" @click="handleAddProblem">添加题目</NButton>
            </NSpace>
            <NDataTable
              :columns="problemColumns"
              :data="courseProblems"
              :loading="loading"
              :row-key="(row: any) => row.id || row"
              size="small"
            />
          </div>
        </NTabPane>

        <!-- ===== 成员管理 Tab ===== -->
        <NTabPane name="members" tab="成员管理">
          <div style="margin-top: 16px">
            <NSpace style="margin-bottom: 12px">
              <NInputNumber v-model:value="addUserId" placeholder="输入用户 ID" style="width: 160px" />
              <NButton type="primary" :loading="addingMember" @click="handleAddMember">添加成员</NButton>
              <NUpload
                :custom-request="handleImportMembers"
                accept=".csv,.txt"
                :show-file-list="false"
              >
                <NButton>导入成员 (CSV)</NButton>
              </NUpload>
            </NSpace>
            <NDataTable
              :columns="memberColumns"
              :data="courseMembers"
              :loading="membersLoading"
              :row-key="(row: any) => row.id || row"
              size="small"
            />
          </div>
        </NTabPane>

        <!-- ===== 提交记录 Tab ===== -->
        <NTabPane name="submissions" tab="提交记录">
          <div style="margin-top: 16px">
            <NDataTable
              :columns="submissionColumns"
              :data="submissions"
              :loading="submissionsLoading"
              :row-key="(row: any) => row.id"
              size="small"
            />
            <NPagination
              v-model:page="submissionPage"
              :page-count="submissionPageCount"
              style="margin-top: 12px; justify-content: flex-end"
              @update:page="fetchSubmissions"
            />
          </div>
        </NTabPane>

        <!-- ===== 排行榜 Tab ===== -->
        <NTabPane name="ranking" tab="排行榜">
          <div style="margin-top: 16px">
            <NButton style="margin-bottom: 12px" @click="fetchRanking">刷新</NButton>
            <NDataTable
              :columns="rankingColumns"
              :data="ranking"
              :loading="rankingLoading"
              :row-key="(row: any) => row.userId"
              size="small"
            />
          </div>
        </NTabPane>
      </NTabs>
    </NSpin>

    <!-- 编辑弹窗 -->
    <NModal v-model:show="showEditModal" title="编辑课程" preset="dialog" style="width: 560px">
      <NForm :model="editForm" label-placement="left" label-width="90px" style="margin-top: 12px">
        <NFormItem label="标题" required>
          <NInput v-model:value="editForm.title" placeholder="输入课程标题" />
        </NFormItem>
        <NFormItem label="描述">
          <NInput v-model:value="editForm.description" type="textarea" placeholder="输入课程描述" :rows="4" />
        </NFormItem>
      </NForm>
      <template #action>
        <NSpace justify="end">
          <NButton @click="showEditModal = false">取消</NButton>
          <NButton type="primary" :loading="saving" @click="handleSaveEdit">保存</NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>

<script setup lang="ts">
import { h } from 'vue'
import { NButton, NSpace, NTag, useMessage, useDialog } from 'naive-ui'
import type { DataTableColumns, UploadCustomRequestOptions } from 'naive-ui'
import dayjs from 'dayjs'
import { STATUS_LABEL, STATUS_COLOR } from '~/types'
import type { Course, CourseRankItem } from '~/composables/api/courses'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const route = useRoute()
const courseId = Number(route.params.id)
const coursesApi = useCoursesApi()
const message = useMessage()
const dialog = useDialog()

// ── 基本信息 ──
const course = ref<Course | null>(null)
const loading = ref(false)
const activeTab = ref('info')

function fmtTime(t?: string) {
  return t ? dayjs(t).format('YYYY-MM-DD HH:mm') : '-'
}

async function fetchCourse() {
  loading.value = true
  try {
    const res = await coursesApi.get(courseId)
    course.value = res.data
  }
  catch (e) { console.error(e) }
  finally { loading.value = false }
}

onMounted(fetchCourse)

// ── 编辑弹窗 ──
const showEditModal = ref(false)
const saving = ref(false)
const editForm = ref({ title: '', description: '' })

function openEditModal() {
  if (!course.value) return
  editForm.value = {
    title: course.value.title,
    description: course.value.description || '',
  }
  showEditModal.value = true
}

async function handleSaveEdit() {
  saving.value = true
  try {
    await coursesApi.update(courseId, editForm.value)
    message.success('更新成功')
    showEditModal.value = false
    fetchCourse()
  }
  catch (e: any) { message.error(e?.message || '更新失败') }
  finally { saving.value = false }
}

// ── 题目管理 ──
const addProblemId = ref<number | null>(null)
const addingProblem = ref(false)

// course.problems 是 problem id 列表，转成对象数组用于表格
const courseProblems = computed(() => {
  const probs = course.value?.problems || []
  return probs.map((p: any) => typeof p === 'object' ? p : { id: p })
})

async function handleAddProblem() {
  if (!addProblemId.value) return
  addingProblem.value = true
  try {
    await coursesApi.addProblem(courseId, addProblemId.value)
    message.success('添加成功')
    addProblemId.value = null
    fetchCourse()
  }
  catch (e: any) { message.error(e?.message || '添加失败') }
  finally { addingProblem.value = false }
}

async function handleRemoveProblem(problemId: number) {
  dialog.warning({
    title: '确认删除',
    content: '确定要从课程中移除该题目吗？',
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await coursesApi.removeProblem(courseId, problemId)
        message.success('删除成功')
        fetchCourse()
      }
      catch (e: any) { message.error(e?.message || '删除失败') }
    },
  })
}

const problemColumns: DataTableColumns<any> = [
  { title: 'ID', key: 'id', width: 100 },
  { title: '标题', key: 'title', render: r => r.title || '-' },
  {
    title: '操作',
    key: 'actions',
    width: 100,
    render(row) {
      return h(NButton, {
        size: 'small', type: 'error', ghost: true,
        onClick: () => handleRemoveProblem(row.id),
      }, { default: () => '移除' })
    },
  },
]

// ── 成员管理 ──
const courseMembers = ref<any[]>([])
const membersLoading = ref(false)
const addUserId = ref<number | null>(null)
const addingMember = ref(false)

async function fetchMembers() {
  membersLoading.value = true
  try {
    // members 在 course 详情中，刷新课程数据
    await fetchCourse()
    const members = course.value?.members || []
    courseMembers.value = members.map((m: any) => typeof m === 'object' ? m : { id: m })
  }
  catch (e) { console.error(e) }
  finally { membersLoading.value = false }
}

async function handleAddMember() {
  if (!addUserId.value) return
  addingMember.value = true
  try {
    await coursesApi.addStudents(courseId, [addUserId.value])
    message.success('添加成功')
    addUserId.value = null
    fetchMembers()
  }
  catch (e: any) { message.error(e?.message || '添加失败') }
  finally { addingMember.value = false }
}

async function handleRemoveMember(userId: number) {
  dialog.warning({
    title: '确认移除',
    content: '确定要移除该成员吗？',
    positiveText: '移除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await coursesApi.removeStudent(courseId, userId)
        message.success('移除成功')
        fetchMembers()
      }
      catch (e: any) { message.error(e?.message || '移除失败') }
    },
  })
}

async function handleImportMembers(options: UploadCustomRequestOptions) {
  const file = options.file.file
  if (!file) return
  try {
    const text = await file.text()
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
    const userIds = lines.map(l => Number(l.split(',')[0].trim())).filter(id => !isNaN(id) && id > 0)
    await coursesApi.addStudents(courseId, userIds)
    message.success(`导入 ${userIds.length} 个成员成功`)
    fetchMembers()
  }
  catch (e: any) { message.error(e?.message || '导入失败') }
  options.onFinish()
}

const memberColumns: DataTableColumns<any> = [
  { title: 'ID', key: 'id', width: 100 },
  { title: '用户名', key: 'username', render: r => r.username || '-' },
  { title: '学号', key: 'studentId', render: r => r.studentId || '-' },
  {
    title: '操作',
    key: 'actions',
    width: 100,
    render(row) {
      return h(NButton, {
        size: 'small', type: 'error', ghost: true,
        onClick: () => handleRemoveMember(row.id),
      }, { default: () => '移除' })
    },
  },
]

// ── 提交记录 ──
const submissions = ref<any[]>([])
const submissionsLoading = ref(false)
const submissionPage = ref(1)
const submissionPageCount = ref(1)
const submissionPerPage = 20

async function fetchSubmissions() {
  submissionsLoading.value = true
  try {
    const res = await coursesApi.getSubmissions(courseId, {
      page: submissionPage.value,
      perPage: submissionPerPage,
    })
    const data = res.data as any
    submissions.value = data?.items || data || []
    if (data?.total) {
      submissionPageCount.value = Math.ceil(data.total / submissionPerPage)
    }
  }
  catch (e) { console.error(e) }
  finally { submissionsLoading.value = false }
}

const submissionColumns: DataTableColumns<any> = [
  { title: 'ID', key: 'id', width: 70 },
  { title: '用户', key: 'user', render: r => r.user?.username || r.userId },
  { title: '题目', key: 'problem', render: r => r.problem?.title || r.problemId },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render: r => h(NTag, { type: STATUS_COLOR[r.status] as any || 'default', size: 'small' },
      { default: () => STATUS_LABEL[r.status] || r.status }),
  },
  {
    title: '时间',
    key: 'createdAt',
    width: 160,
    render: r => dayjs(r.createdAt).format('YYYY-MM-DD HH:mm'),
  },
]

// ── 排行榜 ──
const ranking = ref<CourseRankItem[]>([])
const rankingLoading = ref(false)

async function fetchRanking() {
  rankingLoading.value = true
  try {
    const res = await coursesApi.getRanking(courseId)
    ranking.value = Array.isArray(res.data) ? res.data : []
  }
  catch (e) { console.error(e) }
  finally { rankingLoading.value = false }
}

const rankingColumns: DataTableColumns<CourseRankItem> = [
  { title: '排名', key: 'rank', width: 80 },
  { title: '用户', key: 'username' },
  { title: '分数', key: 'score', width: 100 },
]

// ── Tab 切换时懒加载 ──
watch(activeTab, (tab) => {
  if (tab === 'members' && !courseMembers.value.length) fetchMembers()
  if (tab === 'submissions' && !submissions.value.length) fetchSubmissions()
  if (tab === 'ranking' && !ranking.value.length) fetchRanking()
})

useHead({ title: '课程编辑' })
</script>

<style scoped>
.admin-course-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 12px;
}
</style>
