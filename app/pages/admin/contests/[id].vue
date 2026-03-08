<template>
  <div class="admin-contest-detail">
    <div class="page-header">
      <NSpace align="center">
        <NButton text @click="navigateTo('/admin/contests')">
          ← 返回列表
        </NButton>
        <NH2 style="margin: 0">
          {{ contest?.title || (isExam ? '考试详情' : '竞赛详情') }}
        </NH2>
      </NSpace>
    </div>

    <NSpin :show="loading">
      <NTabs v-model:value="activeTab" type="line" animated>
        <!-- ===== 基本信息 Tab ===== -->
        <NTabPane name="info" :tab="isExam ? '考试信息' : '基本信息'">
          <NCard v-if="contest" style="max-width: 600px; margin-top: 16px">
            <NDescriptions :column="1" label-placement="left" bordered>
              <NDescriptionsItem label="ID">{{ contest.id }}</NDescriptionsItem>
              <NDescriptionsItem :label="isExam ? '考试名称' : '标题'">{{ contest.title }}</NDescriptionsItem>
              <NDescriptionsItem label="类型">
                <NTag :type="typeColorMap[contest.type?.toLowerCase()] || 'default'" size="small">
                  {{ typeLabel[contest.type?.toLowerCase()] || contest.type?.toUpperCase() || '-' }}
                </NTag>
              </NDescriptionsItem>
              <NDescriptionsItem label="开始时间">{{ fmtTime(contest.startTime) }}</NDescriptionsItem>
              <NDescriptionsItem label="结束时间">{{ fmtTime(contest.endTime) }}</NDescriptionsItem>
              <NDescriptionsItem label="题目数">{{ contest.problems?.length || 0 }}</NDescriptionsItem>
            </NDescriptions>
            <div style="margin-top: 16px">
              <NButton type="primary" @click="openEditModal">{{ isExam ? '编辑考试' : '编辑竞赛' }}</NButton>
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
              :data="contest?.problems || []"
              :row-key="(row: any) => row.id"
              size="small"
            />
          </div>
        </NTabPane>

        <!-- ===== 用户管理 Tab ===== -->
        <NTabPane name="users" tab="用户管理">
          <div style="margin-top: 16px">
            <NSpace style="margin-bottom: 12px">
              <NButton type="primary" @click="fetchContestUsers">刷新</NButton>
              <NUpload
                :custom-request="handleImportUsers"
                accept=".csv,.txt"
                :show-file-list="false"
              >
                <NButton>导入用户 (CSV)</NButton>
              </NUpload>
            </NSpace>
            <NDataTable
              :columns="userColumns"
              :data="contestUsers"
              :loading="usersLoading"
              :row-key="(row: any) => row.id"
              size="small"
            />
          </div>
        </NTabPane>

        <!-- ===== 气球 Tab ===== -->
        <NTabPane name="balloons" tab="气球">
          <div style="margin-top: 16px">
            <NButton style="margin-bottom: 12px" @click="fetchBalloons">刷新</NButton>
            <NDataTable
              :columns="balloonColumns"
              :data="balloons"
              :loading="balloonsLoading"
              :row-key="(row: any) => row.id"
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
        <NTabPane name="scoreboard" tab="排行榜">
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
    <NModal v-model:show="showEditModal" :title="isExam ? '编辑考试' : '编辑竞赛'" preset="dialog" style="width: 560px">
      <NForm :model="editForm" label-placement="left" label-width="90px" style="margin-top: 12px">
        <NFormItem label="标题" required>
          <NInput v-model:value="editForm.title" placeholder="输入竞赛标题" />
        </NFormItem>
        <NFormItem label="类型">
          <NSelect v-model:value="editForm.type" :options="typeOptions" />
        </NFormItem>
        <NFormItem label="开始时间" required>
          <NDatePicker
            v-model:value="editStartMs"
            type="datetime"
            clearable
            style="width: 100%"
            @update:value="v => editForm.startTime = v ? dayjs(v).toISOString() : ''"
          />
        </NFormItem>
        <NFormItem label="结束时间" required>
          <NDatePicker
            v-model:value="editEndMs"
            type="datetime"
            clearable
            style="width: 100%"
            @update:value="v => editForm.endTime = v ? dayjs(v).toISOString() : ''"
          />
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
import type { Contest, RankItem } from '~/types'
import { STATUS_LABEL, STATUS_COLOR } from '~/types'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const route = useRoute()
const contestId = Number(route.params.id)
const contestsApi = useContestsApi()
const message = useMessage()
const dialog = useDialog()

