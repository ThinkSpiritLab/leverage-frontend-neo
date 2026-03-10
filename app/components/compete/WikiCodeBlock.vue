<template>
  <div class="wiki-code-block">
    <div class="code-header">
      <span class="code-lang">{{ langLabel }}</span>
      <div class="code-actions">
        <NButton v-if="tryable" size="tiny" type="primary" secondary @click="$emit('try-it', code)">
          ▶ 在 Playground 测试
        </NButton>
        <NButton size="tiny" text @click="copyCode">
          {{ copied ? '✓ 已复制' : '📋 复制' }}
        </NButton>
      </div>
    </div>
    <!-- Highlight.js-style syntax coloring via pre/code -->
    <pre class="code-body"><code>{{ code }}</code></pre>
    <div v-if="explanation" class="code-annotation">
      <span class="annotation-icon">💡</span>
      <span>{{ explanation }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { NButton } from 'naive-ui'

const props = defineProps<{
  code: string
  lang?: string
  explanation?: string
  tryable?: boolean
}>()

defineEmits<{ 'try-it': [code: string] }>()

const copied = ref(false)

const langLabel = {
  python: 'Python', cpp: 'C++', java: 'Java', javascript: 'JavaScript', go: 'Go',
}[props.lang || 'python'] || (props.lang || 'Code')

function copyCode() {
  navigator.clipboard.writeText(props.code).then(() => {
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  })
}
</script>

<style scoped>
.wiki-code-block {
  border: 1px solid #e0e0e6; border-radius: 8px; overflow: hidden;
  margin: 10px 0; font-size: 13px;
}
.code-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 6px 12px; background: #f5f5f7; border-bottom: 1px solid #e0e0e6;
}
.code-lang { font-size: 11px; font-weight: 700; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }
.code-actions { display: flex; gap: 8px; align-items: center; }
.code-body {
  margin: 0; padding: 14px 16px; background: #fafafa;
  font-family: 'Fira Code', 'Consolas', monospace; font-size: 12.5px;
  line-height: 1.7; white-space: pre; overflow-x: auto;
  max-height: 320px; overflow-y: auto;
}
.code-annotation {
  padding: 8px 12px; background: #fffbe6; border-top: 1px solid #ffe58f;
  font-size: 12px; display: flex; gap: 6px; align-items: flex-start;
}
.annotation-icon { flex-shrink: 0; }
</style>
