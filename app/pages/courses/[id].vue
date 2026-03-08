<template>
  <div v-if="loading" class="loading-center">
    <NSpin size="large" />
  </div>
  <div v-else-if="course" class="course-detail">
    <div class="course-header">
      <NH2 style="margin: 0">{{ course.title }}</NH2>
      <NText v-if="course.description" depth="3" style="font-size: 15px; margin-top: 8px">
        {{ course.description }}
      </NText>
    </div>

    <NDivider />

    <NTabs v-model:value="activeTab" type="line" animated>
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
            @click="navigateTo(`/problems/${problem.id}`)"
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
import type { Course } from '~/composables/api/courses'

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
const activeTab = ref('problems')

// 课程题目
const problems = ref<Problem[]>([])
const problemsLoading = ref(false)

async function fetchProblems() {
  if (!course.value?.problems?.length) return
  problemsLoading.value = true
  try {
    const items = await Promise.all(
      (course.value.problems as unknown as number[]).map((id: number) => problemsApi.get(id)),
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
    const res: any = await coursesApi.getSubmissions(courseId.value, {
      page: submissionsPage.value,
      perPage: submissionsPageSize.value,
    })
    submissions.value = res?.items || []
    submissionsTotal.value = res?.total || 0
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
    title: '提交时间',
    key: 'createdAt',
    width: 180,
    render(row) {
      return h('span', dayjs(row.createdAt).format('YYYY-MM-DD HH:mm'))
    },
  },
]

// Watch tab change to load submissions lazily
watch(activeTab, (tab) => {
  if (tab === 'submissions' && submissions.value.length === 0) {
    fetchSubmissions()
  }
})

onMounted(async () => {
  try {
    course.value = await coursesApi.get(courseId.value)
    await fetchProblems()
  }
  catch (e) {
    console.error(e)
  }
  finally {
    loading.value = false
  }
})
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
