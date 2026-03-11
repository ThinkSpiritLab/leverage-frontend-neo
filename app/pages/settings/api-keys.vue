<template>
  <div class="api-keys-page">
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px">
      <NH2 style="margin: 0">API 密钥管理</NH2>
      <NButton type="primary" @click="showCreateModal = true">创建密钥</NButton>
    </div>

    <NDataTable
      :columns="columns"
      :data="keys"
      :loading="loading"
      :row-key="(row: ApiKey) => row.id"
      :bordered="false"
    />

    <!-- 创建密钥弹窗 -->
    <NModal
      v-model:show="showCreateModal"
      preset="card"
      title="创建 API 密钥"
      style="width: 440px"
      :mask-closable="false"
    >
      <NInput
        v-model:value="newKeyName"
        placeholder="密钥名称（如：生产环境）"
        :disabled="creating"
        @keydown.enter="handleCreate"
      />
      <div style="margin-top: 16px; text-align: right">
        <NButton :disabled="!newKeyName.trim() || creating" type="primary" :loading="creating" @click="handleCreate">
          创建
        </NButton>
      </div>
    </NModal>

    <!-- 密钥展示弹窗（一次性） -->
    <NModal
      v-model:show="showKeyModal"
      preset="card"
      title="密钥已创建"
      style="width: 520px"
      :mask-closable="false"
      :closable="false"
    >
      <NAlert type="warning" style="margin-bottom: 16px">
        此密钥只显示一次，请立即保存
      </NAlert>
      <NInput :value="createdKey" readonly>
        <template #suffix>
          <NButton text size="small" @click="copyKey">复制</NButton>
        </template>
      </NInput>
      <div style="margin-top: 16px; text-align: right">
        <NButton type="primary" @click="showKeyModal = false">我已保存</NButton>
      </div>
    </NModal>

    <!-- 撤销确认弹窗 -->
    <NModal
      v-model:show="showRevokeModal"
      preset="card"
      title="撤销密钥"
      style="width: 400px"
    >
      <NText>确定要撤销密钥 <NText strong>{{ revokeTarget?.name }}</NText> 吗？此操作不可恢复。</NText>
      <div style="margin-top: 16px; text-align: right; display: flex; gap: 8px; justify-content: flex-end">
        <NButton @click="showRevokeModal = false">取消</NButton>
        <NButton type="error" :loading="revoking" @click="handleRevoke">确认撤销</NButton>
      </div>
    </NModal>
  </div>
</template>

<script setup lang="ts">
import { h } from 'vue'
import { NAlert, NButton, NDataTable, NInput, NModal, NTag, NText, useMessage } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import type { ApiKey } from '~/composables/api/apiKeys'

definePageMeta({ layout: 'default', middleware: 'auth' })

const apiKeysApi = useApiKeysApi()
const message = useMessage()

const keys = ref<ApiKey[]>([])
const loading = ref(false)

// 创建相关
const showCreateModal = ref(false)
const newKeyName = ref('')
const creating = ref(false)
const showKeyModal = ref(false)
const createdKey = ref('')

// 撤销相关
const showRevokeModal = ref(false)
const revokeTarget = ref<ApiKey | null>(null)
const revoking = ref(false)

function formatDate(dateStr: string | null) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN')
}

function maskKeyPrefix(keyPrefix: string) {
  if (!keyPrefix) return '-'
  if (keyPrefix.length <= 8) return keyPrefix
  return `${keyPrefix.slice(0, 8)}...${keyPrefix.slice(-4)}`
}

const columns: DataTableColumns<ApiKey> = [
  { title: '名称', key: 'name' },
  {
    title: '密钥标识',
    key: 'keyPrefix',
    render: row => h(NText, { depth: 3 }, { default: () => maskKeyPrefix(row.keyPrefix) }),
  },
  { title: '创建时间', key: 'createdAt', render: row => formatDate(row.createdAt) },
  { title: '最后使用', key: 'lastUsedAt', render: row => formatDate(row.lastUsedAt) },
  {
    title: '操作',
    key: 'actions',
    render(row) {
      if (row.revokedAt) {
        return h(NTag, { size: 'small', type: 'error' }, { default: () => '已撤销' })
      }
      return h(NButton, {
        size: 'small',
        type: 'error',
        text: true,
        onClick: () => {
          revokeTarget.value = row
          showRevokeModal.value = true
        },
      }, { default: () => '撤销' })
    },
  },
]

async function fetchKeys() {
  loading.value = true
  try {
    const res = await apiKeysApi.list()
    keys.value = (res as any).data ?? []
  }
  catch {
    message.error('获取密钥列表失败')
  }
  finally {
    loading.value = false
  }
}

async function handleCreate() {
  const name = newKeyName.value.trim()
  if (!name) return
  creating.value = true
  try {
    const res = await apiKeysApi.create(name)
    const data = (res as any).data
    createdKey.value = data.key
    showCreateModal.value = false
    newKeyName.value = ''
    showKeyModal.value = true
    fetchKeys()
  }
  catch {
    message.error('创建密钥失败')
  }
  finally {
    creating.value = false
  }
}

async function handleRevoke() {
  if (!revokeTarget.value) return
  revoking.value = true
  try {
    await apiKeysApi.revoke(revokeTarget.value.id)
    message.success('密钥已撤销')
    showRevokeModal.value = false
    revokeTarget.value = null
    fetchKeys()
  }
  catch {
    message.error('撤销密钥失败')
  }
  finally {
    revoking.value = false
  }
}

async function copyKey() {
  try {
    await navigator.clipboard.writeText(createdKey.value)
    message.success('已复制到剪贴板')
  }
  catch {
    message.error('复制失败，请手动复制')
  }
}

onMounted(fetchKeys)
</script>

<style scoped>
.api-keys-page {
  max-width: 960px;
  margin: 0 auto;
}
</style>
