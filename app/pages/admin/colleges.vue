<template>
  <div class="admin-colleges">
    <div class="page-header">
      <NH2 style="margin: 0">学院管理</NH2>
      <NButton type="primary" @click="openCreateModal">
        + 新增学院
      </NButton>
    </div>

    <NSpin :show="loading">
      <NDataTable
        :columns="columns"
        :data="colleges"
        :row-key="(row: any) => row.id"
        size="small"
        bordered
        :pagination="{ pageSize: 20 }"
      />
    </NSpin>

    <!-- 新增/编辑弹窗 -->
    <NModal v-model:show="showModal" :title="editingId ? '编辑学院' : '新增学院'" preset="dialog" style="width: 400px">
      <NForm :model="form" label-placement="left" label-width="80px" style="margin-top: 12px">
        <NFormItem label="学院名称" required>
          <NInput v-model:value="form.name" placeholder="请输入学院名称" />
        </NFormItem>
      </NForm>

      <template #action>
        <NSpace justify="end">
          <NButton @click="showModal = false">取消</NButton>
          <NButton type="primary" :loading="saving" @click="handleSave">保存</NButton>
        </NSpace>
      </template>
    </NModal>

    <!-- 合并弹窗 -->
    <NModal v-model:show="showMergeModal" title="合并学院" preset="dialog" style="width: 400px">
      <div style="margin-top: 12px">
        <p>将「{{ mergeSource?.college }}」合并到：</p>
        <NSelect
          v-model:value="mergeTargetId"
          :options="mergeTargetOptions"
          placeholder="选择目标学院"
          filterable
        />
      </div>

      <template #action>
        <NSpace justify="end">
          <NButton @click="showMergeModal = false">取消</NButton>
          <NButton type="warning" :loading="merging" @click="handleMerge">确认合并</NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>

<script setup lang="ts">
import { h, ref, computed } from 'vue'
import { NButton, NSpace, useMessage, useDialog } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const collegesApi = useCollegesApi()
const message = useMessage()
const dialog = useDialog()

const colleges = ref<any[]>([])
const loading = ref(false)

const showModal = ref(false)
const editingId = ref<number | null>(null)
const saving = ref(false)
const form = ref({ name: '' })

const showMergeModal = ref(false)
const mergeSource = ref<any>(null)
const mergeTargetId = ref<number | null>(null)
const merging = ref(false)

const mergeTargetOptions = computed(() =>
  colleges.value
    .filter(c => c.id !== mergeSource.value?.id)
    .map(c => ({ label: c.college, value: c.id })),
)

async function fetchColleges() {
  loading.value = true
  try {
    const res = await collegesApi.list()
    const payload = res.data
    colleges.value = Array.isArray(payload) ? payload : (payload?.items ?? [])
  }
  catch (e) {
    console.error(e)
  }
  finally {
    loading.value = false
  }
}

onMounted(fetchColleges)

function openCreateModal() {
  editingId.value = null
  form.value = { name: '' }
  showModal.value = true
}

function openEditModal(row: any) {
  editingId.value = row.id
  form.value = { name: row.college }
  showModal.value = true
}

async function handleSave() {
  if (!form.value.name.trim()) {
    message.warning('请填写学院名称')
    return
  }
  saving.value = true
  try {
    if (editingId.value) {
      await collegesApi.update(editingId.value, form.value.name)
      message.success('编辑成功')
    }
    else {
      await collegesApi.create(form.value.name)
      message.success('创建成功')
    }
    showModal.value = false
    fetchColleges()
  }
  catch (e: any) {
    message.error(e?.response?.data?.message || e?.message || '操作失败')
  }
  finally {
    saving.value = false
  }
}

function handleDelete(row: any) {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除学院「${row.college}」吗？`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await collegesApi.delete(row.id)
        message.success('已删除')
        fetchColleges()
      }
      catch (e: any) {
        message.error(e?.response?.data?.message || e?.message || '删除失败')
      }
    },
  })
}

function openMergeModal(row: any) {
  mergeSource.value = row
  mergeTargetId.value = null
  showMergeModal.value = true
}

async function handleMerge() {
  if (!mergeTargetId.value) {
    message.warning('请选择目标学院')
    return
  }
  merging.value = true
  try {
    await collegesApi.merge(mergeSource.value.id, mergeTargetId.value)
    message.success('合并成功')
    showMergeModal.value = false
    fetchColleges()
  }
  catch (e: any) {
    message.error(e?.response?.data?.message || e?.message || '合并失败')
  }
  finally {
    merging.value = false
  }
}

const columns: DataTableColumns<any> = [
  { title: '#', key: 'id', width: 80 },
  { title: '学院名称', key: 'college' },
  {
    title: '操作',
    key: 'actions',
    width: 240,
    render(row) {
      return h(NSpace, { size: 'small' }, {
        default: () => [
          h(NButton, {
            size: 'small',
            type: 'primary',
            ghost: true,
            onClick: () => openEditModal(row),
          }, { default: () => '编辑' }),
          h(NButton, {
            size: 'small',
            type: 'warning',
            ghost: true,
            onClick: () => openMergeModal(row),
          }, { default: () => '合并' }),
          h(NButton, {
            size: 'small',
            type: 'error',
            ghost: true,
            onClick: () => handleDelete(row),
          }, { default: () => '删除' }),
        ],
      })
    },
  },
]

useHead({ title: '学院管理' })
</script>

<style scoped>
.admin-colleges {
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
