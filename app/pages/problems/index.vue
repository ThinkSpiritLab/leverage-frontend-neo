<template>
  <div class="problems-page">
    <div class="page-header">
      <NH2>题目列表</NH2>
      <NInput
        v-model:value="searchText"
        placeholder="搜索题目..."
        clearable
        style="width: 300px"
      >
        <template #prefix>
          <NIcon><SearchOutline /></NIcon>
        </template>
      </NInput>
    </div>

    <PaginatedTable
      :columns="columns"
      :data="(problems as any)"
      :loading="loading"
      :total="total"
      :page="page"
      :page-size="pageSize"
      :row-key="(row: any) => row.id"
      @page-change="onPageChange"
    />
  </div>
</template>

<script setup lang="ts">
import { h } from 'vue'
import { NButton, NTag, NSpace, NProgress } from 'naive-ui'
import type { DataTableColumns, ProgressProps } from 'naive-ui'
import { SearchOutline } from '@vicons/ionicons5'
import type { Problem, Tag } from '~/types'

definePageMeta({
  layout: 'default',
  middleware: 'auth',
})

const problemsApi = useProblemsApi()
const submissionsApi = useSubmissionsApi()
const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

const searchText = ref('')
const page = ref(1)
const pageSize = ref(20)
const selectedTagId = ref<number | null>(null)
const problems = ref<Problem[]>([])
const total = ref(0)
const loading = ref(false)

function syncTagIdFromRoute() {
  const raw = route.query.tagId
  const tagId = Number(Array.isArray(raw) ? raw[0] : raw)
  selectedTagId.value = Number.isFinite(tagId) && tagId > 0 ? tagId : null
}

async function fetchProblems() {
  loading.value = true
  try {
    const res = await problemsApi.list({
      page: page.value,
      perPage: pageSize.value,
      search: searchText.value || undefined,
      tagId: selectedTagId.value || undefined,
    })
    const items = res.data.items
    total.value = res.data.total

    // 已登录时批量查做题状态（1=AC, 2=尝试过, undefined=未做）
    if (authStore.isLoggedIn && authStore.user?.id && items.length > 0) {
      try {
        const ids = items.map((p: any) => p.id)
        const statusRes = await submissionsApi.userProblemStatusBatch(authStore.user.id, ids)
        const statusMap: Record<string, number> = statusRes.data ?? {}
        problems.value = items.map((p: any) => ({
          ...p,
          _userStatus: statusMap[String(p.id)] ?? 0,
        }))
      }
      catch {
        problems.value = items
      }
    }
    else {
      problems.value = items
    }
  }
  catch (e) {
    console.error(e)
  }
  finally {
    loading.value = false
  }
}

const debouncedFetch = useDebounceFn(fetchProblems, 300)

watch(searchText, () => {
  page.value = 1
  debouncedFetch()
})

watch(
  () => route.query.tagId,
  () => {
    syncTagIdFromRoute()
    page.value = 1
    fetchProblems()
  },
)

onMounted(() => {
  syncTagIdFromRoute()
  fetchProblems()
})

function onPageChange({ page: p, pageSize: ps }: { page: number; pageSize: number }) {
  page.value = p
  pageSize.value = ps
  fetchProblems()
}

function getStatusInfo(status: unknown) {
  // backend UserProblemStatus enum: 0=TODO, 1=ATTEMPTED, 2=ACCEPTED
  if (status === 2) return { text: '已 AC', color: '#18a058' }
  if (status === 1) return { text: '尝试过', color: '#f0a020' }
  return { text: '未做', color: '#b0b8c2' }
}

function tagColor(tag: Tag) {
  if (tag.color) return tag.color
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#14b8a6']
  const hash = [...tag.name].reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return colors[hash % colors.length]
}

function filterByTag(tag: Tag) {
  router.push({ path: '/problems', query: { ...route.query, tagId: String(tag.id) } })
}

const columns: DataTableColumns<Problem> = [
  {
    title: '状态',
    key: 'status',
    width: 110,
    render(row) {
      const info = getStatusInfo((row as any)._userStatus)
      return h('div', { class: 'status-cell' }, [
        h('span', { class: 'status-dot', style: `background:${info.color}` }),
        h('span', { class: 'status-text' }, info.text),
      ])
    },
  },
  {
    title: '题号',
    key: 'logicId',
    width: 100,
    render(row) {
      return h('span', { style: 'font-weight: 600; color: #64748b;' }, `${row.prefix}${row.logicId}`)
    },
  },
  {
    title: '标题',
    key: 'title',
    render(row) {
      return h(
        NButton,
        {
          text: true,
          class: 'problem-link',
          onClick: () => navigateTo(`/problems/${row.id}`),
        },
        { default: () => row.title },
      )
    },
  },
  {
    title: '通过率',
    key: 'accepts',
    width: 220,
    render(row) {
      const rate = row.submits > 0 ? Number(((row.accepts / row.submits) * 100).toFixed(1)) : 0
      const progressStatus: ProgressProps['status'] = rate >= 60 ? 'success' : rate >= 30 ? 'warning' : 'error'
      return h('div', { class: 'rate-cell' }, [
        h(NProgress, {
          type: 'line',
          percentage: rate,
          height: 8,
          showIndicator: false,
          processing: false,
          status: progressStatus,
          borderRadius: 6,
        }),
        h('span', { class: 'rate-meta' }, `${rate}% (${row.accepts}/${row.submits})`),
      ])
    },
  },
  {
    title: '标签',
    key: 'tags',
    render(row) {
      if (!row.tags || row.tags.length === 0) return h('span', { style: 'color: #94a3b8;' }, '-')
      return h(
        NSpace,
        { size: 6 },
        {
          default: () =>
            row.tags.map(tag =>
              h(
                NTag,
                {
                  key: tag.id,
                  size: 'small',
                  bordered: false,
                  round: true,
                  style: {
                    color: '#fff',
                    background: tagColor(tag),
                    cursor: 'pointer',
                  },
                  onClick: () => filterByTag(tag),
                },
                { default: () => tag.name },
              ),
            ),
        },
      )
    },
  },
]

useHead({ title: '题库 — Leverage OJ' })
</script>

<style scoped>
.problems-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.page-header :deep(.n-h2) {
  margin: 0;
}

:deep(.status-cell) {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

:deep(.status-dot) {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

:deep(.status-text) {
  font-size: 13px;
  color: #475569;
}

:deep(.problem-link .n-button__content) {
  color: #334155;
  transition: color 0.2s ease;
}

:deep(.problem-link:hover .n-button__content) {
  color: #2563eb;
}

:deep(.rate-cell) {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

:deep(.rate-meta) {
  color: #64748b;
  font-size: 12px;
}
</style>
