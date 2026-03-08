<template>
  <div v-if="loading" class="loading-center">
    <NSpin size="large" />
  </div>
  <div v-else-if="problem" class="problem-page">
    <!-- 左侧：题目信息 -->
    <div class="problem-left">
      <div class="problem-header">
        <NH2 style="margin: 0">{{ problem.prefix }}{{ problem.logicId }}. {{ problem.title }}</NH2>
        <div class="problem-meta">
          <NTag type="info" :bordered="false">
            ⏱ 时间限制: {{ problem.timeLimit }}ms
          </NTag>
          <NTag type="warning" :bordered="false">
            💾 内存限制: {{ problem.memoryLimit }}MB
          </NTag>
        </div>
        <div v-if="problem.tags && problem.tags.length" class="problem-tags">
          <NTag
            v-for="tag in problem.tags"
            :key="tag.id"
            size="small"
            type="info"
            :bordered="false"
          >
            {{ tag.name }}
          </NTag>
        </div>
      </div>

      <NDivider />

      <MarkdownView :content="problem.content ?? problem.description ?? ''" />
    </div>

    <!-- 右侧：代码编辑器 + 提交 -->
    <div class="problem-right">
      <div class="editor-header">
        <NSelect
          v-model:value="language"
          :options="languageOptions"
          style="width: 180px"
        />
        <NTooltip trigger="hover" placement="top">
          <template #trigger>
            <NButton text style="font-size: 18px; line-height: 1" @click="toggleFullscreen">
              {{ isFullscreen ? '⊠' : '⛶' }}
            </NButton>
          </template>
          {{ isFullscreen ? '退出全屏 (Ctrl+Shift+F)' : '全屏编辑 (Ctrl+Shift+F)' }}
        </NTooltip>
      </div>

      <!-- 全屏遮罩 -->
      <Teleport to="body">
        <div v-if="isFullscreen" class="fullscreen-editor">
          <div class="fullscreen-header">
            <NSelect
              v-model:value="language"
              :options="languageOptions"
              style="width: 180px"
            />
            <NButton text style="font-size: 20px; color: #fff; line-height: 1" @click="toggleFullscreen">
              ⊠
            </NButton>
          </div>
          <div class="fullscreen-body">
            <CodeEditor
              v-model="code"
              :language="languageName"
              height="100%"
            />
          </div>
          <div class="fullscreen-footer">
            <span class="shortcut-hint">
              <kbd>Ctrl</kbd>+<kbd>Enter</kbd> 提交 &nbsp;·&nbsp;
              <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>F</kbd> 退出全屏
            </span>
            <NButton
              type="primary"
              :loading="submitting"
              size="large"
              @click="handleSubmit"
            >
              提交代码
            </NButton>
          </div>
        </div>
      </Teleport>

      <!-- 普通编辑器（全屏时隐藏） -->
      <template v-if="!isFullscreen">
        <CodeEditor
          v-model="code"
          :language="languageName"
          :height="isMobile ? '300px' : '450px'"
        />

        <div class="submit-area">
          <NButton
            type="primary"
            :loading="submitting"
            block
            size="large"
            @click="handleSubmit"
          >
            提交代码
          </NButton>
          <div class="shortcut-hint">
            <kbd>Ctrl</kbd>+<kbd>Enter</kbd> 提交 &nbsp;·&nbsp;
            <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>F</kbd> 全屏
          </div>
        </div>

        <!-- 提交结果 -->
        <div v-if="submissionId" class="submission-result">
          <NCard size="small">
            <div class="result-row">
              <span class="result-label">提交 ID：</span>
              <NButton text type="primary" @click="navigateTo(`/submissions/${submissionId}`)">
                #{{ submissionId }}
              </NButton>
            </div>
            <div class="result-row">
              <span class="result-label">状态：</span>
              <StatusTag :status="submissionStatus" />
              <NSpin v-if="polling" size="small" style="margin-left: 8px" />
            </div>
          </NCard>
        </div>
      </template>
    </div>
  </div>
  <div v-else>
    <NResult status="404" title="题目不存在" />
  </div>
</template>

<script setup lang="ts">
import type { Problem } from '~/types'

const { width } = useWindowSize()
const isMobile = computed(() => width.value < 768)

definePageMeta({
  layout: 'default',
  middleware: 'auth',
})

const route = useRoute()
const problemId = computed(() => Number(route.params.id))

const problemsApi = useProblemsApi()
const submissionsApi = useSubmissionsApi()

const problem = ref<Problem | null>(null)
const loading = ref(true)

const language = ref(1) // 1=C++
const code = ref('')
const submitting = ref(false)
const submissionId = ref<number | null>(null)
const submissionStatus = ref(0)
const polling = ref(false)

// 全屏状态
const isFullscreen = ref(false)

function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value
}

// 语言枚举数字与原版兼容：cpp=1, java=6, python3=9, javascript=10
const languageOptions = [
  { label: '🔵 C++', value: 1 },
  { label: '☕ Java', value: 6 },
  { label: '🐍 Python 3', value: 9 },
  { label: '🟡 JavaScript', value: 10 },
]

