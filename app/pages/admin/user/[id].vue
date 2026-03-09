<template>
  <div class="admin-user-detail">
    <div class="page-header">
      <NSpace align="center">
        <NButton text @click="navigateTo('/admin/users')">
          ← 返回用户列表
        </NButton>
        <NH2 style="margin: 0">
          {{ user?.username || '用户详情' }}
        </NH2>
      </NSpace>
    </div>

    <NSpin :show="loading">
      <!-- 统计卡片 -->
      <NGrid v-if="user" :cols="3" :x-gap="12" style="margin-bottom: 16px">
        <NGridItem>
          <NCard>
            <NStatistic label="通过数" :value="user.accepts ?? 0" />
          </NCard>
        </NGridItem>
        <NGridItem>
          <NCard>
            <NStatistic label="提交数" :value="user.submits ?? 0" />
          </NCard>
        </NGridItem>
        <NGridItem>
          <NCard>
            <NStatistic label="用户 ID" :value="user.id" />
          </NCard>
        </NGridItem>
      </NGrid>

      <NTabs v-model:value="activeTab" type="line" animated>
        <!-- ===== 基本信息 Tab ===== -->
        <NTabPane name="info" tab="基本信息">
          <NCard v-if="user" style="max-width: 700px; margin-top: 16px">
            <NForm :model="editForm" label-placement="left" label-width="90px">
              <NGrid :cols="2" :x-gap="24">
                <NGridItem>
                  <NFormItem label="用户名">
                    <NInput :value="user.username" disabled />
                  </NFormItem>
                  <NFormItem label="邮箱">
                    <NInput v-model:value="editForm.email" placeholder="输入邮箱" />
                  </NFormItem>
                  <NFormItem label="学号">
                    <NInput v-model:value="editForm.studentId" placeholder="输入学号" />
                  </NFormItem>
                  <NFormItem label="注册时间">
                    <NInput :value="fmtTime(user.createdAt)" disabled />
                  </NFormItem>
                </NGridItem>
                <NGridItem>
                  <NFormItem label="真实姓名">
                    <NInput v-model:value="editForm.certifiedName" placeholder="输入真实姓名" />
                  </NFormItem>
                  <NFormItem label="昵称">
                    <NInput v-model:value="editForm.nickname" placeholder="输入昵称" />
                  </NFormItem>
                  <NFormItem label="学院">
                    <NInput v-model:value="editForm.college" placeholder="输入学院" />
                  </NFormItem>
                  <NFormItem label="专业">
                    <NInput v-model:value="editForm.profession" placeholder="输入专业" />
                  </NFormItem>
                  <NFormItem label="年级">
                    <NInput v-model:value="editForm.grade" placeholder="输入年级" />
                  </NFormItem>
                </NGridItem>
              </NGrid>
            </NForm>
            <NSpace>
              <NButton type="primary" :loading="saving" @click="handleSaveInfo">保存信息</NButton>
            </NSpace>
          </NCard>
        </NTabPane>

        <!-- ===== 提交记录 Tab ===== -->
        <NTabPane name="submissions" tab="提交记录">
          <div style="margin-top: 16px">
            <NDataTable
              :columns="submissionColumns"
              :data="submissions"
              :loading="submissionsLoading"
              :row-key="(row: any) => row.id"
              size="small"
            />
            <NPagination
              v-model:page="submissionPage"
              :page-count="submissionPageCount"
              style="margin-top: 12px; justify-content: flex-end"
              @update:page="fetchSubmissions"
            />
          </div>
        </NTabPane>

        <!-- ===== 权限 Tab ===== -->
        <NTabPane name="role" tab="权限">
          <NCard v-if="user" style="max-width: 400px; margin-top: 16px">
            <NForm label-placement="left" label-width="90px">
              <NFormItem label="用户角色">
                <NSelect
                  v-model:value="roleForm.role"
                  :options="roleOptions"
                  :disabled="isEditingSelf"
                  style="width: 200px"
                />
              </NFormItem>
            </NForm>
            <NText v-if="isEditingSelf" depth="3" style="display: block; margin-bottom: 8px">
              不能修改自己的角色，避免误降级。
            </NText>
            <NButton type="primary" :loading="roleSaving" :disabled="isEditingSelf" @click="handleSaveRole">保存权限</NButton>
          </NCard>
        </NTabPane>

        <!-- ===== 元数据 Tab ===== -->
        <NTabPane name="meta" tab="元数据">
          <NCard v-if="user" style="margin-top: 16px">
            <NScrollbar style="max-height: 600px">
              <pre style="font-size: 12px; margin: 0; white-space: pre-wrap;">{{ JSON.stringify(user, null, 2) }}</pre>
            </NScrollbar>
          </NCard>
        </NTabPane>

        <!-- ===== 封号状态 Tab ===== -->
        <NTabPane name="ban" tab="封号状态">
          <NCard v-if="user" style="max-width: 500px; margin-top: 16px">
            <NSpace vertical>
              <NDescriptions :column="1" label-placement="left" bordered>
                <NDescriptionsItem label="当前状态">
                  <NTag :type="isBanned ? 'error' : 'success'" size="small">
                    {{ isBanned ? '已封禁' : '正常' }}
                  </NTag>
                </NDescriptionsItem>
              </NDescriptions>

              <NForm label-placement="left" label-width="90px">
                <NFormItem label="封禁原因">
                  <NInput
                    v-model:value="banReason"
                    type="textarea"
                    placeholder="输入封禁原因（可选）"
                    :rows="3"
                  />
                </NFormItem>
                <NFormItem v-if="!isBanned" label="截止时间">
                  <NDatePicker
                    v-model:value="banEndsAt"
                    type="datetime"
                    clearable
                    style="width: 100%"
                    placeholder="选择封禁截止时间（可选）"
                  />
                </NFormItem>
              </NForm>

              <NSpace>
                <NButton
                  v-if="!isBanned"
                  type="error"
                  :loading="banLoading"
                  @click="handleBan(true)"
                >
                  封禁用户
                </NButton>
                <NButton
                  v-else
                  type="success"
                  :loading="banLoading"
                  @click="handleBan(false)"
                >
                  解封用户
                </NButton>
              </NSpace>
            </NSpace>
          </NCard>
        </NTabPane>
      </NTabs>
    </NSpin>

    <!-- 重置密码弹窗 -->
    <NModal v-model:show="showPasswordModal" title="重置密码" preset="dialog" style="width: 400px">
      <NForm label-placement="left" label-width="90px" style="margin-top: 12px">
        <NFormItem label="新密码">
          <NInput v-model:value="newPassword" type="password" placeholder="输入新密码" show-password-on="click" />
        </NFormItem>
      </NForm>
      <template #action>
        <NSpace justify="end">
          <NButton @click="showPasswordModal = false">取消</NButton>
          <NButton type="primary" :loading="passwordSaving" @click="handleResetPassword">确认重置</NButton>
        </NSpace>
      </template>
    </NModal>

    <!-- 右上角操作按钮 -->
    <div v-if="user" style="position: fixed; top: 72px; right: 24px;">
      <NButton type="warning" ghost @click="showPasswordModal = true">重置密码</NButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { h } from 'vue'
