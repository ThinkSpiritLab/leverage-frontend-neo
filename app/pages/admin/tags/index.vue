<template>
  <div class="admin-tags">
    <div class="page-header">
      <NH2 style="margin: 0">标签管理</NH2>
      <NButton type="primary" @click="openCreateModal">
        + 新增标签
      </NButton>
    </div>

    <NSpin :show="loading">
      <NDataTable
        :columns="columns"
        :data="tags"
        :row-key="(row: any) => row.id"
        size="small"
        bordered
        :pagination="{ pageSize: 20 }"
      />
    </NSpin>

    <!-- 新增/编辑弹窗 -->
    <NModal v-model:show="showModal" :title="editingId ? '编辑标签' : '新增标签'" preset="dialog" style="width: 400px">
      <NForm :model="form" label-placement="left" label-width="80px" style="margin-top: 12px">
        <NFormItem label="名称" required>
          <NInput v-model:value="form.name" placeholder="标签名称" />
        </NFormItem>
        <NFormItem label="颜色">
          <NColorPicker v-model:value="form.color" :show-alpha="false" />
        </NFormItem>
      </NForm>

      <template #action>
        <NSpace justify="end">
          <NButton @click="showModal = false">取消</NButton>
          <NButton type="primary" :loading="saving" @click="handleSave">保存</NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>

<script setup lang="ts">
import { h, ref } from 'vue'
import { NButton, NSpace, NTag, useMessage, useDialog } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import type { Tag } from '~/types'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const tagsApi = useTagsApi()
const message = useMessage()
const dialog = useDialog()

const tags = ref<Tag[]>([])
const loading = ref(false)

const showModal = ref(false)
const editingId = ref<number | null>(null)
const saving = ref(false)
const form = ref({ name: '', color: '#18a058' })

async function fetchTags() {
  loading.value = true
  try {
    const res = await tagsApi.list()
    tags.value = res.data.items ?? []
  }
  catch (e) {
    console.error(e)
  }
  finally {
    loading.value = false
  }
}

onMounted(fetchTags)

function openCreateModal() {
  editingId.value = null
  form.value = { name: '', color: '#18a058' }
  showModal.value = true
}

function openEditModal(row: Tag) {
  editingId.value = row.id
  form.value = { name: row.name, color: row.color ?? '#18a058' }
  showModal.value = true
}

async function handleSave() {
  if (!form.value.name.trim()) {
    message.warning('请填写标签名称')
    return
  }
  saving.value = true
  try {
    if (editingId.value) {
      await tagsApi.update(editingId.value, { name: form.value.name, color: form.value.color })
      message.success('编辑成功')
    }
    else {
      await tagsApi.create({ name: form.value.name, color: form.value.color })
      message.success('创建成功')
    }
    showModal.value = false
    fetchTags()
  }
  catch (e: any) {
    message.error(e?.response?.data?.message || '操作失败')
  }
  finally {
    saving.value = false
  }
}

function handleDelete(row: Tag) {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除标签「${row.name}」吗？`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await tagsApi.delete(row.id)
        message.success('已删除')
        fetchTags()
      }
      catch (e: any) {
        message.error(e?.response?.data?.message || '删除失败')
      }
    },
  })
}

const columns: DataTableColumns<Tag> = [
  { title: '#', key: 'id', width: 80 },
  {
    title: '标签',
    key: 'name',
    render(row) {
      return h(
        NTag,
        {
          color: row.color
            ? { color: row.color, textColor: '#fff', borderColor: row.color }
            : undefined,
          bordered: false,
        },
        { default: () => row.name },
      )
    },
  },
  {
    title: '颜色',
    key: 'color',
    width: 120,
    render(row) {
      if (!row.color) return h('span', { style: 'color: #999' }, '默认')
      return h('span', [
        h('span', {
          style: `display: inline-block; width: 14px; height: 14px; border-radius: 2px; background: ${row.color}; margin-right: 6px; vertical-align: middle;`,
        }),
        row.color,
      ])
    },
  },
  {
    title: '操作',
    key: 'actions',
    width: 160,
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
            type: 'error',
            ghost: true,
            onClick: () => handleDelete(row),
          }, { default: () => '删除' }),
        ],
      })
    },
  },
]
</script>

<style scoped>
.admin-tags {
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