const LANGUAGE_INT_TO_NAME: Record<number, string> = {
  0: 'c', 1: 'cpp', 6: 'java', 7: 'kotlin',
  8: 'python', 9: 'python', 10: 'javascript', 11: 'typescript',
}

// CodeEditor 组件需要字符串形式的语言名
const languageName = computed(() => LANGUAGE_INT_TO_NAME[language.value] ?? 'cpp')

onMounted(async () => {
  try {
    problem.value = (await problemsApi.get(problemId.value)).data
  }
  catch (e) {
    console.error(e)
  }
  finally {
    loading.value = false
  }

  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  if (pollTimer) clearTimeout(pollTimer)
  document.removeEventListener('keydown', handleKeydown)
})

function handleKeydown(e: KeyboardEvent) {
  const isMac = navigator.platform.toUpperCase().includes('MAC')
  const ctrl = isMac ? e.metaKey : e.ctrlKey

  // Ctrl/Cmd + Enter → 提交代码
  if (ctrl && !e.shiftKey && e.key === 'Enter') {
    e.preventDefault()
    handleSubmit()
    return
  }

  // Ctrl/Cmd + Shift + F → 全屏切换
  if (ctrl && e.shiftKey && e.key === 'F') {
    e.preventDefault()
    toggleFullscreen()
    return
  }

  // Escape → 退出全屏
  if (e.key === 'Escape' && isFullscreen.value) {
    isFullscreen.value = false
  }
}

let pollTimer: ReturnType<typeof setTimeout> | null = null

async function handleSubmit() {
  if (!code.value.trim()) return
  submitting.value = true
  submissionId.value = null
  submissionStatus.value = 0
  if (pollTimer) clearTimeout(pollTimer)

  try {
    const sub = await submissionsApi.create({
      problemId: problemId.value,
      language: language.value,
      code: code.value,
    })
    const newSub = sub.data
    submissionId.value = newSub.id
    submissionStatus.value = newSub.status
    startPolling(newSub.id)
    // 提交成功后跳转到提交详情页
    navigateTo(`/submissions/${newSub.id}`)
  }
  catch (e) {
    console.error(e)
  }
  finally {
    submitting.value = false
  }
}

function startPolling(id: number) {
  if (submissionStatus.value >= 2) return
  polling.value = true

  const poll = async () => {
    try {
      const res = await submissionsApi.getStatus(id)
      submissionStatus.value = res.data.status
      // status >= 9 表示仍在评测中（PENDING=9, JUDGING=10, COMPILING=11）
      if (res.data.status >= 9) {
        pollTimer = setTimeout(poll, 2000)
      }
      else {
        polling.value = false
      }
    }
    catch {
      polling.value = false
    }
  }

  pollTimer = setTimeout(poll, 2000)
}

useHead(computed(() => ({ title: problem.value?.title ? `${problem.value.title} — Leverage OJ` : '题目 — Leverage OJ' })))
</script>

<style scoped>
.loading-center {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.problem-page {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.problem-left {
  flex: 0 0 55%;
  min-width: 0;
}

.problem-right {
  flex: 0 0 calc(45% - 24px);
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: sticky;
  top: 24px;
}

.problem-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.problem-meta {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.problem-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.submit-area {
  margin-top: 4px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.submission-result {
  margin-top: 4px;
}

.result-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.result-row:last-child {
  margin-bottom: 0;
}

.result-label {
  color: #666;
  font-size: 14px;
  min-width: 72px;
}

/* 快捷键提示 */
.shortcut-hint {
  font-size: 12px;
  color: #999;
  text-align: center;
  user-select: none;
}

.shortcut-hint kbd {
  display: inline-block;
  padding: 1px 5px;
  border: 1px solid #ccc;
  border-radius: 3px;
  font-family: monospace;
  font-size: 11px;
  background: #f5f5f5;
  color: #555;
  box-shadow: 0 1px 0 #ccc;
}

/* 移动端响应式 */
@media (max-width: 767px) {
  .problem-page {
    flex-direction: column;
    gap: 16px;
  }

  .problem-left {
    flex: none;
    width: 100%;
  }

  .problem-right {
    flex: none;
    width: 100%;
    position: static; /* 移除 sticky，避免移动端滚动问题 */
    min-height: 200px;
  }
}

/* 全屏模式 */
.fullscreen-editor {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: #282c34; /* oneDark 背景色 */
  display: flex;
  flex-direction: column;
}

.fullscreen-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: #21252b;
  border-bottom: 1px solid #3e4451;
}

.fullscreen-body {
  flex: 1;
  overflow: hidden;
}

.fullscreen-body :deep(.code-editor) {
  border: none;
  border-radius: 0;
}

.fullscreen-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: #21252b;
  border-top: 1px solid #3e4451;
}

.fullscreen-footer .shortcut-hint {
  color: #888;
}

.fullscreen-footer .shortcut-hint kbd {
  background: #3e4451;
  border-color: #555;
  color: #abb2bf;
  box-shadow: 0 1px 0 #555;
}
</style>