// ── 基本信息 ──
const contest = ref<Contest | null>(null)
const loading = ref(false)
const activeTab = ref('info')

const typeColorMap: Record<string, any> = {
  contest: 'info',
  exam: 'warning',
  icpc: 'info',
  ioi: 'success',
  oi: 'primary',
  cf: 'error',
}

const typeLabel: Record<string, string> = {
  contest: '竞赛',
  exam: '考试',
  icpc: 'ICPC',
  ioi: 'IOI',
  oi: 'OI',
  cf: 'CF',
}

const typeOptions = [
  { label: '竞赛 (Contest)', value: 'contest' },
  { label: '考试 (Exam)', value: 'exam' },
  { label: 'ICPC', value: 'icpc' },
  { label: 'IOI', value: 'ioi' },
  { label: 'OI', value: 'oi' },
  { label: 'Codeforces', value: 'cf' },
]

const isExam = computed(() => contest.value?.type === 'exam')

function fmtTime(t?: string) {
  return t ? dayjs(t).format('YYYY-MM-DD HH:mm') : '-'
}

async function fetchContest() {
  loading.value = true
  try {
    const res = await contestsApi.get(contestId)
    contest.value = res.data
  }
  catch (e) { console.error(e) }
  finally { loading.value = false }
}

onMounted(fetchContest)

// ── 编辑弹窗 ──
const showEditModal = ref(false)
const saving = ref(false)
const editStartMs = ref<number | null>(null)
const editEndMs = ref<number | null>(null)
const editForm = ref({ title: '', type: 'icpc', startTime: '', endTime: '' })

function openEditModal() {
  if (!contest.value) return
  editForm.value = {
    title: contest.value.title,
    type: contest.value.type || 'icpc',
    startTime: contest.value.startTime,
    endTime: contest.value.endTime,
  }
  editStartMs.value = dayjs(contest.value.startTime).valueOf()
  editEndMs.value = dayjs(contest.value.endTime).valueOf()
  showEditModal.value = true
}

async function handleSaveEdit() {
  saving.value = true
  try {
    await contestsApi.update(contestId, editForm.value)
    message.success('更新成功')
    showEditModal.value = false
    fetchContest()
  }
  catch (e: any) { message.error(e?.message || '更新失败') }
  finally { saving.value = false }
}

// ── 题目管理 ──
const addProblemId = ref<number | null>(null)
const addingProblem = ref(false)

async function handleAddProblem() {
  if (!addProblemId.value) return
  addingProblem.value = true
  try {
    // 通过更新竞赛的 problemIds 来添加题目
    const currentIds = contest.value?.problems?.map(p => p.id) || []
    if (currentIds.includes(addProblemId.value)) {
      message.warning('该题目已在竞赛中')
      return
    }
    await contestsApi.update(contestId, { problemIds: [...currentIds, addProblemId.value] })
    message.success('添加成功')
    addProblemId.value = null
    fetchContest()
  }
  catch (e: any) { message.error(e?.message || '添加失败') }
  finally { addingProblem.value = false }
}

async function handleRemoveProblem(problemId: number) {
  dialog.warning({
    title: '确认删除',
    content: '确定要从竞赛中移除该题目吗？',
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        const currentIds = contest.value?.problems?.map(p => p.id).filter(id => id !== problemId) || []
        await contestsApi.update(contestId, { problemIds: currentIds })
        message.success('删除成功')
        fetchContest()
      }
      catch (e: any) { message.error(e?.message || '删除失败') }
    },
  })
}

