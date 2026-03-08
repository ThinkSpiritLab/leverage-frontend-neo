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
import { NButton, NTag, NSpace } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { SearchOutline } from '@vicons/ionicons5'
import type { Problem } from '~/types'

definePageMeta({
  layout: 'default',
  middleware: 'auth',
})

const problemsApi = useProblemsApi()

const searchText = ref('')
const page = ref(1)
const pageSize = ref(20)
const problems = ref<Problem[]>([])
const total = ref(0)
const loading = ref(false)

async function fetchProblems() {
  loading.value = true
  try {
    const res = await problemsApi.list({
      page: page.value,
      perPage: pageSize.value,
      search: searchText.value || undefined,
    })
    problems.value = res.items
    total.value = res.total
  }
  catch (e) {
    console.error(e)
  }
  finally {
    loading.value = false
  }
}

// 防抖 300ms
const debouncedFetch = useDebounceFn(fetchProblems, 300)

watch(searchText, () => {
  page.value = 1
  debouncedFetch()
})

onMounted(fetchProblems)

function onPageChange({ page: p, pageSize: ps }: { page: number; pageSize: number }) {
  page.value = p
  pageSize.value = ps
  fetchProblems()
}

const columns: DataTableColumns<Problem> = [
  {
    title: '题号',
    key: 'logicId',
    width: 100,
    render(row) {
      return h('span', { style: 'font-weight: 600; color: #666;' }, `${row.prefix}${row.logicId}`)
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
          type: 'primary',
          onClick: () => navigateTo(`/problems/${row.id}`),
        },
        { default: () => row.title },
      )
    },
  },
  {
    title: '通过率',
    key: 'accepts',
    width: 120,
    render(row) {
      const rate = row.submits > 0 ? ((row.accepts / row.submits) * 100).toFixed(1) : '0.0'
      return h('span', { style: 'color: #18a058; font-weight: 500;' }, `${rate}% (${row.accepts}/${row.submits})`)
    },
  },
  {
    title: '标签',
    key: 'tags',
    render(row) {
      if (!row.tags || row.tags.length === 0) return h('span', { style: 'color: #999;' }, '无')
      return h(
        NSpace,
        { size: 4 },
        {
          default: () =>
            row.tags.map(tag =>
              h(
                NTag,
                {
                  key: tag.id,
                  size: 'small',
                  type: 'info',
                  bordered: false,
                },
                { default: () => tag.name },
              ),
            ),
        },
      )
    },
  },
]
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
</style>
