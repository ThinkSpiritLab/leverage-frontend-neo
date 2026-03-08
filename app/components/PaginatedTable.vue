<template>
  <div class="paginated-table">
    <NDataTable
      :columns="columns"
      :data="data"
      :loading="loading"
      :row-key="rowKey"
      v-bind="$attrs"
    />
    <div v-if="total > 0" class="pagination-wrapper">
      <NPagination
        v-model:page="currentPage"
        v-model:page-size="currentPageSize"
        :item-count="total"
        :page-sizes="pageSizes"
        show-size-picker
        show-quick-jumper
        @update:page="onPageChange"
        @update:page-size="onPageSizeChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DataTableColumns } from 'naive-ui'

const props = withDefaults(defineProps<{
  columns: DataTableColumns
  data: Record<string, unknown>[]
  loading?: boolean
  total?: number
  page?: number
  pageSize?: number
  pageSizes?: number[]
  rowKey?: (row: Record<string, unknown>) => string | number
}>(), {
  loading: false,
  total: 0,
  page: 1,
  pageSize: 20,
  pageSizes: () => [10, 20, 50, 100],
})

const emit = defineEmits<{
  'update:page': [number]
  'update:pageSize': [number]
  'page-change': [{ page: number; pageSize: number }]
}>()

const currentPage = ref(props.page)
const currentPageSize = ref(props.pageSize)

watch(() => props.page, val => (currentPage.value = val))
watch(() => props.pageSize, val => (currentPageSize.value = val))

function onPageChange(page: number) {
  emit('update:page', page)
  emit('page-change', { page, pageSize: currentPageSize.value })
}

function onPageSizeChange(size: number) {
  currentPage.value = 1
  emit('update:pageSize', size)
  emit('page-change', { page: 1, pageSize: size })
}
</script>

<style scoped>
.paginated-table {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
}
</style>
