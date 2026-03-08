<template>
  <div class="download-page">
    <NH2>下载中心</NH2>

    <NCard v-if="!loading && items.length === 0">
      <NResult status="404" title="下载中心" description="暂无可下载文件" />
    </NCard>

    <NCard v-else title="可下载文件">
      <NDataTable
        :columns="columns"
        :data="items"
        :loading="loading"
        :pagination="{ pageSize: 20 }"
        :row-key="(row: any) => row.name"
      />
    </NCard>
  </div>
</template>

<script setup lang="ts">
import { h, ref } from 'vue'
import type { DataTableColumns } from 'naive-ui'

definePageMeta({
  layout: 'default',
})

interface DownloadItem {
  name: string
  size: number
  birthtime: string
}

const api = useApi()
const items = ref<DownloadItem[]>([])
const loading = ref(true)

async function fetchList() {
  try {
    const res = await api.get<DownloadItem[]>('/media/download')
    items.value = res.data
  }
  catch {
    // 后端没有此接口或出错，显示空状态
    items.value = []
  }
  finally {
    loading.value = false
  }
}

onMounted(fetchList)

const columns: DataTableColumns<DownloadItem> = [
  {
    title: '文件名',
    key: 'name',
    render(row) {
      return h(
        'a',
        {
          href: `/api/media/download/${row.name}`,
          target: '_blank',
          rel: 'noopener noreferrer',
        },
        row.name,
      )
    },
  },
  {
    title: '大小',
    key: 'size',
    width: 120,
    render(row) {
      return `${(row.size / 1e6).toFixed(2)} MB`
    },
  },
  {
    title: '创建时间',
    key: 'birthtime',
    width: 180,
    render(row) {
      return new Date(row.birthtime).toLocaleString('zh-CN')
    },
  },
]
</script>

<style scoped>
.download-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 900px;
  margin: 0 auto;
}
</style>
