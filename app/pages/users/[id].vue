<template>
  <div v-if="loading" class="loading-center">
    <NSpin size="large" />
  </div>
  <div v-else-if="user" class="user-page">
    <!-- 用户信息卡片 -->
    <NCard class="user-card">
      <div class="user-header">
        <NAvatar :size="64" round style="background: #2080f0; font-size: 28px">
          {{ user.username.charAt(0).toUpperCase() }}
        </NAvatar>
        <div class="user-info">
          <NH2 style="margin: 0">{{ user.username }}</NH2>
          <NTag :type="roleTagType" size="small">{{ roleLabel }}</NTag>
        </div>
      </div>

      <NDivider />

      <NDescriptions :column="2" bordered>
        <NDescriptionsItem label="用户名">{{ user.username }}</NDescriptionsItem>
        <NDescriptionsItem label="角色">{{ roleLabel }}</NDescriptionsItem>
        <NDescriptionsItem v-if="user.studentId" label="学号">{{ user.studentId }}</NDescriptionsItem>
        <NDescriptionsItem v-if="user.email" label="邮箱">{{ user.email }}</NDescriptionsItem>
        <NDescriptionsItem label="注册时间">{{ formatDate(user.createdAt) }}</NDescriptionsItem>
        <NDescriptionsItem label="通过 / 提交">
          <NSpace>
            <NTag type="success">AC: {{ user.accepts ?? 0 }}</NTag>
            <NTag type="default">总: {{ user.submits ?? 0 }}</NTag>
          </NSpace>
        </NDescriptionsItem>
      </NDescriptions>
    </NCard>

    <!-- 做题统计 -->
    <NCard title="做题统计" class="stats-card">
      <div class="stats-grid">
        <div v-for="stat in statusStats" :key="stat.label" class="stat-item">
          <NStatistic :label="stat.label" :value="stat.count">
            <template #prefix>
              <NTag :type="stat.type" size="small" :bordered="false">{{ stat.label }}</NTag>
            </template>
          </NStatistic>
        </div>
      </div>
    </NCard>

    <!-- 最近提交记录 -->
    <NCard title="最近提交">
      <NDataTable
        :columns="submissionColumns"
        :data="submissions"
        :loading="submissionsLoading"
        :pagination="{ pageSize: 10 }"
        size="small"
      />
    </NCard>
  </div>
  <div v-else class="loading-center">
    <NResult status="404" title="用户不存在" />
  </div>
</template>

<script setup lang="ts">
import { h } from 'vue'
import type { DataTableColumns } from 'naive-ui'
import { NButton, NTag } from 'naive-ui'
import { STATUS_LABEL, STATUS_COLOR, type Submission } from '~/types'
import dayjs from 'dayjs'

definePageMeta({
  layout: 'default',
  middleware: 'auth',
})

const route = useRoute()
const userId = computed(() => Number(route.params.id))
const usersApi = useUsersApi()

const user = ref<any>(null)
const loading = ref(true)
const submissions = ref<Submission[]>([])
const submissionsLoading = ref(false)

const roleLabel = computed(() => {
  const map: Record<string, string> = {
    sa: '超级管理员',
    admin: '管理员',
    supervisor: '督导',
    user: '普通用户',
    guest: '访客',
  }
  return map[user.value?.role] ?? user.value?.role ?? '-'
})

const roleTagType = computed((): 'default' | 'info' | 'success' | 'warning' | 'error' => {
  const map: Record<string, 'default' | 'info' | 'success' | 'warning' | 'error'> = {
    sa: 'error',
    admin: 'warning',
    supervisor: 'info',
    user: 'default',
    guest: 'default',
  }
  return map[user.value?.role] ?? 'default'
})

const statusStats = computed(() => {
  const counts: Record<number, number> = {}
  for (const s of submissions.value) {
    counts[s.status] = (counts[s.status] ?? 0) + 1
  }
  return [
    { label: 'AC', count: counts[2] ?? 0, type: 'success' as const },
    { label: '答案错误', count: counts[3] ?? 0, type: 'error' as const },
    { label: '超时', count: counts[4] ?? 0, type: 'warning' as const },
    { label: '内存超限', count: counts[5] ?? 0, type: 'warning' as const },
    { label: '运行错误', count: counts[6] ?? 0, type: 'error' as const },
    { label: '编译错误', count: counts[7] ?? 0, type: 'error' as const },
  ]
})

const submissionColumns: DataTableColumns = [
  {
    title: 'ID',
    key: 'id',
    width: 80,
    render: (row: any) =>
      h(NButton, { text: true, type: 'primary', onClick: () => navigateTo(`/submissions/${row.id}`) }, () => `#${row.id}`),
  },
  {
    title: '题目',
    key: 'problem',
    render: (row: any) => {
      if (!row.problem) return '-'
      return h(NButton, { text: true, type: 'primary', onClick: () => navigateTo(`/problems/${row.problem.id}`) }, () => row.problem.title)
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
    render: (row: any) =>
      h(NTag, { type: STATUS_COLOR[row.status] as any, size: 'small', bordered: false }, () => STATUS_LABEL[row.status] ?? '-'),
  },
  {
    title: '提交时间',
    key: 'createdAt',
    render: (row: any) => formatDate(row.createdAt),
  },
]

function formatDate(date: string) {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

onMounted(async () => {
  try {
    const res = await usersApi.get(userId.value)
    user.value = res.data ?? res
  }
  catch {
    user.value = null
  }
  finally {
    loading.value = false
  }

  // 加载提交记录
  submissionsLoading.value = true
  try {
    const res = await usersApi.getSubmissions(userId.value, { page: 1, perPage: 20 })
    const data = res.data ?? res
    submissions.value = data.items ?? data
  }
  catch {
    submissions.value = []
  }
  finally {
    submissionsLoading.value = false
  }
})
</script>

<style scoped>
.loading-center {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.user-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 900px;
  margin: 0 auto;
}

.user-card {
  width: 100%;
}

.user-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 8px;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stats-card {
  width: 100%;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.stat-item {
  text-align: center;
  padding: 8px;
  border-radius: 8px;
  background: #f8f9fa;
}
</style>