import { NButton, NTag, useMessage } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import dayjs from 'dayjs'
import { STATUS_LABEL, STATUS_COLOR } from '~/types'
import type { User } from '~/types'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const route = useRoute()
const userId = Number(route.params.id)
const usersApi = useUsersApi()
const submissionsApi = useSubmissionsApi()
const authStore = useAuthStore()
const message = useMessage()

// ── 基本数据 ──
const user = ref<User | null>(null)
const loading = ref(false)
const activeTab = ref('info')
const isBanned = ref(false)

function fmtTime(t?: string) {
  return t ? dayjs(t).format('YYYY-MM-DD HH:mm') : '-'
}

async function fetchUser() {
  loading.value = true
  try {
    const res = await usersApi.get(userId)
    user.value = res.data
    editForm.value.email = res.data.email || ''
    editForm.value.studentId = res.data.studentId || ''
    editForm.value.certifiedName = res.data.certifiedName || ''
    editForm.value.nickname = res.data.nickname || ''
    editForm.value.college = res.data.college || ''
    editForm.value.profession = res.data.profession || ''
    editForm.value.grade = res.data.grade || ''
    // authority 是后端字段名（superadmin→sa），role 是前端/DTO 名
    const rawRole = res.data.role ?? res.data.authority ?? 'user'
    roleForm.value.role = (rawRole === 'superadmin' ? 'sa' : rawRole) as any
    isBanned.value = res.data.status === 2 || !!res.data.banned
    // 显示已有的封禁原因
    if (isBanned.value && res.data.remarks) {
      banReason.value = res.data.remarks
    }
  }
  catch (e) { console.error(e) }
  finally { loading.value = false }
}

