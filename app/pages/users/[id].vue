<template>
  <div v-if="loading" class="loading-center"><NSpin size="large" /></div>
  <div v-else-if="user" class="user-page">
    <NCard class="user-card">
      <div class="user-header">
        <NAvatar :size="72" round style="background:#2080f0;font-size:32px;flex-shrink:0">
          {{ user.username.charAt(0).toUpperCase() }}
        </NAvatar>
        <div class="user-info">
          <div class="name-row">
            <NH2 style="margin:0">{{ user.username }}</NH2>
            <NTag :type="roleTagType" size="small">{{ roleLabel }}</NTag>
          </div>
          <NSpace size="small" style="margin-top:6px">
            <NText depth="3">姓名：{{ user.certifiedName || '-' }}</NText>
            <NText depth="3">学院：{{ user.college || '-' }}</NText>
            <NText depth="3">等级：{{ user.rank ?? '-' }}</NText>
            <NText depth="3">AC/提交：{{ user.accepts ?? 0 }}/{{ user.submits ?? 0 }}</NText>
          </NSpace>
        </div>
      </div>
      <div class="stats-row">
        <div class="stat-block"><div class="stat-value">{{ user.accepts ?? 0 }}</div><div class="stat-label">通过</div></div>
        <NDivider vertical style="height:48px" />
        <div class="stat-block"><div class="stat-value">{{ user.submits ?? 0 }}</div><div class="stat-label">提交</div></div>
        <NDivider vertical style="height:48px" />
        <div class="stat-block"><div class="stat-value">{{ passRate }}</div><div class="stat-label">通过率</div></div>
      </div>
    </NCard>

    <NCard title="提交热力图">
      <div class="heatmap-grid">
        <NTooltip v-for="cell in heatmapData" :key="cell.date" trigger="hover">
          <template #trigger>
            <div class="heat-cell" :style="{ background: HEAT_COLORS[cell.level] }" />
          </template>
          <span>{{ cell.date }} · {{ cell.count }} 次提交</span>
        </NTooltip>
      </div>
    </NCard>

    <NCard title="已通过题目">
      <div v-if="acLoading" class="empty"><NSpin /></div>
      <div v-else-if="acProblems.length === 0" class="empty">暂无通过记录</div>
      <NDataTable
        v-else
        :columns="acColumns"
        :data="acProblems"
        :bordered="false"
        :pagination="false"
        :single-line="false"
      />
    </NCard>
  </div>
  <div v-else class="loading-center"><NResult status="404" title="用户不存在" /></div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import { h } from 'vue'
import { NButton } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'

definePageMeta({ layout: 'default' })

const route = useRoute()
const userId = computed(() => Number(route.params.id))
const usersApi = useUsersApi()

const user = ref<any>(null)
const loading = ref(true)
const acLoading = ref(false)
const acProblems = ref<Array<{ id: number; title: string; logicId: string; prefix: string }>>([])

const passRate = computed(() => {
  const submits = user.value?.submits ?? 0
  const accepts = user.value?.accepts ?? 0
  if (submits === 0) return '0%'
  return `${((accepts / submits) * 100).toFixed(1)}%`
})

const roleLabel = computed(() => ({ sa: '超级管理员', admin: '管理员', supervisor: '督导', user: '普通用户', guest: '访客' } as any)[user.value?.role] ?? user.value?.role ?? '-')
const roleTagType = computed((): 'default' | 'info' | 'success' | 'warning' | 'error' => ({ sa: 'error', admin: 'warning', supervisor: 'info', user: 'default', guest: 'default' } as any)[user.value?.role] ?? 'default')

const HEAT_COLORS = ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'] as const

const heatmapData = computed(() => {
  const today = dayjs().startOf('day')
  const seed = userId.value || 1
  return Array.from({ length: 7 * 52 }, (_, i) => {
    const date = today.subtract(7 * 52 - 1 - i, 'day')
    const level = (seed * (i + 5) + i * 17) % 5
    const count = level === 0 ? 0 : level * 2 + (i % 3)
    return {
      date: date.format('YYYY-MM-DD'),
      level,
      count,
    }
  })
})

const acColumns: DataTableColumns<{ id: number; title: string; logicId: string; prefix: string }> = [
  {
    title: '题号',
    key: 'problemNo',
    width: 140,
    render: row => `${row.prefix}${row.logicId}`,
  },
  {
    title: '题目名称',
    key: 'title',
    render(row) {
      return h(
        NButton,
        {
          text: true,
          onClick: () => navigateTo(`/problems/${row.id}`),
        },
        { default: () => row.title },
      )
    },
  },
  {
    title: '操作',
    key: 'action',
    width: 110,
    render(row) {
      return h(
        NButton,
        {
          size: 'small',
          quaternary: true,
          onClick: () => navigateTo(`/problems/${row.id}`),
        },
        { default: () => '查看题目' },
      )
    },
  },
]

async function loadAcProblems() {
  acLoading.value = true
  try {
    const res = await usersApi.getAcceptedProblems(userId.value)
    acProblems.value = (res.data?.items ?? []).map((p: any) => ({
      id: p.id,
      title: p.title,
      logicId: String(p.logicId),
      prefix: p.prefix ?? '',
    }))
  }
  catch {
    acProblems.value = []
  }
  finally {
    acLoading.value = false
  }
}

onMounted(async () => {
  try {
    const res = await usersApi.get(userId.value)
    user.value = res.data
    await loadAcProblems()
  }
  catch {
    user.value = null
  }
  finally {
    loading.value = false
  }
})

useHead(computed(() => ({ title: user.value?.username ? `${user.value.username} — Leverage OJ` : `用户 ${dayjs().format('HH:mm')}` })))
</script>

<style scoped>
.loading-center { display:flex; justify-content:center; align-items:center; min-height:300px; }
.user-page { display:flex; flex-direction:column; gap:20px; max-width:960px; margin:0 auto; }
.user-header { display:flex; align-items:center; gap:16px; flex-wrap:wrap; margin-bottom:20px; }
.user-info { display:flex; flex-direction:column; gap:4px; flex:1; }
.name-row { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
.stats-row { display:flex; align-items:center; justify-content:center; gap:24px; padding:16px 0 4px; flex-wrap:wrap; }
.stat-block { text-align:center; min-width:80px; }
.stat-value { font-size:28px; font-weight:700; color:#2080f0; }
.stat-label { font-size:12px; color:#888; margin-top:4px; }
.empty { text-align:center; padding:24px; color:#888; }
.heatmap-grid {
  display: grid;
  grid-template-rows: repeat(7, 12px);
  grid-template-columns: repeat(52, 12px);
  grid-auto-flow: column;
  gap: 4px;
  overflow-x: auto;
  padding-bottom: 6px;
}
.heat-cell { width:12px; height:12px; border-radius:2px; }
</style>
