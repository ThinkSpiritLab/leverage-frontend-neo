<template>
  <div class="draft-status" role="status">
    <NText :type="storageError ? 'error' : dirty ? 'warning' : 'default'" depth="2">
      {{ storageError ? '本地草稿保存失败，请先保存到服务器或复制代码' : dirty ? (restored ? '已恢复本地草稿 · 尚未保存到服务器' : '本地草稿已保存 · 尚未保存到服务器') : '与已保存版本一致' }}
    </NText>
    <NButton v-if="dirty" size="tiny" quaternary @click="discard">放弃草稿</NButton>
  </div>
</template>

<script setup lang="ts">
import { NButton, NText, useDialog } from 'naive-ui'
defineProps<{ dirty: boolean; restored: boolean; storageError: boolean }>()
const emit = defineEmits<{ discard: [] }>()
const dialog = useDialog()
function discard() {
  dialog.warning({ title: '放弃当前草稿？', content: '将恢复已保存版本。此操作无法撤销。', positiveText: '放弃草稿', negativeText: '继续编辑', onPositiveClick: () => emit('discard') })
}
</script>

<style scoped>
.draft-status { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; margin: 8px 0 16px; font-size: 13px; }
</style>
