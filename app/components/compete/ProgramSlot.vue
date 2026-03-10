<template>
  <!-- Program Slot: collapsible, supports "write" or "import" modes -->
  <div class="program-slot" :class="{ 'slot-active': hasContent }">
    <div class="slot-header" @click="expanded = !expanded">
      <div class="slot-title">
        <span class="slot-icon">{{ icon }}</span>
        <span class="slot-name">{{ label }}</span>
        <NTag v-if="mode === 'import' && importedItem" size="small" type="success" :bordered="false">
          已引入
        </NTag>
        <NTag v-else-if="mode === 'write' && modelValue.trim()" size="small" type="info" :bordered="false">
          已编写
        </NTag>
        <NTag v-else size="small" type="default" :bordered="false">未配置</NTag>
      </div>
      <div class="slot-controls" @click.stop>
        <NRadioGroup v-model:value="mode" size="small" @update:value="onModeChange">
          <NRadioButton value="write">✏️ 自己写</NRadioButton>
          <NRadioButton value="import">📦 引入已有</NRadioButton>
        </NRadioGroup>
        <NButton text size="small" @click.stop="expanded = !expanded">
          {{ expanded ? '▲' : '▼' }}
        </NButton>
      </div>
    </div>

    <div v-show="expanded" class="slot-body">
      <!-- Write mode -->
      <template v-if="mode === 'write'">
        <NSpace align="center" style="margin-bottom:8px">
          <NSelect
            :value="lang"
            :options="LANGUAGE_OPTIONS"
            size="small"
            style="width:140px"
            @update:value="onLangChange"
          />
          <NButton size="small" text @click="insertTemplate">插入模板</NButton>
        </NSpace>
        <CodeEditor
          :model-value="modelValue"
          :language="editorLang"
          :height="compact ? '220px' : '320px'"
          @update:model-value="$emit('update:modelValue', $event)"
        />
      </template>

      <!-- Import mode -->
      <template v-else>
        <NInput
          v-model:value="searchText"
          placeholder="搜索名称..."
          size="small"
          clearable
          style="margin-bottom:8px"
          @update:value="onSearch"
        />
        <NSpin :show="searching">
          <div v-if="searchResults.length === 0 && searchText" class="slot-empty">无匹配结果</div>
          <div v-else-if="searchResults.length === 0" class="slot-empty">输入名称搜索</div>
          <div v-else class="slot-results">
            <div
              v-for="item in searchResults"
              :key="item.id"
              class="slot-result-card"
              :class="{ selected: importedItem?.id === item.id }"
              @click="selectImport(item)"
            >
              <div class="result-name">{{ item.name || item.title }}</div>
              <div class="result-meta">
                <NTag size="small" :bordered="false">{{ item.language || '—' }}</NTag>
                <span v-if="item.elo" style="color:#888;font-size:11px">⚡ {{ item.elo }}</span>
                <span v-if="item.type" style="color:#888;font-size:11px">{{ item.type }}</span>
              </div>
            </div>
          </div>
        </NSpin>

        <!-- Imported item card -->
        <NCard v-if="importedItem" size="small" style="margin-top:8px;border:2px solid #18a058">
          <NSpace align="center" justify="space-between">
            <div>
              <NText strong>{{ importedItem.name || importedItem.title }}</NText>
              <NTag size="small" style="margin-left:8px">{{ importedItem.language }}</NTag>
            </div>
            <NButton size="small" type="error" text @click="clearImport">移除</NButton>
          </NSpace>
          <!-- Option to override with local edits -->
          <NCheckbox v-model:checked="allowEdit" style="margin-top:8px;font-size:12px">
            在此基础上修改（将覆盖引入代码）
          </NCheckbox>
          <div v-if="allowEdit" style="margin-top:8px">
            <CodeEditor
              :model-value="modelValue"
              :language="editorLang"
              :height="compact ? '200px' : '280px'"
              @update:model-value="$emit('update:modelValue', $event)"
            />
          </div>
        </NCard>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { NTag, NButton, NRadioGroup, NRadioButton, NSelect, NInput, NCard, NText, NSpace, NSpin, NCheckbox } from 'naive-ui'
import { LANGUAGE_OPTIONS } from '~/types'

const props = defineProps<{
  label: string
  icon: string
  modelValue: string
  lang: string
  gameId?: number | null
  slotType: 'bot' | 'judge'  // determines what to search
  compact?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [string]
  'update:lang': [string]
  'update:importedId': [number | null]
}>()

const expanded = ref(true)
const mode = ref<'write' | 'import'>('write')
const searchText = ref('')
const searchResults = ref<any[]>([])
const searching = ref(false)
const importedItem = ref<any>(null)
const allowEdit = ref(false)

const hasContent = computed(() => {
  if (mode.value === 'write') return !!props.modelValue.trim()
  return !!importedItem.value
})

