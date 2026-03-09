<template>
  <div class="admin-sus-union">
    <div class="page-header">
      <NH2 style="margin: 0">用户抄袭统计</NH2>
      <NSelect
        v-model:value="selectedCourseId"
        :options="courseOptions"
        placeholder="请选择课程"
        clearable
        style="width: 280px"
        @update:value="onCourseChange"
      />
    </div>

    <NEmpty v-if="!selectedCourseId" description="请选择课程" />

    <NDataTable
      v-else
      :columns="columns"
      :data="sortedData"
      :loading="loading"
      :row-key="(row: any) => row.userId"
    />
  </div>
</template>

<script setup lang="ts">
import { h, ref, computed } from 'vue'
import { NButton, NTag, NProgress, useMessage } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const suspicionsApi = useSuspicionsApi()
const coursesApi = useCoursesApi()
const message = useMessage()

const selectedCourseId = ref<number | null>(null)
const courseOptions = ref<Array<{ label: string; value: number }>>([])
const statsData = ref<any[]>([])
const loading = ref(false)

const sortedData = computed(() =>
  [...statsData.value].sort((a, b) => (b.detectedRate ?? 0) - (a.detectedRate ?? 0)),
)

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

async function fetchStats() {
  if (!selectedCourseId.value) return
  loading.value = true
  try {
    const res = await suspicionsApi.getUserStats(selectedCourseId.value)
    statsData.value = Array.isArray(res.data) ? res.data : []
  }
  catch (e: any) {
    message.error(e?.response?.data?.message || '获取统计失败')
    statsData.value = []
  }
  finally {
    loading.value = false
  }
}

function onCourseChange() {
  statsData.value = []
  fetchStats()
}

const columns: DataTableColumns = [
  {
    title: '用户名',
    key: 'username',
    render(row: any) {
      return h(
        NButton,
        { text: true, type: 'primary', onClick: () => navigateTo(`/admin/user/${row.userId}`) },
        { default: () => row.username ?? '-' },
      )
    },
  },
  {
    title: '真实姓名',
    key: 'certifiedName',
    render(row: any) {
      return h('span', row.certifiedName ?? '-')
    },
  },
  {
    title: '学院',
    key: 'college',
    render(row: any) {
      return h('span', row.college ?? '-')
    },
  },
  {
    title: '涉嫌次数',
    key: 'detectedCount',
    sorter: (a: any, b: any) => (a.detectedCount ?? 0) - (b.detectedCount ?? 0),
  },
  {
    title: '通过数',
    key: 'accepts',
    sorter: (a: any, b: any) => (a.accepts ?? 0) - (b.accepts ?? 0),
  },
  {
    title: '抄袭率',
    key: 'detectedRate',
    sorter: (a: any, b: any) => (a.detectedRate ?? 0) - (b.detectedRate ?? 0),
    render(row: any) {
      const pct = (row.detectedRate ?? 0) * 100
      return h('div', { style: 'display:flex;align-items:center;gap:8px' }, [
        h('span', `${pct.toFixed(1)}%`),
        h(NProgress, { type: 'line', percentage: pct, showIndicator: false, style: 'width:80px' }),
      ])
    },
  },
  {
    title: '封禁状态',
    key: 'status',
    width: 100,
    render(row: any) {
      return row.status === 2
        ? h(NTag, { type: 'error', size: 'small' }, { default: () => '已封禁' })
        : h(NTag, { type: 'success', size: 'small' }, { default: () => '正常' })
    },
  },
]

onMounted(fetchCourses)

useHead({ title: '用户抄袭统计' })
</script>

<style scoped>
.admin-sus-union {
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
