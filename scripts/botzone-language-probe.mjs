import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'

const source = fs.readFileSync('app/utils/botzone-language.ts', 'utf8')
const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
const result = {}
vm.runInNewContext(output, { exports: result })
const values = Array.from(result.BOTZONE_LANGUAGE_OPTIONS, option => option.value)
assert.deepEqual(values, ['python', 'cpp', 'javascript', 'typescript'])
assert.equal(result.botzoneLanguage(9), 'python')
assert.equal(result.botzoneLanguage('cpp17'), 'cpp')
assert.equal(result.botzoneLanguage('python3'), 'python')
assert.equal(result.botzoneLanguage('unknown'), 'unknown')
assert.equal(result.botzoneEditorLanguage('javascript'), 'javascript')
for (const file of ['app/pages/admin/compete/game/[id].vue', 'app/pages/compete/playground.vue', 'app/components/compete/ProgramSlot.vue']) {
  const page = fs.readFileSync(file, 'utf8')
  assert.ok(page.includes('BOTZONE_LANGUAGE_OPTIONS'), file)
  assert.ok(!page.includes("import { LANGUAGE_OPTIONS } from '~/types'"), file)
}
const oj = {}
const ojSource = fs.readFileSync('app/types/index.ts', 'utf8')
vm.runInNewContext(ts.transpileModule(ojSource, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports: oj })
assert.equal(oj.isFinalStatus(12), true, 'OLE must stop submission polling')
assert.equal(oj.isFinalStatus(13), true, 'SC must stop submission polling')
for (const status of [9, 10, 11]) assert.equal(oj.isFinalStatus(status), false)
assert.ok(oj.LANGUAGE_OPTIONS.some(option => option.value === 3), 'C++17 needs an explicit OJ option')
console.log('PASS Botzone language names, aliases, form bindings and OJ terminal statuses')