const editorLang = computed(() => {
  const m: Record<string, string> = { python: 'python', cpp: 'cpp', java: 'java', javascript: 'javascript', go: 'go', c: 'c' }
  return m[props.lang] || 'python'
})

const competeApi = useCompeteApi()

let searchTimer: ReturnType<typeof setTimeout> | null = null
function onSearch() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(doSearch, 300)
}

async function doSearch() {
  if (!searchText.value.trim()) { searchResults.value = []; return }
  searching.value = true
  try {
    if (props.slotType === 'bot') {
      const res = await competeApi.listGamers({ gameId: props.gameId ?? undefined, page: 1, perPage: 20 })
      const all = (res.data as any)?.items || res.data || []
      searchResults.value = all.filter((g: any) =>
        !g.disabled && g.type === 'code' &&
        (g.title || g.name || '').toLowerCase().includes(searchText.value.toLowerCase())
      ).slice(0, 8)
    }
    // for judge: search by game (TBD when user-created games exist)
  } catch (e) { console.error(e) }
  finally { searching.value = false }
}

function selectImport(item: any) {
  importedItem.value = item
  emit('update:importedId', item.id)
  // Pre-fill code with item's code for editing
  if (item.code) emit('update:modelValue', item.code)
  if (item.language) emit('update:lang', item.language)
}

function clearImport() {
  importedItem.value = null
  allowEdit.value = false
  emit('update:importedId', null)
}

function onModeChange(v: string) {
  if (v === 'write') clearImport()
}

function onLangChange(lang: string) {
  emit('update:lang', lang)
}

function insertTemplate() {
  const templates: Record<string, Record<string, string>> = {
    bot: {
      python: `import sys
import json

for line in sys.stdin:
    line = line.strip()
    if not line:
        continue
    data = json.loads(line)
    # data = BotInput (game-specific JSON)
    
    move = 0  # Replace with your logic
    
    # Optional debug output (will show in timeline):
    print(json.dumps({"move": move, "debug": f"Received: {data}"}))
    sys.stdout.flush()
`,
      cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    string line;
    while (getline(cin, line)) {
        if (line.empty()) continue;
        // Parse input JSON manually or with a JSON library
        // Your logic here
        cout << 0 << endl;  // Replace with your move
    }
    return 0;
}
`,
    },
    judge: {
      python: `import sys
import json

round_num = 0

for line in sys.stdin:
    line = line.strip()
    if not line:
        continue
    
    data = json.loads(line)
    round_num = data.get('round', round_num + 1)
    responses = data.get('responses', {})
    
    if not responses:
        # First call: initialize game
        result = {
            "commands": {
                "0": {"round": 1},  # Input for player 0
                "1": {"round": 1}   # Input for player 1
            },
            "display": {"round": 1},
            "verdict": "continue",
            "debug": f"Game started, round 1"
        }
    else:
        # Process player moves
        # responses = {"0": <move_0>, "1": <move_1>}
        
        if round_num >= 5:
            result = {
                "commands": {},
                "display": {"finished": True},
                "verdict": "finish",
                "scores": {"0": 1, "1": 0},  # Replace with actual scores
                "debug": "Game over"
            }
        else:
            result = {
                "commands": {
                    "0": {"round": round_num + 1},
                    "1": {"round": round_num + 1}
                },
                "display": {"round": round_num + 1},
                "verdict": "continue",
                "debug": f"Round {round_num} done, responses: {responses}"
            }
    
    print(json.dumps(result))
    sys.stdout.flush()
`,
    },
  }
  const tmpl = templates[props.slotType]?.[props.lang] || templates[props.slotType]?.python || ''
  emit('update:modelValue', tmpl)
}
</script>

<style scoped>
.program-slot {
  border: 1px solid #e0e0e6;
  border-radius: 8px;
  overflow: hidden;
  transition: border-color 0.2s;
}
.slot-active { border-color: #18a058; }
.slot-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: #fafafa;
  cursor: pointer;
  user-select: none;
  gap: 8px;
}
.slot-title { display: flex; align-items: center; gap: 8px; }
.slot-icon { font-size: 18px; }
.slot-name { font-weight: 600; font-size: 14px; }
.slot-controls { display: flex; align-items: center; gap: 8px; }
.slot-body { padding: 12px; }
.slot-empty { color: #aaa; font-size: 13px; text-align: center; padding: 16px 0; }
.slot-results { display: flex; flex-direction: column; gap: 6px; max-height: 200px; overflow-y: auto; }
.slot-result-card {
  padding: 8px 10px;
  border: 1px solid #e0e0e6;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
}
.slot-result-card:hover { border-color: #18a058; background: #f6ffed; }
.slot-result-card.selected { border-color: #18a058; background: #f0fff4; }
.result-name { font-weight: 600; font-size: 13px; margin-bottom: 4px; }
.result-meta { display: flex; align-items: center; gap: 6px; }
</style>
