<template>
  <div class="admin-professions">
    <div class="page-header">
      <NH2 style="margin: 0">专业管理</NH2>
      <NButton type="primary" @click="openCreateModal">
        + 新增专业
      </NButton>
    </div>

    <div class="filter-row">
      <NInput
        v-model:value="filterCollege"
        placeholder="按学院名过滤"
        clearable
        style="max-width: 300px"
        @update:value="handleFilterChange"
      />
    </div>

    <NSpin :show="loading">
      <NDataTable
        :columns="columns"
        :data="professions"
        :row-key="(row: any) => row.id"
        size="small"
        bordered
        :pagination="{ pageSize: 20 }"
      />
    </NSpin>

    <!-- 新增/编辑弹窗 -->
    <NModal v-model:show="showModal" :title="editingId ? '编辑专业' : '新增专业'" preset="dialog" style="width: 440px">
      <NForm :model="form" label-placement="left" label-width="80px" style="margin-top: 12px">
        <NFormItem label="专业名称" required>
          <NInput v-model:value="form.profession" placeholder="请输入专业名称" />
        </NFormItem>
        <NFormItem label="所属学院" required>
          <NAutoComplete
            v-model:value="form.college"
            :options="collegeAutoOptions"
            placeholder="请输入学院名称"
          />
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
    <NModal v-model:show="showMergeModal" title="合并专业" preset="dialog" style="width: 400px">
      <div style="margin-top: 12px">
        <p>将「{{ mergeSource?.profession }}」合并到：</p>
        <NSelect
          v-model:value="mergeTargetId"
          :options="mergeTargetOptions"
          placeholder="选择目标专业"
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

const professionsApi = useProfessionsApi()
const collegesApi = useCollegesApi()
const message = useMessage()
const dialog = useDialog()

const professions = ref<any[]>([])
const colleges = ref<any[]>([])
const loading = ref(false)
const filterCollege = ref('')

const showModal = ref(false)
const editingId = ref<number | null>(null)
const saving = ref(false)
const form = ref({ profession: '', college: '' })

const showMergeModal = ref(false)
const mergeSource = ref<any>(null)
const mergeTargetId = ref<number | null>(null)
const merging = ref(false)

const collegeAutoOptions = computed(() =>
  colleges.value.map(c => c.college).filter(Boolean).map(name => ({ label: name, value: name })),
)

const mergeTargetOptions = computed(() =>
  professions.value
    .filter(p => p.id !== mergeSource.value?.id)
    .map(p => ({ label: `${p.profession}（${p.college || '-'}）`, value: p.id })),
)

async function fetchColleges() {
  try {
    const res = await collegesApi.list()
    const payload = res.data
    colleges.value = Array.isArray(payload) ? payload : (payload?.items ?? [])
  }
  catch (e) {
    console.error(e)
  }
}

async function fetchProfessions() {
  loading.value = true
  try {
    const res = await professionsApi.list(filterCollege.value || undefined)
    const payload = res.data
    professions.value = Array.isArray(payload) ? payload : (payload?.items ?? [])
  }
  catch (e) {
    console.error(e)
  }
  finally {
    loading.value = false
  }
}

function handleFilterChange() {
  fetchProfessions()
}

onMounted(() => {
  fetchColleges()
  fetchProfessions()
})

function openCreateModal() {
  editingId.value = null
  form.value = { profession: '', college: '' }
  showModal.value = true
}

function openEditModal(row: any) {
  editingId.value = row.id
  form.value = { profession: row.profession, college: row.college || '' }
  showModal.value = true
}

async function handleSave() {
  if (!form.value.profession.trim()) {
    message.warning('请填写专业名称')
    return
  }
  if (!form.value.college.trim()) {
    message.warning('请填写所属学院')
    return
  }
  saving.value = true
  try {
    if (editingId.value) {
      await professionsApi.update(editingId.value, form.value.profession, form.value.college)
      message.success('编辑成功')
    }
    else {
      await professionsApi.create(form.value.profession, form.value.college)
      message.success('创建成功')
    }
    showModal.value = false
    fetchProfessions()
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
    content: `确定要删除专业「${row.profession}」吗？`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await professionsApi.delete(row.id)
        message.success('已删除')
        fetchProfessions()
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
    message.warning('请选择目标专业')
    return
  }
  merging.value = true
  try {
    await professionsApi.merge(mergeSource.value.id, mergeTargetId.value)
    message.success('合并成功')
    showMergeModal.value = false
    fetchProfessions()
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
  { title: '专业名称', key: 'profession' },
  { title: '所属学院', key: 'college' },
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

useHead({ title: '专业管理' })
</script>

<style scoped>
.admin-professions {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.filter-row {
  display: flex;
  gap: 12px;
}
</style>
