<template>
  <div v-if="loading" class="loading-center">
    <NSpin size="large" />
  </div>
  <div v-else-if="course" class="course-detail">
    <AdminViewBanner />
    <div class="course-header">
      <NH2 style="margin: 0">{{ course.name || course.title }}</NH2>
      <NText v-if="course.description" depth="3" style="font-size: 15px; margin-top: 8px">
        {{ course.description }}
      </NText>
      <div v-if="course.teacher" style="margin-top: 4px">
        <NText depth="3">教师：{{ course.teacher }}</NText>
      </div>
      <!-- 课程状态 -->
      <NTag v-if="courseStatus" :type="courseStatus.type" size="small" :bordered="false" style="margin-top: 8px">
        {{ courseStatus.label }}
      </NTag>
    </div>

    <NDivider />

    <NTabs v-model:value="activeTab" type="line" animated>
      <!-- 公告 -->
      <NTabPane name="notification" tab="公告">
        <div v-if="course.notification">
          <MarkdownView :content="course.notification" />
        </div>
        <NEmpty v-else description="暂无公告" />
      </NTabPane>

      <!-- 题目列表 -->
      <NTabPane name="problems" tab="题目">
        <div v-if="problemsLoading" class="loading-center">
          <NSpin />
        </div>
        <div v-else-if="problems.length === 0">
          <NEmpty description="课程暂无题目" />
        </div>
        <NList v-else bordered>
          <NListItem
            v-for="(problem, index) in problems"
            :key="problem.id"
            class="problem-item"
            @click="navigateTo(`/course/${courseId}/problems/${problem.id}`)"
          >
            <div class="problem-row">
              <span class="problem-index">{{ index + 1 }}</span>
              <NButton text type="primary">{{ problem.prefix }}{{ problem.logicId }}. {{ problem.title }}</NButton>
              <NSpace size="small">
                <NTag
                  v-for="tag in problem.tags"
                  :key="tag.id"
                  size="tiny"
                  type="info"
                  :bordered="false"
                >
                  {{ tag.name }}
                </NTag>
              </NSpace>
            </div>
          </NListItem>
        </NList>
      </NTabPane>

      <!-- 提交记录 -->
      <NTabPane name="submissions" tab="提交记录">
        <PaginatedTable
          :columns="submissionColumns"
          :data="(submissions as any)"
          :loading="submissionsLoading"
          :total="submissionsTotal"
          :page="submissionsPage"
          :page-size="submissionsPageSize"
          :row-key="(row: any) => row.id"
          @page-change="onSubmissionsPageChange"
        />
      </NTabPane>

      <!-- 排名 -->
      <NTabPane name="ranking" tab="排名">
        <NDataTable
          :columns="rankColumns"
          :data="rankData"
          :loading="rankLoading"
          :bordered="true"
          :row-key="(row: any) => row.userId"
        />
      </NTabPane>
    </NTabs>
  </div>
  <div v-else>
    <NResult status="404" title="课程不存在" />
  </div>
</template>

<script setup lang="ts">
import { h } from 'vue'
import type { DataTableColumns } from 'naive-ui'
import dayjs from 'dayjs'
import type { Problem, Submission } from '~/types'
import { LANGUAGE_LABEL, memoryToKB } from '~/types'
import type { Course, CourseRankItem } from '~/composables/api/courses'

definePageMeta({
  layout: 'default',
  middleware: 'auth',
})

const route = useRoute()
const courseId = computed(() => Number(route.params.id))

const coursesApi = useCoursesApi()
const problemsApi = useProblemsApi()

const course = ref<Course | null>(null)
const loading = ref(true)
const activeTab = ref('notification')

// 课程状态
const courseStatus = computed(() => {
  if (!course.value) return null
  const now = dayjs()
  const start = course.value.startTime ? dayjs(course.value.startTime) : null
  const end = course.value.endTime ? dayjs(course.value.endTime) : null
  if (!start || !end) return null
  if (now.isBefore(start)) return { label: '未开始', type: 'info' as const }
  if (now.isAfter(end)) return { label: '已结束', type: 'default' as const }
  return { label: '进行中', type: 'success' as const }
})

// 课程题目
const problems = ref<Problem[]>([])
const problemsLoading = ref(false)

async function fetchProblems() {
  if (!course.value?.problems?.length) return
  problemsLoading.value = true
  try {
    const items = await Promise.all(
      (course.value.problems as unknown as number[]).map(async (id: number) => {
        const res = await problemsApi.get(id)
        return (res as any).data ?? res
      }),
    )
    problems.value = items
  }
  catch (e) {
    console.error(e)
  }
  finally {
    problemsLoading.value = false
  }
}

