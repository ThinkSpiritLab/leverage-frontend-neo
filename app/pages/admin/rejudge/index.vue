<template>
  <div class="admin-rejudge">
    <NH2>批量重判</NH2>

    <NCard title="筛选条件" style="max-width: 600px">
      <NForm :model="filterForm" label-placement="left" label-width="100px">
        <NFormItem label="题目ID">
          <NInputNumber v-model:value="filterForm.problemId" :min="1" placeholder="输入题目ID" clearable style="width: 100%" />
        </NFormItem>
        <NFormItem label="竞赛ID">
          <NInputNumber v-model:value="filterForm.contestId" :min="1" placeholder="输入竞赛ID" clearable style="width: 100%" />
        </NFormItem>
        <NFormItem label="状态筛选">
          <NSelect
            v-model:value="filterForm.status"
            :options="statusOptions"
            placeholder="全部状态（留空则选全部）"
            clearable
          />
        </NFormItem>
        <NFormItem>
          <NButton type="primary" :loading="searching" @click="handleSearch">
            查询提交
          </NButton>
        </NFormItem>
      </NForm>
    </NCard>

    <div v-if="submissions.length > 0" class="result-section">
      <NCard :title="`找到 ${submissions.length} 条提交`">
        <template #header-extra>
          <NButton type="error" :loading="rejudging" @click="handleBatchRejudge">
            全部重判（{{ submissions.length }} 条）
          </NButton>
        </template>

        <NDataTable
          :columns="columns"
          :data="submissions"
          :pagination="{ pageSize: 20 }"
          :row-key="(row: any) => row.id"
          size="small"
          max-height="500px"
        />
      </NCard>

      <NProgress
        v-if="rejudging"
        type="line"
        :percentage="rejudgeProgress"
        :indicator-placement="'inside'"
        style="margin-top: 12px"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { h, ref } from 'vue'
import type { DataTableColumns } from 'naive-ui'
import { useMessage } from 'naive-ui'
import type { Submission } from '~/types'
import { STATUS_LABEL } from '~/types'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const submissionsApi = useSubmissionsApi()
const message = useMessage()

const filterForm = ref({
  problemId: null as number | null,
  contestId: null as number | null,
  status: null as number | null,
})

const statusOptions = Object.entries(STATUS_LABEL).map(([value, label]) => ({
  label,
  value: Number(value),
}))

const submissions = ref<Submission[]>([])
const searching = ref(false)
const rejudging = ref(false)
const rejudgeProgress = ref(0)

async function handleSearch() {
  if (!filterForm.value.problemId && !filterForm.value.contestId) {
    message.warning('请至少输入题目ID或竞赛ID')
    return
  }
  searching.value = true
  submissions.value = []
  try {
    // 分页抓取所有匹配提交
    const params: any = { page: 1, perPage: 100 }
    if (filterForm.value.problemId) params.problemId = filterForm.value.problemId
    if (filterForm.value.status !== null) params.status = filterForm.value.status

    let allItems: Submission[] = []
    let hasMore = true
    while (hasMore) {
      const res = await submissionsApi.list(params)
      allItems = allItems.concat(res.data.items)
      if (allItems.length >= res.data.total || res.data.items.length === 0) {
        hasMore = false
      }
      else {
        params.page++
      }
    }
    submissions.value = allItems
    message.success(`共找到 ${allItems.length} 条提交`)
  }
  catch (e: any) {
    message.error(e?.response?.data?.message || '查询失败')
  }
  finally {
    searching.value = false
  }
}

async function handleBatchRejudge() {
  if (submissions.value.length === 0) return
  rejudging.value = true
  rejudgeProgress.value = 0
  let success = 0
  let failed = 0

  for (let i = 0; i < submissions.value.length; i++) {
    try {
      await submissionsApi.rejudge(submissions.value[i].id)
      success++
    }
    catch {
      failed++
    }
    rejudgeProgress.value = Math.round(((i + 1) / submissions.value.length) * 100)
  }

  rejudging.value = false
  message.success(`重判完成：${success} 成功，${failed} 失败`)
}

const columns: DataTableColumns<Submission> = [
  { title: '#', key: 'id', width: 80 },
  {
    title: '用户',
    key: 'user',
    render(row) {
      return h('span', row.user?.username ?? String(row.userId))
    },
  },
  {
    title: '题目',
    key: 'problem',
    render(row) {
      if (row.problem) return h('span', `${row.problem.prefix}${row.problem.logicId} - ${row.problem.title}`)
      return h('span', String(row.problemId))
    },
  },
  { title: '语言', key: 'language', width: 100 },
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
    render(row) {
      return new Date(row.createdAt).toLocaleString('zh-CN')
    },
  },
]
</script>

<style scoped>
.admin-rejudge {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.result-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
