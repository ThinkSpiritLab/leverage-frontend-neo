<template>
  <div class="admin-setting">
    <div class="page-header">
      <NH2 style="margin: 0">系统设置</NH2>
      <NButton type="primary" :loading="saving" @click="saveAll">
        保存所有更改
      </NButton>
    </div>

    <NSpin :show="loading">
      <NDataTable
        :columns="columns"
        :data="settings"
        :row-key="(row: any) => row.key"
        size="small"
        :pagination="false"
        bordered
      />
    </NSpin>
  </div>
</template>

<script setup lang="ts">
import { h, ref } from 'vue'
import { NSwitch, NInput, NTag, useMessage } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const settingsApi = useSettingsApi()
const message = useMessage()

const settings = ref<any[]>([])
const loading = ref(false)
const saving = ref(false)

// track dirty values
const dirtyKeys = ref<Set<string>>(new Set())

async function fetchSettings() {
  loading.value = true
  try {
    const res = await settingsApi.list()
    settings.value = (Array.isArray(res.data) ? res.data : []).map((s: any) => {
      const rawValue = s.valueString ?? ''
      return {
        ...s,
        _editValue: s.type === 'boolean' ? rawValue === 'true' : rawValue,
      }
    })
  }
  catch (e) {
    console.error(e)
  }
  finally {
    loading.value = false
  }
}

async function saveAll() {
  saving.value = true
  let success = 0
  let failed = 0

  for (const row of settings.value) {
    // save all rows that have been touched
    if (dirtyKeys.value.has(row.key)) {
      try {
        const payload = row.type === 'boolean' ? String(!!row._editValue) : String(row._editValue ?? '')
        await settingsApi.update(row.key, payload)
        row.valueString = payload
        success++
      }
      catch {
        failed++
      }
    }
  }

  dirtyKeys.value.clear()
  saving.value = false

  if (failed > 0) {
    message.warning(`${success} 项保存成功，${failed} 项失败`)
  }
  else if (success > 0) {
    message.success(`已保存 ${success} 项设置`)
  }
  else {
    message.info('没有需要保存的更改')
  }
}

const columns: DataTableColumns = [
  {
    title: 'Key',
    key: 'key',
    width: 220,
    render(row: any) {
      return h('code', { style: 'font-size: 13px' }, row.key)
    },
  },
  {
    title: 'Value',
    key: 'value',
    render(row: any) {
      const type = row.type as string
      if (type === 'boolean') {
        return h(NSwitch, {
          value: !!row._editValue,
          onUpdateValue: (v: boolean) => {
            row._editValue = v
            dirtyKeys.value.add(row.key)
          },
        })
      }
      return h(NInput, {
        value: String(row._editValue ?? ''),
        size: 'small',
        onUpdateValue: (v: string) => {
          row._editValue = v
          dirtyKeys.value.add(row.key)
        },
      })
    },
  },
  {
    title: '类型',
    key: 'type',
    width: 100,
    render(row: any) {
      return h(NTag, { size: 'small', bordered: false }, { default: () => row.type ?? 'string' })
    },
  },
  {
    title: '备注',
    key: 'note',
    render(row: any) {
      return h('span', { style: 'color: #999; font-size: 13px' }, row.note ?? '')
    },
  },
]

onMounted(fetchSettings)

useHead({ title: '系统设置' })
</script>

<style scoped>
.admin-setting {
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