// 提交记录
const submissions = ref<Submission[]>([])
const submissionsLoading = ref(false)
const submissionsPage = ref(1)
const submissionsPageSize = ref(20)
const submissionsTotal = ref(0)

async function fetchSubmissions() {
  submissionsLoading.value = true
  try {
    const res = await coursesApi.getSubmissions(courseId.value, {
      page: submissionsPage.value,
      perPage: submissionsPageSize.value,
    })
    const data = (res as any).data ?? res
    submissions.value = (data as any).items ?? (Array.isArray(data) ? data : [])
    submissionsTotal.value = (data as any).total ?? submissions.value.length
  }
  catch (e) {
    console.error(e)
  }
  finally {
    submissionsLoading.value = false
  }
}

function onSubmissionsPageChange({ page: p, pageSize: ps }: { page: number; pageSize: number }) {
  submissionsPage.value = p
  submissionsPageSize.value = ps
  fetchSubmissions()
}

const submissionColumns: DataTableColumns<Submission> = [
  {
    title: 'ID',
    key: 'id',
    width: 80,
    render(row) {
      return h(
        'a',
        {
          style: 'color: #2080f0; cursor: pointer;',
          onClick: () => navigateTo(`/submissions/${row.id}`),
        },
        `#${row.id}`,
      )
    },
  },
  {
    title: '题目',
    key: 'problem',
    render(row) {
      return h('span', row.problem ? `${row.problem.prefix || ''}${row.problem.logicId || ''}. ${row.problem.title}` : '-')
    },
  },
  {
    title: '语言',
    key: 'language',
    width: 100,
    render(row) { return LANGUAGE_LABEL[row.language] ?? String(row.language) },
  },
  {
    title: '状态',
    key: 'status',
    width: 120,
    render(row) {
      return h(resolveComponent('StatusTag'), { status: row.status })
    },
  },
  {
    title: '时间',
    key: 'time',
    width: 100,
    render(row) { return row.time != null ? `${row.time}ms` : '-' },
  },
  {
    title: '内存',
    key: 'memory',
    width: 100,
    render(row) { return memoryToKB(row.memory) },
  },
  {
    title: '提交时间',
    key: 'createdAt',
    width: 180,
    render(row) {
      return h('span', dayjs(row.createdAt).format('YYYY-MM-DD HH:mm'))
    },
  },
]

// 排名
const rankData = ref<CourseRankItem[]>([])
const rankLoading = ref(false)

async function fetchRanking() {
  rankLoading.value = true
  try {
    const res = await coursesApi.getRanking(courseId.value)
    const data = (res as any).data ?? res
    rankData.value = Array.isArray(data) ? data : (data as any).items ?? []
  }
  catch (e) {
    console.error(e)
  }
  finally {
    rankLoading.value = false
  }
}

const rankColumns: DataTableColumns<CourseRankItem> = [
  {
    title: '排名',
    key: 'rank',
    width: 80,
    render(row) { return h('span', { style: 'font-weight: 600;' }, `#${row.rank}`) },
  },
  {
    title: '用户名',
    key: 'username',
    render(row) {
      return h('a', { style: 'color: #2080f0; cursor: pointer;', onClick: () => navigateTo(`/users/${row.userId}`) }, row.username)
    },
  },
  {
    title: '得分',
    key: 'score',
    width: 100,
    render(row) { return h('span', { style: 'font-weight: 600; color: #18a058;' }, String(row.score)) },
  },
]

// Watch tab change to load data lazily
watch(activeTab, (tab) => {
  if (tab === 'submissions' && submissions.value.length === 0) {
    fetchSubmissions()
  }
  if (tab === 'ranking' && rankData.value.length === 0) {
    fetchRanking()
  }
  if (tab === 'problems' && problems.value.length === 0) {
    fetchProblems()
  }
})

onMounted(async () => {
  try {
    const res = await coursesApi.get(courseId.value)
    course.value = (res as any).data ?? res
    await fetchProblems()
  }
  catch (e) {
    console.error(e)
  }
  finally {
    loading.value = false
  }
})

useHead(computed(() => ({ title: (course.value?.name || course.value?.title) ? `${course.value?.name || course.value?.title} — Leverage OJ` : '课程 — Leverage OJ' })))
</script>

<style scoped>
.loading-center {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.course-detail {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.course-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.problem-item {
  cursor: pointer;
}

.problem-item:hover {
  background: #f5f5f5;
}

.problem-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.problem-index {
  font-weight: 600;
  color: #999;
  min-width: 24px;
  font-size: 13px;
}
</style>
