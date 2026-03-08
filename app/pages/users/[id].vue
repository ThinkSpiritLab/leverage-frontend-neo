<template>
  <div v-if="loading" class="loading-center">
    <NSpin size="large" />
  </div>
  <div v-else-if="user" class="user-page">
    <!-- 用户信息卡片 -->
    <NCard class="user-card">
      <div class="user-header">
        <NAvatar :size="72" round style="background: #2080f0; font-size: 32px; flex-shrink: 0">
          {{ user.username.charAt(0).toUpperCase() }}
        </NAvatar>
        <div class="user-info">
          <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap">
            <NH2 style="margin: 0">{{ user.username }}</NH2>
            <NTag :type="roleTagType" size="small">{{ roleLabel }}</NTag>
          </div>
          <NSpace size="small" style="margin-top: 6px">
            <NText depth="3" style="font-size: 13px">注册于 {{ formatDate(user.createdAt) }}</NText>
            <NText v-if="user.studentId" depth="3" style="font-size: 13px">· 学号 {{ user.studentId }}</NText>
            <NText v-if="user.email" depth="3" style="font-size: 13px">· {{ user.email }}</NText>
          </NSpace>
        </div>
      </div>

      <!-- 统计数字 -->
      <div class="stats-row">
        <div class="stat-block">
          <div class="stat-value">{{ user.accepts ?? 0 }}</div>
          <div class="stat-label">通过</div>
        </div>
        <NDivider vertical style="height: 48px" />
        <div class="stat-block">
          <div class="stat-value">{{ user.submits ?? 0 }}</div>
          <div class="stat-label">提交</div>
        </div>
        <NDivider vertical style="height: 48px" />
        <div class="stat-block">
          <div class="stat-value">{{ passRate }}</div>
          <div class="stat-label">通过率</div>
        </div>
        <NDivider vertical style="height: 48px" />
        <div class="stat-block">
          <div class="stat-value">{{ acProblems.length }}</div>
          <div class="stat-label">题目数</div>
        </div>
      </div>
    </NCard>

    <!-- 标签页：通过题目 + 近期提交 -->
    <NCard style="width: 100%">
      <NTabs v-model:value="activeTab" type="line" animated>
        <!-- 通过题目 -->
        <NTabPane name="problems" tab="✅ 通过题目">
          <div v-if="acLoading" style="text-align: center; padding: 32px">
            <NSpin />
          </div>
          <div v-else-if="acProblems.length === 0" style="text-align: center; padding: 32px; color: #888">
            暂无通过记录
          </div>
          <div v-else>
            <div class="problem-tags">
              <NTag
                v-for="p in pagedAcProblems"
                :key="p.id"
                type="success"
                size="medium"
                :bordered="false"
                style="cursor: pointer"
                @click="navigateTo(`/problems/${p.id}`)"
              >
                {{ p.prefix }}{{ p.logicId }} · {{ p.title }}
              </NTag>
            </div>
            <div style="margin-top: 16px; display: flex; justify-content: flex-end">
              <NPagination
                v-if="acProblems.length > acPageSize"
                v-model:page="acPage"
                :page-count="Math.ceil(acProblems.length / acPageSize)"
                :page-size="acPageSize"
                size="small"
              />
            </div>
          </div>
        </NTabPane>

        <!-- 近期提交 -->
        <NTabPane name="submissions" tab="📋 近期提交">
          <NDataTable
            :columns="submissionColumns"
            :data="submissions"
            :loading="submissionsLoading"
            :pagination="{ pageSize: 10 }"
            size="small"
          />
        </NTabPane>
      </NTabs>
    </NCard>
  </div>
  <div v-else class="loading-center">
    <NResult status="404" title="用户不存在" description="该用户不存在或已被删除" />
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
})

const route = useRoute()
const userId = computed(() => Number(route.params.id))
const usersApi = useUsersApi()
const submissionsApi = useSubmissionsApi()

const user = ref<any>(null)
const loading = ref(true)
const submissions = ref<Submission[]>([])
const submissionsLoading = ref(false)

// AC题目 (去重)
const acProblems = ref<{ id: number; title: string; logicId: number; prefix: string }[]>([])
const acLoading = ref(false)

// 标签页
const activeTab = ref('problems')

// 通过题目分页
const acPage = ref(1)
const acPageSize = 30

const pagedAcProblems = computed(() => {
  const start = (acPage.value - 1) * acPageSize
  return acProblems.value.slice(start, start + acPageSize)
})

// 通过率
const passRate = computed(() => {
  const submits = user.value?.submits ?? 0
  const accepts = user.value?.accepts ?? 0
  if (submits === 0) return '0%'
  return `${((accepts / submits) * 100).toFixed(1)}%`
})

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
      const label = row.problem.prefix
        ? `${row.problem.prefix}${row.problem.logicId} · ${row.problem.title}`
        : row.problem.title
      return h(NButton, { text: true, type: 'primary', onClick: () => navigateTo(`/problems/${row.problem.id}`) }, () => label)
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

async function loadAcProblems() {
  acLoading.value = true
  try {
    // 获取该用户所有 AC 提交，最多 200 条，去重提取题目
    const res = await submissionsApi.list({ userId: userId.value, status: 2, perPage: 200 })
    const data = res.data ?? res
    const items: Submission[] = data.items ?? data
    // 去重：按 problemId
    const seen = new Set<number>()
    const problems: { id: number; title: string; logicId: number; prefix: string }[] = []
    for (const s of items) {
      if (s.problem && !seen.has(s.problem.id)) {
        seen.add(s.problem.id)
        problems.push({
          id: s.problem.id,
          title: s.problem.title,
          logicId: s.problem.logicId,
          prefix: s.problem.prefix ?? '',
        })
      }
    }
    acProblems.value = problems
  }
  catch {
    acProblems.value = []
  }
  finally {
    acLoading.value = false
  }
}

onMounted(async () => {
  // 加载用户信息
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

  if (!user.value) return

  // 并行加载 AC 题目和近期提交
  loadAcProblems()

  submissionsLoading.value = true
  try {
    const res = await submissionsApi.list({ userId: userId.value, perPage: 20 })
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
  max-width: 960px;
  margin: 0 auto;
}

.user-card {
  width: 100%;
}

.user-header {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.stats-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  padding: 16px 0 4px;
  flex-wrap: wrap;
}

.stat-block {
  text-align: center;
  min-width: 80px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #2080f0;
  line-height: 1.2;
}

.stat-label {
  font-size: 12px;
  color: #888;
  margin-top: 4px;
}

.problem-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 0;
}
</style>