onMounted(fetchUser)

// ── 基本信息编辑 ──
const editForm = ref({ email: '', studentId: '', certifiedName: '', nickname: '', college: '', profession: '', grade: '' })
const saving = ref(false)

async function handleSaveInfo() {
  saving.value = true
  try {
    await usersApi.update(userId, editForm.value)
    message.success('用户信息已更新')
    fetchUser()
  }
  catch (e: any) { message.error(e?.message || '更新失败') }
  finally { saving.value = false }
}

// ── 提交记录 ──
const submissions = ref<any[]>([])
const submissionsLoading = ref(false)
const submissionPage = ref(1)
const submissionPageCount = ref(1)
const submissionPerPage = 20

async function fetchSubmissions() {
  submissionsLoading.value = true
  try {
    const res = await submissionsApi.list({
      userId,
      page: submissionPage.value,
      perPage: submissionPerPage,
    })
    const data = res.data as any
    submissions.value = data?.items || data || []
    if (data?.total) {
      submissionPageCount.value = Math.ceil(data.total / submissionPerPage)
    }
  }
  catch (e) { console.error(e) }
  finally { submissionsLoading.value = false }
}

const submissionColumns: DataTableColumns<any> = [
  { title: 'ID', key: 'id', width: 70 },
  { title: '题目', key: 'problem', render: r => r.problem?.title || r.problemId },
  {
    title: '状态',
    key: 'status',
    width: 120,
    render: r => h(NTag, { type: STATUS_COLOR[r.status] as any || 'default', size: 'small' },
      { default: () => STATUS_LABEL[r.status] || r.status }),
  },
  { title: '语言', key: 'language', width: 100 },
  {
    title: '时间',
    key: 'createdAt',
    width: 160,
    render: r => dayjs(r.createdAt).format('YYYY-MM-DD HH:mm'),
  },
]

// ── 权限 ──
const roleForm = ref<{ role: User['role'] }>({ role: 'user' })
const roleSaving = ref(false)

const roleOptions = [
  { label: '管理员 (Admin)', value: 'admin' },
  { label: '二级管理员 (Supervisor)', value: 'supervisor' },
  { label: '普通用户 (User)', value: 'user' },
  { label: '访客 (Guest)', value: 'guest' },
]

const isEditingSelf = computed(() => authStore.user?.id === userId)

async function handleSaveRole() {
  if (isEditingSelf.value) {
    message.warning('不能修改自己的角色')
    return
  }
  roleSaving.value = true
  try {
    await usersApi.update(userId, { role: roleForm.value.role })
    message.success('权限已更新')
    fetchUser()
  }
  catch (e: any) { message.error(e?.message || '更新失败') }
  finally { roleSaving.value = false }
}

// ── 封号 ──
const banReason = ref('')
const banEndsAt = ref<number | null>(null)
const banLoading = ref(false)

async function handleBan(banned: boolean) {
  banLoading.value = true
  try {
    await usersApi.update(userId, {
      status: banned ? 2 : 0,
      remarks: banned ? (banReason.value || undefined) : undefined,
      statusEndsAt: banned ? (banEndsAt.value ? dayjs(banEndsAt.value).toISOString() : null) : null,
    } as any)
    message.success(banned ? '用户已封禁' : '用户已解封')
    isBanned.value = banned
    banReason.value = ''
    banEndsAt.value = null
  }
  catch (e: any) { message.error(e?.message || '操作失败') }
  finally { banLoading.value = false }
}

// ── 重置密码 ──
const showPasswordModal = ref(false)
const newPassword = ref('')
const passwordSaving = ref(false)

async function handleResetPassword() {
  if (!newPassword.value) {
    message.warning('请输入新密码')
    return
  }
  passwordSaving.value = true
  try {
    await usersApi.changeUserPassword(userId, newPassword.value)
    message.success('密码已重置')
    showPasswordModal.value = false
    newPassword.value = ''
  }
  catch (e: any) { message.error(e?.message || '重置失败') }
  finally { passwordSaving.value = false }
}

// ── Tab 切换时懒加载 ──
watch(activeTab, (tab) => {
  if (tab === 'submissions' && !submissions.value.length) fetchSubmissions()
})

useHead(computed(() => ({ title: user.value?.username ? `${user.value.username}` : '用户管理' })))
</script>

<style scoped>
.admin-user-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 12px;
}
</style>
