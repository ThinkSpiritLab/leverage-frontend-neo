<template>
  <!-- eslint-disable-next-line vue/no-v-html -->
  <div class="markdown-body" v-html="rendered" />
</template>

<script setup lang="ts">
import MarkdownIt from 'markdown-it'
import texmath from 'markdown-it-texmath'
import katex from 'katex'

const props = defineProps<{
  content: string
}>()

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
}).use(texmath, {
  engine: katex,
  delimiters: ['dollars', 'brackets'],  // 支持 $...$ 和 \(...\) 两种格式
  katexOptions: { throwOnError: false },
})

const rendered = computed(() => md.render(props.content || ''))
</script>

<style scoped>
.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4) {
  margin: 16px 0 8px;
  font-weight: 600;
}

.markdown-body :deep(p) {
  margin: 8px 0;
  line-height: 1.7;
}

.markdown-body :deep(pre) {
  background: #f6f8fa;
  padding: 12px;
  border-radius: 4px;
  overflow-x: auto;
}

.markdown-body :deep(code) {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.9em;
}

.markdown-body :deep(p code) {
  background: #f0f0f0;
  padding: 2px 6px;
  border-radius: 3px;
}

/* KaTeX inline/display 公式 */
.markdown-body :deep(eq) {
  display: inline;
}
.markdown-body :deep(section.eqno),
.markdown-body :deep(section.eq) {
  display: block;
  text-align: center;
  margin: 12px 0;
}
.markdown-body :deep(.katex-display) {
  overflow-x: auto;
  overflow-y: hidden;
}

.markdown-body :deep(blockquote) {
  border-left: 4px solid #ddd;
  margin: 0;
  padding-left: 16px;
  color: #666;
}

.markdown-body :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 12px 0;
}

.markdown-body :deep(th),
.markdown-body :deep(td) {
  border: 1px solid #ddd;
  padding: 8px 12px;
  text-align: left;
}

.markdown-body :deep(th) {
  background: #f5f5f5;
  font-weight: 600;
}
</style>