const problemColumns: DataTableColumns<any> = [
  { title: 'ID', key: 'id', width: 70 },
  { title: '标题', key: 'title' },
  { title: '题号', key: 'prefix', width: 80 },
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

// ── 用户管理 ──
const contestUsers = ref<any[]>([])
const usersLoading = ref(false)

async function fetchContestUsers() {
  usersLoading.value = true
  try {
    const res = await contestsApi.getContestUsers(contestId)
    contestUsers.value = Array.isArray(res.data) ? res.data : []
  }
  catch (e) { console.error(e) }
  finally { usersLoading.value = false }
}

async function handleRemoveUser(userId: number) {
  dialog.warning({
    title: '确认移除',
    content: '确定要移除该参赛用户吗？',
    positiveText: '移除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await contestsApi.removeContestUser(contestId, userId)
        message.success('移除成功')
        fetchContestUsers()
      }
      catch (e: any) { message.error(e?.message || '移除失败') }
    },
  })
}

async function handleImportUsers(options: UploadCustomRequestOptions) {
  const file = options.file.file
  if (!file) return
  try {
    const text = await file.text()
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
    const users = lines.map((line) => {
      const [username, studentId] = line.split(',').map(s => s.trim())
      return { username, studentId }
    }).filter(u => u.username)
    await contestsApi.importContestUsers(contestId, users)
    message.success(`导入 ${users.length} 个用户成功`)
    fetchContestUsers()
  }
  catch (e: any) { message.error(e?.message || '导入失败') }
  options.onFinish()
}

const userColumns: DataTableColumns<any> = [
  { title: 'ID', key: 'id', width: 70 },
  { title: '用户名', key: 'username' },
  { title: '学号', key: 'studentId', render: r => r.studentId || '-' },
  { title: '邮箱', key: 'email', render: r => r.email || '-' },
  {
    title: '操作',
    key: 'actions',
    width: 100,
    render(row) {
      return h(NButton, {
        size: 'small', type: 'error', ghost: true,
        onClick: () => handleRemoveUser(row.id),
      }, { default: () => '移除' })
    },
  },
]

// ── 气球 ──
const balloons = ref<any[]>([])
const balloonsLoading = ref(false)

async function fetchBalloons() {
  balloonsLoading.value = true
  try {
    const res = await contestsApi.getBalloons(contestId)
    balloons.value = Array.isArray(res.data) ? res.data : []
  }
  catch (e) { console.error(e) }
  finally { balloonsLoading.value = false }
}

async function handleMarkDelivered(bid: number) {
  try {
    await contestsApi.markBalloonDelivered(contestId, bid)
    message.success('已标记送达')
    fetchBalloons()
  }
  catch (e: any) { message.error(e?.message || '操作失败') }
}

const balloonColumns: DataTableColumns<any> = [
  { title: 'ID', key: 'id', width: 70 },
  { title: '用户', key: 'username', render: r => r.username || r.userId },
  { title: '题目', key: 'problemLabel', render: r => r.problemLabel || r.problemId },
  {
    title: '状态',
    key: 'delivered',
    width: 100,
    render: r => h(NTag, { type: r.delivered ? 'success' : 'warning', size: 'small' },
      { default: () => r.delivered ? '已送达' : '待送达' }),
  },
  {
    title: '操作',
    key: 'actions',
    width: 120,
    render(row) {
      if (row.delivered) return h('span', '-')
      return h(NButton, {
        size: 'small', type: 'primary', ghost: true,
        onClick: () => handleMarkDelivered(row.id),
      }, { default: () => '标记送达' })
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
    const res = await contestsApi.getContestSubmissions(contestId, {
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
const ranking = ref<RankItem[]>([])
const rankingLoading = ref(false)

async function fetchRanking() {
  rankingLoading.value = true
  try {
    const res = await contestsApi.getRanking(contestId, 1, 200)
    ranking.value = Array.isArray(res.data) ? res.data : []
  }
  catch (e) { console.error(e) }
  finally { rankingLoading.value = false }
}

const rankingColumns: DataTableColumns<RankItem> = [
  { title: '排名', key: 'rank', width: 80 },
  { title: '用户', key: 'username' },
  { title: '分数', key: 'score', width: 100 },
]

// ── Tab 切换时懒加载 ──
watch(activeTab, (tab) => {
  if (tab === 'users' && !contestUsers.value.length) fetchContestUsers()
  if (tab === 'balloons' && !balloons.value.length) fetchBalloons()
  if (tab === 'submissions' && !submissions.value.length) fetchSubmissions()
  if (tab === 'scoreboard' && !ranking.value.length) fetchRanking()
})
</script>

<style scoped>
.admin-contest-detail {
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
