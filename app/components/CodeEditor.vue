<template>
  <div ref="editorEl" class="code-editor" />
</template>

<script setup lang="ts">
import { Compartment, EditorState  } from '@codemirror/state'
import { EditorView, basicSetup } from 'codemirror'
import { cpp } from '@codemirror/lang-cpp'
import { java } from '@codemirror/lang-java'
import { python } from '@codemirror/lang-python'
import { javascript } from '@codemirror/lang-javascript'
import { oneDark } from '@codemirror/theme-one-dark'

const props = defineProps<{
  modelValue: string
  language: string // 'cpp' | 'c' | 'java' | 'python' | 'python2' | 'python3' | 'javascript' | 'typescript'
  readonly?: boolean
  height?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [string]
}>()

const { isDark } = useTheme()

const editorEl = ref<HTMLElement>()
let view: EditorView | null = null
const themeCompartment = new Compartment()
const languageCompartment = new Compartment()

function getLanguageExtension(lang: string) {
  switch (lang) {
    case 'cpp':
    case 'c':
      return cpp()
    case 'java':
      return java()
    case 'python':
    case 'python2':
    case 'python3':
      return python()
    case 'javascript':
    case 'typescript':
      return javascript()
    default:
      return cpp()
  }
}

function getThemeExtension(dark: boolean) {
  return dark ? oneDark : EditorView.baseTheme({})
}

function buildUpdateListener() {
  return EditorView.updateListener.of((update) => {
    if (update.docChanged) {
      emit('update:modelValue', update.state.doc.toString())
    }
  })
}

onMounted(() => {
  if (!editorEl.value) return
  view = new EditorView({
    state: EditorState.create({
      doc: props.modelValue,
      extensions: [
        basicSetup,
        languageCompartment.of(getLanguageExtension(props.language)),
        themeCompartment.of(getThemeExtension(isDark.value)),
        buildUpdateListener(),
        EditorView.editable.of(!props.readonly),
      ],
    }),
    parent: editorEl.value,
  })
})

// 动态切换主题（暗色/亮色）
watch(isDark, (dark) => {
  if (!view) return
  view.dispatch({
    effects: themeCompartment.reconfigure(getThemeExtension(dark)),
  })
})

// 监听 language 变化，只重配语言扩展
watch(() => props.language, () => {
  if (!view) return
  view.dispatch({
    effects: languageCompartment.reconfigure(getLanguageExtension(props.language)),
  })
})

// 外部 modelValue 变化时同步（避免光标跳动）
watch(() => props.modelValue, (val) => {
  if (!view) return
  const current = view.state.doc.toString()
  if (current !== val) {
    view.dispatch({
      changes: { from: 0, to: current.length, insert: val },
    })
  }
})

onUnmounted(() => view?.destroy())
</script>

<style scoped>
.code-editor {
  height: v-bind('props.height || "400px"');
  border: 1px solid #eee;
  border-radius: 4px;
  overflow: hidden;
}

.code-editor :deep(.cm-editor) {
  height: 100%;
}

.code-editor :deep(.cm-scroller) {
  overflow: auto;
}
</style>
