import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router'
import { useAuthStore } from '~/stores/auth'

export interface CodeDraft { code: string; language: string; title: string }
interface Snapshot { key: string | null; data: CodeDraft }

/** Local code recovery only. Never store webhook secrets, tokens or API keys. */
export function useCodeDraft(read: () => CodeDraft, apply: (draft: CodeDraft) => void) {
  const auth = useAuthStore()
  const dirty = ref(false)
  const restored = ref(false)
  const storageError = ref(false)
  let key: string | null = null
  let baseline = ''
  const serialize = (value: CodeDraft) => JSON.stringify({ code: value.code, language: value.language, title: value.title })
  function persist() {
    if (!key) return
    dirty.value = serialize(read()) !== baseline
    try {
      if (dirty.value) localStorage.setItem(key, serialize(read()))
      else localStorage.removeItem(key)
      storageError.value = false
    }
    catch { storageError.value = true }
  }
  watch(read, persist, { deep: true, flush: 'sync' })

  function load(scope: string, initial: CodeDraft) {
    // Invalidate the previous key before applying a different game/server response.
    key = null
    baseline = serialize(initial)
    apply(initial)
    dirty.value = false
    restored.value = false
    storageError.value = false
    if (!auth.user?.id) return
    const nextKey = `leverage:code-draft:${auth.user.id}:${scope}`
    try {
      const stored = localStorage.getItem(nextKey)
      if (stored) {
        const value: unknown = JSON.parse(stored)
        if (value && typeof value === 'object' && 'code' in value && 'language' in value && 'title' in value
          && typeof value.code === 'string' && typeof value.language === 'string' && typeof value.title === 'string') {
          apply({ code: value.code, language: value.language, title: value.title })
          restored.value = serialize(read()) !== baseline
        }
      }
    }
    catch { storageError.value = true }
    key = nextKey
    dirty.value = serialize(read()) !== baseline
  }
  function capture(): Snapshot { return { key, data: { ...read() } } }
  function markSaved(snapshot: Snapshot) {
    if (key !== snapshot.key || !key) return
    baseline = serialize(snapshot.data)
    restored.value = false
    persist() // Preserve edits made while the save request was in flight.
  }
  function discard() {
    if (!key || !baseline) return
    const initial = JSON.parse(baseline) as CodeDraft
    apply(initial)
    restored.value = false
    persist()
  }
  watch(() => auth.user?.id, () => {
    // Do not briefly render the previous account's private code after logout/switch.
    key = null
    baseline = ''
    apply({ code: '', language: 'python', title: '' })
    dirty.value = false
    restored.value = false
    storageError.value = false
  }, { flush: 'sync' })

  const canLeave = () => !dirty.value || !storageError.value
    || window.confirm('本地草稿保存失败，离开会丢失未保存的代码。仍要离开吗？')
  onBeforeRouteLeave(canLeave)
  onBeforeRouteUpdate(canLeave)
  const beforeUnload = (event: BeforeUnloadEvent) => {
    if (dirty.value && storageError.value) { event.preventDefault(); event.returnValue = '' }
  }
  onMounted(() => window.addEventListener('beforeunload', beforeUnload))
  onBeforeUnmount(() => window.removeEventListener('beforeunload', beforeUnload))
  return { dirty, restored, storageError, load, capture, markSaved, discard, canLeave }
}
