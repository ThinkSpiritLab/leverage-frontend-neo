import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import { createRequire } from 'node:module'
import ts from 'typescript'
import { reactive, ref, watch } from 'vue'
const require = createRequire(import.meta.url)
const stored = new Map()
const auth = reactive({ user: { id: 1 } })
const form = reactive({ code: '', language: 'python', title: '' })
const hooks = []
let blocked = false
const storage = {
  getItem: key => stored.get(key) ?? null,
  setItem: (key, value) => { if (blocked) throw new Error('quota'); stored.set(key, value) },
  removeItem: key => { if (blocked) throw new Error('quota'); stored.delete(key) },
}
const file = new URL('../app/composables/useCodeDraft.ts', import.meta.url)
const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
const module = { exports: {} }
vm.runInNewContext(source, {
  module, exports: module.exports, localStorage: storage,
  window: { confirm: () => false },
  require: name => name === 'vue' ? { reactive, ref, watch, onMounted: () => {}, onBeforeUnmount: () => {} }
    : name === 'vue-router' ? { onBeforeRouteLeave: fn => hooks.push(fn), onBeforeRouteUpdate: fn => hooks.push(fn) }
      : name === '~/stores/auth' ? { useAuthStore: () => auth } : require(name),
}, { filename: file.pathname })
const draft = module.exports.useCodeDraft(() => ({ ...form }), value => Object.assign(form, value))
const initial = { code: 'server', language: 'python', title: 'My Bot' }
draft.load('bot:1', initial)
form.code = 'unsaved'
assert.equal(draft.dirty.value, true)
assert.equal(JSON.parse(stored.get('leverage:code-draft:1:bot:1')).code, 'unsaved')
draft.load('bot:1', initial)
assert.equal(form.code, 'unsaved')
assert.equal(draft.restored.value, true)
const saving = draft.capture()
form.code = 'typed while saving'
draft.markSaved(saving)
assert.equal(draft.dirty.value, true)
assert.equal(JSON.parse(stored.get(saving.key)).code, 'typed while saving')
draft.markSaved(draft.capture())
assert.equal(draft.dirty.value, false)
assert.equal(stored.has(saving.key), false)
form.code = 'private draft'
auth.user = { id: 2 }
assert.equal(form.code, '')
draft.load('bot:1', { ...initial, code: 'other account server' })
assert.equal(form.code, 'other account server')
draft.markSaved(saving)
assert.equal(form.code, 'other account server')
blocked = true
form.code = 'not persisted'
assert.equal(draft.storageError.value, true)
assert.equal(hooks[0](), false)
blocked = false
form.code = 'persisted'
assert.equal(hooks[0](), true)
draft.discard()
assert.equal(form.code, 'other account server')
auth.user = null
assert.equal(form.code, '')
assert.equal(JSON.parse(stored.get('leverage:code-draft:1:bot:1')).code, 'private draft')
console.log('PASS code drafts: recovery, scope isolation, account clearing, in-flight saves and storage-failure leave protection')
