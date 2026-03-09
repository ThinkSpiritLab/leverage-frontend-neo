<template>
  <div class="admin-users">
    <div class="page-header">
      <NH2 style="margin: 0">用户管理</NH2>
    </div>

    <NTabs v-model:value="activeTab" type="line" animated>
      <!-- ===== 全部用户 Tab ===== -->
      <NTabPane name="all" tab="全部用户">
        <div style="margin-bottom: 12px; display: flex; justify-content: flex-end">
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
      </NTabPane>

      <!-- ===== 封号用户 Tab ===== -->
      <NTabPane name="banned" tab="封号用户">
        <NDataTable
          :columns="bannedColumns"
          :data="bannedUsers"
          :loading="bannedLoading"
          :row-key="(row: any) => row.id"
          size="small"
          style="margin-top: 12px"
        />
        <NPagination
          v-model:page="bannedPage"
          :page-count="bannedPageCount"
          style="margin-top: 12px; justify-content: flex-end"
          @update:page="fetchBannedUsers"
        />
      </NTabPane>
    </NTabs>

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
            :disabled="isEditingSelf"
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
import dayjs from 'dayjs'
import type { User } from '~/types'
import type { UpdateUserDto } from '~/composables/api/users'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const usersApi = useUsersApi()
const authStore = useAuthStore()
const message = useMessage()
const dialog = useDialog()

const activeTab = ref('all')

// ── 全部用户 ──
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
  { label: '超级管理员(superadmin)', value: 'superadmin' },
]

const isEditingSelf = computed(() => authStore.user?.id === editingUser.value?.id)

const roleTypeMap: Record<string, 'default' | 'info' | 'success' | 'warning' | 'error'> = {
  sa: 'error',
  superadmin: 'error',
  admin: 'warning',
  user: 'default',
  guest: 'default',
}

const roleLabelMap: Record<string, string> = {
  user: 'user',
  admin: 'admin',
  sa: 'sa',
  superadmin: 'superadmin',
}

async function fetchUsers() {
  loading.value = true
  try {
    const res = await usersApi.list({
      page: page.value,
      perPage: pageSize.value,
      search: searchText.value || undefined,
    })
    users.value = res.data.items
    total.value = res.data.total
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
    role: (row as any).authority ?? row.role,
    password: '',
  }
  showModal.value = true
}

async function handleSave() {
  if (!editingUser.value) return
  if (isEditingSelf.value && form.value.role && form.value.role !== editingUser.value.role) {
    message.warning('不能修改自己的角色')
    return
  }
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
          onClick: () => navigateTo(`/admin/user/${row.id}`),
        },
        row.username,
      )
    },
  },
  {
    title: '姓名',
    key: 'certifiedName',
    render(row) {
      return h('span', row.certifiedName || row.nickname || '-')
    },
  },
  {
    title: '学院',
    key: 'college',
    render(row) {
      return h('span', row.college || '-')
    },
  },
  {
    title: '角色',
    key: 'role',
    width: 100,
    render(row) {
      const authority = (row as any).authority ?? row.role
      if (!authority) return h('span', '-')
      return h(
        NTag,
        {
          type: roleTypeMap[authority] || 'default',
          size: 'small',
          bordered: false,
        },
        { default: () => roleLabelMap[authority] ?? authority },
      )
    },
  },
  {
    title: '通过数',
    key: 'accepts',
    width: 80,
    render(row) {
      return h('span', String(row.accepts ?? 0))
    },
  },
  {
    title: '提交数',
    key: 'submits',
    width: 80,
    render(row) {
      return h('span', String(row.submits ?? 0))
    },
  },
  {
    title: '操作',
    key: 'actions',
    width: 200,
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
                type: 'info',
                ghost: true,
                onClick: () => navigateTo(`/admin/user/${row.id}`),
              },
              { default: () => '详情' },
            ),
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

// ── 封号用户 ──
const bannedUsers = ref<User[]>([])
const bannedLoading = ref(false)
const bannedPage = ref(1)
const bannedPageCount = ref(1)
const bannedPerPage = 20

async function fetchBannedUsers() {
  bannedLoading.value = true
  try {
    const res = await usersApi.list({
      page: bannedPage.value,
      perPage: bannedPerPage,
      status: 2,
    })
    bannedUsers.value = res.data.items
    bannedPageCount.value = Math.ceil((res.data.total || 0) / bannedPerPage)
  }
  catch (e) {
    console.error(e)
  }
  finally {
    bannedLoading.value = false
  }
}

async function handleUnban(row: User) {
  try {
    await usersApi.update(row.id, { status: 0 } as any)
    message.success(`用户「${row.username}」已解封`)
    fetchBannedUsers()
  }
  catch (e: any) {
    message.error(e?.message || '解封失败')
  }
}

const bannedColumns: DataTableColumns<User> = [
  { title: 'ID', key: 'id', width: 70 },
  {
    title: '用户名',
    key: 'username',
    render(row) {
      return h(
        'a',
        {
          style: 'color: #2080f0; cursor: pointer;',
          onClick: () => navigateTo(`/admin/user/${row.id}`),
        },
        row.username,
      )
    },
  },
  {
    title: '真实姓名',
    key: 'certifiedName',
    render(row) {
      return h('span', row.certifiedName || '-')
    },
  },
  {
    title: '封禁原因',
    key: 'remarks',
    render(row) {
      return h('span', (row as any).remarks || '-')
    },
  },
  {
    title: '封禁到期时间',
    key: 'statusEndsAt',
    width: 170,
    render(row) {
      const t = (row as any).statusEndsAt
      return h('span', t ? dayjs(t).format('YYYY-MM-DD HH:mm') : '永久')
    },
  },
  {
    title: '操作',
    key: 'actions',
    width: 100,
    render(row) {
      return h(
        NButton,
        {
          size: 'small',
          type: 'success',
          ghost: true,
          onClick: () => handleUnban(row),
        },
        { default: () => '解封' },
      )
    },
  },
]

// Tab 切换懒加载
watch(activeTab, (tab) => {
  if (tab === 'banned' && !bannedUsers.value.length) fetchBannedUsers()
})

useHead({ title: '用户管理' })
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
