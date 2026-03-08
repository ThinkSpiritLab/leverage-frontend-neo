<template>
  <div class="admin-users">
    <div class="page-header">
      <NH2 style="margin: 0">用户管理</NH2>
      <NInput
        v-model:value="searchText"
        placeholder="搜索用户名..."
        clearable
        style="width: 260px"
        @input="debouncedFetch"
      />
    </div>

    <PaginatedTable
      :columns="columns"
      :data="(users as any)"
      :loading="loading"
      :total="total"
      :page="page"
      :page-size="pageSize"
      :row-key="(row: any) => row.id"
      @page-change="onPageChange"
    />

    <!-- 编辑用户弹窗 -->
    <NModal v-model:show="showModal" title="编辑用户" preset="dialog" style="width: 480px">
      <NForm :model="form" label-placement="left" label-width="80px" style="margin-top: 12px">
        <NFormItem label="用户名">
          <NInput :value="editingUser?.username" :disabled="true" />
        </NFormItem>
        <NFormItem label="邮箱">
          <NInput v-model:value="form.email" placeholder="输入邮箱" />
        </NFormItem>
        <NFormItem label="学号">
          <NInput v-model:value="form.studentId" placeholder="输入学号" />
        </NFormItem>
        <NFormItem label="角色">
          <NSelect
            v-model:value="form.role"
            :options="roleOptions"
          />
        </NFormItem>
        <NFormItem label="新密码">
          <NInput v-model:value="form.password" type="password" placeholder="留空则不修改" show-password-on="click" />
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
import { h } from 'vue'
import { NButton, NSpace, NTag, useMessage, useDialog } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import type { User } from '~/types'
import type { UpdateUserDto } from '~/composables/api/users'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const usersApi = useUsersApi()
const message = useMessage()
const dialog = useDialog()

const users = ref<User[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const loading = ref(false)
const searchText = ref('')

const showModal = ref(false)
const editingUser = ref<User | null>(null)
const saving = ref(false)
const form = ref<UpdateUserDto>({})

const roleOptions = [
  { label: '普通用户', value: 'user' },
  { label: '管理员', value: 'admin' },
  { label: '监督员', value: 'supervisor' },
  { label: '超级管理员', value: 'sa' },
]

const roleTypeMap: Record<string, 'default' | 'info' | 'success' | 'warning' | 'error'> = {
  sa: 'error',
  admin: 'warning',
  supervisor: 'info',
  user: 'default',
  guest: 'default',
}

async function fetchUsers() {
  loading.value = true
  try {
    const res = await usersApi.list({
      page: page.value,
      perPage: pageSize.value,
      search: searchText.value || undefined,
    })
    users.value = res.items
    total.value = res.total
  }
  catch (e) {
    console.error(e)
  }
  finally {
    loading.value = false
  }
}

const debouncedFetch = useDebounceFn(() => {
  page.value = 1
  fetchUsers()
}, 300)

onMounted(fetchUsers)

function onPageChange({ page: p, pageSize: ps }: { page: number; pageSize: number }) {
  page.value = p
  pageSize.value = ps
  fetchUsers()
}

function openEditModal(row: User) {
  editingUser.value = row
  form.value = {
    email: row.email,
    studentId: row.studentId,
    role: row.role,
    password: '',
  }
  showModal.value = true
}

async function handleSave() {
  if (!editingUser.value) return
  saving.value = true
  try {
    const dto: UpdateUserDto = { ...form.value }
    if (!dto.password) delete dto.password
    await usersApi.update(editingUser.value.id, dto)
    message.success('更新成功')
    showModal.value = false
    fetchUsers()
  }
  catch (e: any) {
    message.error(e?.message || '更新失败')
  }
  finally {
    saving.value = false
  }
}

function handleDelete(row: User) {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除用户「${row.username}」吗？此操作不可恢复。`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await usersApi.delete(row.id)
        message.success('删除成功')
        fetchUsers()
      }
      catch (e: any) {
        message.error(e?.message || '删除失败')
      }
    },
  })
}

const columns: DataTableColumns<User> = [
  {
    title: 'ID',
    key: 'id',
    width: 70,
  },
  {
    title: '用户名',
    key: 'username',
    render(row) {
      return h(
        'a',
        {
          style: 'color: #2080f0; cursor: pointer;',
          onClick: () => navigateTo(`/users/${row.id}`),
        },
        row.username,
      )
    },
  },
  {
    title: '邮箱',
    key: 'email',
    render(row) {
      return h('span', row.email || '-')
    },
  },
  {
    title: '学号',
    key: 'studentId',
    render(row) {
      return h('span', row.studentId || '-')
    },
  },
  {
    title: '角色',
    key: 'role',
    width: 120,
    render(row) {
      return h(
        NTag,
        {
          type: roleTypeMap[row.role] || 'default',
          size: 'small',
          bordered: false,
        },
        { default: () => row.role },
      )
    },
  },
  {
    title: '提交/通过',
    key: 'submits',
    width: 120,
    render(row) {
      return h('span', { style: 'color: #666;' }, `${row.submits || 0} / ${row.accepts || 0}`)
    },
  },
  {
    title: '操作',
    key: 'actions',
    width: 160,
    render(row) {
      return h(
        NSpace,
        { size: 'small' },
        {
          default: () => [
            h(
              NButton,
              {
                size: 'small',
                type: 'primary',
                ghost: true,
                onClick: () => openEditModal(row),
              },
              { default: () => '编辑' },
            ),
            h(
              NButton,
              {
                size: 'small',
                type: 'error',
                ghost: true,
                onClick: () => handleDelete(row),
              },
              { default: () => '删除' },
            ),
          ],
        },
      )
    },
  },
]
</script>

<style scoped>
.admin-users {
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
