<template>
  <div class="admin-task">
    <div class="page-header">
      <NH2 style="margin: 0">系统任务</NH2>
      <NButton :loading="loading" @click="fetchQueueStatus">
        刷新
      </NButton>
    </div>

    <NSpin :show="loading">
      <!-- 队列状态概览卡片 -->
      <NGrid :cols="5" :x-gap="12" :y-gap="12" style="margin-bottom: 24px">
        <NGridItem>
          <NCard size="small" hoverable>
            <NStatistic label="等待中" :value="status.waiting">
              <template #prefix>
                <NIcon :component="TimeOutline" style="color: #f0a020" />
              </template>
            </NStatistic>
          </NCard>
        </NGridItem>
        <NGridItem>
          <NCard size="small" hoverable>
            <NStatistic label="执行中" :value="status.active">
              <template #prefix>
                <NIcon :component="PlayCircleOutline" style="color: #18a058" />
              </template>
            </NStatistic>
          </NCard>
        </NGridItem>
        <NGridItem>
          <NCard size="small" hoverable>
            <NStatistic label="已完成" :value="status.completed">
              <template #prefix>
                <NIcon :component="CheckmarkCircleOutline" style="color: #2080f0" />
              </template>
            </NStatistic>
          </NCard>
        </NGridItem>
        <NGridItem>
          <NCard size="small" hoverable>
            <NStatistic label="失败" :value="status.failed">
              <template #prefix>
                <NIcon :component="CloseCircleOutline" style="color: #d03050" />
              </template>
            </NStatistic>
          </NCard>
        </NGridItem>
        <NGridItem>
          <NCard size="small" hoverable>
            <NStatistic label="延迟" :value="status.delayed">
              <template #prefix>
                <NIcon :component="AlarmOutline" style="color: #909399" />
              </template>
            </NStatistic>
          </NCard>
        </NGridItem>
      </NGrid>

      <!-- 状态汇总表格 -->
      <NDataTable
        :columns="columns"
        :data="tableData"
        :row-key="(row: any) => row.name"
        size="small"
        bordered
        :pagination="false"
      />
    </NSpin>
  </div>
</template>

<script setup lang="ts">
import { h, ref, computed, onMounted } from 'vue'
import { NProgress, NTag, NIcon } from 'naive-ui'
import {
  TimeOutline,
  PlayCircleOutline,
  CheckmarkCircleOutline,
  CloseCircleOutline,
  AlarmOutline,
} from '@vicons/ionicons5'
import type { DataTableColumns } from 'naive-ui'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const api = useApi()
const loading = ref(false)

const status = ref({
  waiting: 0,
  active: 0,
  completed: 0,
  failed: 0,
  delayed: 0,
})

// 将队列状态转换为表格展示
const tableData = computed(() => {
  const total = status.value.waiting + status.value.active + status.value.completed + status.value.failed + status.value.delayed

  return [
    { name: '等待中 (waiting)', count: status.value.waiting, total, type: 'warning' },
    { name: '执行中 (active)', count: status.value.active, total, type: 'success' },
    { name: '已完成 (completed)', count: status.value.completed, total, type: 'info' },
    { name: '失败 (failed)', count: status.value.failed, total, type: 'error' },
    { name: '延迟 (delayed)', count: status.value.delayed, total, type: 'default' },
  ]
})

const columns: DataTableColumns = [
  {
    title: '状态',
    key: 'name',
    width: 200,
    render: (row: any) => {
      const typeMap: Record<string, any> = {
        warning: 'warning',
        success: 'success',
        info: 'info',
        error: 'error',
        default: 'default',
      }
      return h(NTag, { type: typeMap[row.type], size: 'small', bordered: false }, { default: () => row.name })
    },
  },
  {
    title: '数量',
    key: 'count',
    width: 80,
  },
  {
    title: '占比',
    key: 'progress',
    render: (row: any) => {
      if (row.total === 0) {
        return h(NProgress, { type: 'line', percentage: 0, showIndicator: true, status: 'default' })
      }
      const pct = Math.round((row.count / row.total) * 100)
      const statusMap: Record<string, any> = {
        warning: 'warning',
        success: 'success',
        info: 'info',
        error: 'error',
        default: 'default',
      }
      return h(NProgress, {
        type: 'line',
        percentage: pct,
        showIndicator: true,
        status: statusMap[row.type],
      })
    },
  },
]

async function fetchQueueStatus() {
  loading.value = true
  try {
    const res = await api.get<{
      waiting: number
      active: number
      completed: number
      failed: number
      delayed: number
    }>('/transmit/queue-status')
    status.value = res.data ?? status.value
  }
  catch (e) {
    console.error('fetchQueueStatus error', e)
  }
  finally {
    loading.value = false
  }
}

onMounted(fetchQueueStatus)

useHead({ title: '任务队列' })
</script>

<style scoped>
.admin-task {
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
