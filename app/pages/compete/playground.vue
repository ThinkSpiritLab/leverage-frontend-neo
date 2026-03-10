<template>
  <div class="playground-page">
    <NBreadcrumb style="margin-bottom:12px">
      <NBreadcrumbItem @click="navigateTo('/compete')">竞技场</NBreadcrumbItem>
      <NBreadcrumbItem>Playground</NBreadcrumbItem>
    </NBreadcrumb>

    <NTabs v-model:value="activeTab" type="card" animated>
      <!-- ── Bot 测试 Tab ── -->
      <NTabPane name="bot" tab="🤖 Bot 测试">
        <NGrid :cols="12" :x-gap="16" :y-gap="12" style="margin-top:12px">
          <!-- 左侧配置 -->
          <NGridItem :span="4">
            <NSpace vertical :size="12">
              <!-- 游戏选择 -->
              <NCard title="选择游戏" size="small">
                <NSelect
                  v-model:value="botConfig.gameId"
                  :options="gameOptions"
                  placeholder="选择游戏..."
                  filterable
                  @update:value="onGameChange"
                />
              </NCard>

              <!-- 对手选择 -->
              <NCard title="选择对手" size="small">
                <NSpin :show="opponentsLoading">
                  <NEmpty v-if="!botConfig.gameId" description="请先选择游戏" style="padding:12px 0" />
                  <NSelect
                    v-else
                    v-model:value="botConfig.opponentGamerId"
                    :options="opponentOptions"
                    placeholder="选择对手 Bot..."
                    filterable
                  />
                </NSpin>
              </NCard>

              <!-- 语言选择 -->
              <NCard title="编程语言" size="small">
                <NSelect
                  v-model:value="botConfig.language"
                  :options="LANGUAGE_OPTIONS"
                />
              </NCard>

              <!-- 运行 -->
              <NButton
                type="primary"
                block
                :loading="runningBot"
                :disabled="!botConfig.gameId || !botConfig.opponentGamerId || !botCode.trim()"
                @click="runBotTest"
              >
                ▶ 运行测试
              </NButton>

              <!-- 发布 -->
              <NButton
                v-if="lastTestMatchId && lastTestGamerId"
                block
                secondary
                type="success"
                @click="showPublishModal = true"
              >
                🚀 满意了，发布为 Bot
              </NButton>
            </NSpace>
          </NGridItem>

          <!-- 中间：代码编辑器 -->
          <NGridItem :span="8">
            <NCard size="small" style="height:100%">
              <template #header>
                <NSpace align="center" justify="space-between">
                  <span>代码编辑器</span>
                  <NButton size="small" text @click="insertTemplate">插入模板</NButton>
                </NSpace>
              </template>
              <CodeEditor
                v-model="botCode"
                :language="editorLang"
                height="460px"
              />
            </NCard>
          </NGridItem>

          <!-- 测试结果（全宽） -->
          <NGridItem v-if="testMatchId" :span="12">
            <NCard title="📋 测试结果" size="small">
              <NSpace align="center" style="margin-bottom:12px">
                <NTag :type="testMatchStatusType" size="small">{{ testMatchStatusLabel }}</NTag>
                <NText depth="3" style="font-size:12px">对局 #{{ testMatchId }}</NText>
                <NButton size="small" text type="primary" @click="navigateTo(`/compete/matches/${testMatchId}`)">
                  查看完整对局 →
                </NButton>
                <NSpin v-if="testMatchStatus === 1" size="small" />
              </NSpace>

              <!-- 回合日志 -->
              <div v-if="testMatchLog" class="match-log">
                <div
                  v-for="(round, i) in testMatchLog.rounds"
                  :key="i"
                  class="log-round"
                >
                  <div class="log-round-header">
                    <NTag size="small" :bordered="false" type="info">第 {{ round.round }} 轮</NTag>
                  </div>
                  <div class="log-section">
                    <span class="log-label">📥 BotInput</span>
                    <pre class="log-pre">{{ JSON.stringify(round.judgeCmd?.content ?? {}, null, 2) }}</pre>
                  </div>
                  <div class="log-section">
                    <span class="log-label">📤 BotOutput</span>
                    <pre class="log-pre">{{ JSON.stringify(round.botResponses ?? {}, null, 2) }}</pre>
                  </div>
                  <div v-if="round.judgeCmd?.display" class="log-section">
                    <span class="log-label">🖼 Display</span>
                    <pre class="log-pre">{{ JSON.stringify(round.judgeCmd.display, null, 2) }}</pre>
                  </div>
                </div>

                <NAlert
                  v-if="testMatchLog.finalResult"
                  :type="myTestPlayerWon ? 'success' : 'error'"
                  :show-icon="false"
                  style="margin-top:8px"
                >
                  最终结果：{{ JSON.stringify(testMatchLog.finalResult) }}
                  {{ myTestPlayerWon ? '🏆 你赢了！' : '😔 你输了' }}
                </NAlert>
              </div>
            </NCard>
          </NGridItem>
        </NGrid>
      </NTabPane>

      <!-- ── 渲染器测试 Tab ── -->
      <NTabPane name="renderer" tab="🎨 渲染器测试">
        <NGrid :cols="12" :x-gap="16" :y-gap="12" style="margin-top:12px">
          <!-- 编辑器 -->
          <NGridItem :span="6">
            <NCard size="small">
              <template #header>
                <NSpace align="center" justify="space-between">
                  <span>渲染器 HTML</span>
                  <NSpace>
                    <NButton size="small" @click="insertRendererTemplate">最小模板</NButton>
                    <NButton size="small" type="primary" @click="reloadPreview">刷新预览</NButton>
                  </NSpace>
                </NSpace>
              </template>
              <CodeEditor v-model="rendererHtml" language="html" height="440px" />
            </NCard>
          </NGridItem>

          <!-- 预览 -->
          <NGridItem :span="6">
            <NCard size="small" style="height:100%">
              <template #header>
                <NSpace align="center" justify="space-between">
                  <span>实时预览</span>
                  <NSpace>
                    <NButton size="small" @click="sendTestGameLog">发送 gameLog</NButton>
                    <NButton size="small" @click="sendTestGameState">发送 gameState</NButton>
                  </NSpace>
                </NSpace>
              </template>
              <div style="border:1px solid #e0e0e6;border-radius:6px;overflow:hidden">
                <iframe
                  ref="rendererPreviewRef"
                  :srcdoc="rendererPreviewHtml"
                  sandbox="allow-scripts"
                  style="width:100%;height:440px;border:none"
                />
              </div>
            </NCard>
          </NGridItem>

          <!-- 发送测试数据控制 -->
          <NGridItem :span="12">
            <NCard title="🧪 测试数据" size="small">
              <NGrid :cols="2" :x-gap="12">
                <NGridItem>
                  <NFormItem label="gameLog JSON">
                    <NInput
                      v-model:value="testGameLogJson"
                      type="textarea"
                      :rows="6"
                      placeholder='{"rounds": [...], "finalResult": {...}}'
                      style="font-family:monospace;font-size:12px"
                    />
                  </NFormItem>
                </NGridItem>
                <NGridItem>
                  <NFormItem label="gameState JSON (BotInput)">
                    <NInput
                      v-model:value="testGameStateJson"
                      type="textarea"
                      :rows="6"
                      placeholder='{"requests": ["..."], "responses": []}'
                      style="font-family:monospace;font-size:12px"
                    />
                  </NFormItem>
                </NGridItem>
              </NGrid>
              <NText depth="3" style="font-size:12px">
                iframe 消息：{{ lastIframeMessage || '—' }}
              </NText>
            </NCard>
          </NGridItem>

          <!-- 发布到游戏 -->
          <NGridItem :span="12">
            <NCard title="发布渲染器" size="small">
              <NGrid :cols="2" :x-gap="12">
                <NGridItem>
                  <NSelect v-model:value="rendererTargetGameId" :options="gameOptions" placeholder="选择目标游戏..." />
                </NGridItem>
                <NGridItem>
                  <NButton type="success" :loading="publishingRenderer" :disabled="!rendererTargetGameId || !rendererHtml" @click="publishRenderer">
                    🚀 发布到游戏
                  </NButton>
                </NGridItem>
              </NGrid>
            </NCard>
          </NGridItem>
        </NGrid>
      </NTabPane>

      <!-- ── Wiki Tab ── -->
      <NTabPane name="wiki" tab="📖 文档">
        <div style="margin-top:12px">
          <!-- 游戏协议 -->
          <NSelect
            v-model:value="wikiGameId"
            :options="[{ label: '选择游戏查看协议...', value: null }, ...gameOptions]"
            style="max-width:300px;margin-bottom:16px"
            @update:value="loadWikiGame"
          />

          <NGrid v-if="wikiGame" :cols="12" :x-gap="16" :y-gap="12">
            <NGridItem :span="4">
              <NCard :title="wikiGame.name" size="small">
                <NDescriptions :column="1" size="small">
                  <NDescriptionsItem label="玩家数">{{ wikiGame.gamerQuantity }}</NDescriptionsItem>
                  <NDescriptionsItem label="时间限制">{{ wikiGame.timeLimit }}ms</NDescriptionsItem>
                  <NDescriptionsItem label="内存限制">{{ wikiGame.memoryLimit }}MB</NDescriptionsItem>
                </NDescriptions>
                <NDivider style="margin:8px 0" />
                <NText style="font-size:13px;white-space:pre-wrap">{{ wikiGame.description || '暂无描述' }}</NText>
              </NCard>
            </NGridItem>
            <NGridItem :span="8">
              <NCard title="IO 协议" size="small">
                <NAlert type="info" :show-icon="false" style="margin-bottom:12px;font-size:13px">
                  BotInput 通过 <code>stdin</code> 传入，BotOutput 读 <code>stdout</code>。每轮交换一次。
                </NAlert>
                <pre style="background:#f5f5f5;padding:12px;border-radius:6px;font-size:12px;overflow:auto">{{ botInputTemplate }}</pre>
                <NDivider />
                <NButton type="primary" secondary @click="activeTab = 'bot'; botConfig.gameId = wikiGame.id; onGameChange(wikiGame.id)">
                  → 在 Playground 中测试
                </NButton>
              </NCard>
            </NGridItem>
          </NGrid>

          <!-- 通用文档 -->
          <NCollapse v-else style="margin-top:8px">
            <NCollapseItem title="📡 postMessage 渲染器协议" name="renderer-protocol">
              <div style="font-size:13px;line-height:1.8">
                <p>渲染器以 iframe 嵌入，通过 postMessage 与父页面通信：</p>
                <ul>
                  <li>启动时发送 <code>{'{'} type: 'capabilities', interactive: true {'}'}</code></li>
                  <li>接收 <code>{'{'} type: 'gameLog', gameLog, round {'}'}</code> — 回放模式</li>
                  <li>接收 <code>{'{'} type: 'gameState', gameState, playerIndex {'}'}</code> — 人类出手</li>
                  <li>发送 <code>{'{'} type: 'humanMove', move: '...' {'}'}</code> — 提交移动</li>
                </ul>
              </div>
            </NCollapseItem>
            <NCollapseItem title="🤖 Bot 接口规范" name="bot-protocol">
              <div style="font-size:13px;line-height:1.8">
                <p>Bot 读 stdin，写 stdout。每轮一次。</p>
                <pre style="background:#f5f5f5;padding:8px;border-radius:4px;font-size:12px">{{ generalBotTemplate }}</pre>
              </div>
            </NCollapseItem>
            <NCollapseItem title="⚖️ 裁判接口（未来）" name="judge-protocol">
              <NText depth="3">敬请期待——用户自定义裁判功能开发中</NText>
            </NCollapseItem>
          </NCollapse>
        </div>
      </NTabPane>
    </NTabs>

    <!-- 发布 Bot 弹窗 -->
    <NModal v-model:show="showPublishModal" title="发布为 Bot" preset="card" style="width:400px">
      <NForm label-placement="left" label-width="80">
        <NFormItem label="Bot 名称">
          <NInput v-model:value="publishName" placeholder="给你的 Bot 起个名字" />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="showPublishModal = false">取消</NButton>
          <NButton type="primary" :loading="publishing" @click="publishBot">发布</NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import {
  NTabs, NTabPane, NGrid, NGridItem, NCard, NSpace, NButton, NSelect, NInput,
  NTag, NText, NAlert, NDescriptions, NDescriptionsItem, NDivider, NEmpty,
  NSpin, NCollapse, NCollapseItem, NModal, NForm, NFormItem, NRadioGroup, NRadioButton,
  useMessage,
} from 'naive-ui'
import { LANGUAGE_OPTIONS } from '~/types'

const message = useMessage()
const competeApi = useCompeteApi()
const authStore = useAuthStore()

const activeTab = ref('bot')

// ── 游戏列表 ──
const games = ref<any[]>([])
const gameOptions = computed(() => games.value.map(g => ({ label: g.name, value: g.id })))

async function loadGames() {
  try {
    const res = await competeApi.listGames({ page: 1, perPage: 100 })
    games.value = (res.data as any)?.items || res.data || []
  } catch (e) { console.error(e) }
}
onMounted(loadGames)

// ── Bot 测试 ──
const botConfig = ref({ gameId: null as number | null, opponentGamerId: null as number | null, language: 'python' })
const botCode = ref('')
const opponents = ref<any[]>([])
const opponentsLoading = ref(false)
const runningBot = ref(false)
const testMatchId = ref<number | null>(null)
const testMatchStatus = ref(0)
const testMatchLog = ref<any>(null)
const lastTestGamerId = ref<number | null>(null)
const lastTestMatchId = ref<number | null>(null)
let pollTimer: ReturnType<typeof setInterval> | null = null

const opponentOptions = computed(() => opponents.value.map(g => ({
  label: `${g.title || g.name} (ELO ${g.elo ?? 1200})`,
  value: g.id,
})))

const editorLang = computed(() => {
  const langMap: Record<string, string> = { python: 'python', cpp: 'cpp', java: 'java', javascript: 'javascript', go: 'go' }
  return langMap[botConfig.value.language] || 'python'
})

const testMatchStatusLabel = computed(() => ({ 0: '等待中', 1: '进行中', 2: '已完成', 3: '失败' }[testMatchStatus.value] || '-'))
const testMatchStatusType = computed((): any => ({ 0: 'default', 1: 'info', 2: 'success', 3: 'error' }[testMatchStatus.value] || 'default'))

const myTestPlayerWon = computed(() => {
  if (!testMatchLog.value?.finalResult || !lastTestGamerId.value) return false
  const fr = testMatchLog.value.finalResult
  const myScore = fr[String(lastTestGamerId.value)]
  const maxScore = Math.max(...Object.values(fr) as number[])
  return myScore === maxScore
})

async function onGameChange(gameId: number | null) {
  if (!gameId) return
  opponentsLoading.value = true
  try {
    const res = await competeApi.listGamers({ gameId, page: 1, perPage: 100 })
    const all = (res.data as any)?.items || res.data || []
    opponents.value = all.filter((g: any) => g.type === 'code' && !g.disabled)
  } catch (e) { console.error(e) }
  finally { opponentsLoading.value = false }
}

function insertTemplate() {
  const templates: Record<string, string> = {
    python: `import sys
import json

def main():
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        data = json.loads(line)
        # data is BotInput, e.g. {"round": 1, "rounds": 5}
        # Your logic here:
        response = 42  # Replace with your move
        print(json.dumps(response))
        sys.stdout.flush()

if __name__ == '__main__':
    main()
`,
    cpp: `#include <bits/stdc++.h>
#include <nlohmann/json.hpp>
using json = nlohmann::json;
using namespace std;

int main() {
    string line;
    while (getline(cin, line)) {
        if (line.empty()) continue;
        auto data = json::parse(line);
        // Your logic here
        cout << 42 << endl;  // Replace with your move
    }
    return 0;
}
`,
  }
  botCode.value = templates[botConfig.value.language] || templates.python
}

async function runBotTest() {
  if (!botConfig.value.gameId || !botConfig.value.opponentGamerId) return
  runningBot.value = true
  testMatchLog.value = null
  testMatchId.value = null
  try {
    const res = await competeApi.runPlayground(botConfig.value.gameId, {
      code: botCode.value,
      language: botConfig.value.language,
      opponentGamerId: botConfig.value.opponentGamerId,
    })
    const data = res.data as any
    testMatchId.value = data.matchId
    lastTestGamerId.value = data.testGamerId
    lastTestMatchId.value = data.matchId
    testMatchStatus.value = 0
    startPollTestMatch()
  } catch (e: any) {
    message.error(e?.message || '运行失败')
  } finally {
    runningBot.value = false
  }
}

function startPollTestMatch() {
  if (pollTimer) clearInterval(pollTimer)
  pollTimer = setInterval(async () => {
    if (!testMatchId.value) return
    try {
      const res = await competeApi.getMatch(testMatchId.value)
      const m = res.data as any
      testMatchStatus.value = m.status
      if (m.status === 2 || m.status === 3) {
        clearInterval(pollTimer!)
        pollTimer = null
        const result = typeof m.result === 'string' ? JSON.parse(m.result) : m.result
        testMatchLog.value = result
      }
    } catch (e) { console.error(e) }
  }, 1500)
}

onUnmounted(() => { if (pollTimer) clearInterval(pollTimer) })

// ── 发布 Bot ──
const showPublishModal = ref(false)
const publishName = ref('')
const publishing = ref(false)

async function publishBot() {
  if (!publishName.value.trim() || !botConfig.value.gameId) return
  publishing.value = true
  try {
    const res = await competeApi.createGamer({
      gameId: botConfig.value.gameId,
      title: publishName.value,
      language: botConfig.value.language,
      code: botCode.value,
      type: 'code',
      opensource: false,
    })
    const gamer = res.data as any
    message.success('Bot 发布成功！')
    showPublishModal.value = false
    navigateTo(`/compete/gamer/${gamer.id}`)
  } catch (e: any) {
    message.error(e?.message || '发布失败')
  } finally {
    publishing.value = false }
}

// ── 渲染器测试 ──
const rendererHtml = ref('')
const rendererPreviewHtml = ref('')
const rendererPreviewRef = ref<HTMLIFrameElement | null>(null)
const testGameLogJson = ref('{\n  "rounds": [],\n  "finalResult": {"1": 1, "2": 0}\n}')
const testGameStateJson = ref('{\n  "requests": ["{\\\"round\\\": 1, \\\"rounds\\\": 5}"],\n  "responses": []\n}')
const lastIframeMessage = ref('')
const rendererTargetGameId = ref<number | null>(null)
const publishingRenderer = ref(false)

function insertRendererTemplate() {
  rendererHtml.value = `<!DOCTYPE html>
<html lang="zh"><head><meta charset="UTF-8">
<style>body{font-family:sans-serif;background:#0f1117;color:#e2e8f0;padding:16px;min-height:400px;}</style>
</head><body>
<div id="app">等待游戏数据…</div>
<script>
  window.parent.postMessage({ type: 'capabilities', interactive: true }, '*');
  const app = document.getElementById('app');
  let submitted = false;
  window.addEventListener('message', (e) => {
    if (!e.data?.type) return;
    if (e.data.type === 'gameLog') {
      app.innerHTML = '<h3>回放</h3><pre>' + JSON.stringify(e.data.gameLog, null, 2) + '</pre>';
    } else if (e.data.type === 'gameState') {
      const req = JSON.parse(e.data.gameState.requests.slice(-1)[0] || '{}');
      app.innerHTML = \`<h3>你的回合 (玩家 \${e.data.playerIndex})</h3><p>\${JSON.stringify(req)}</p>
        <button id="btn">提交</button>\`;
      document.getElementById('btn').onclick = () => {
        if (submitted) return; submitted = true;
        document.getElementById('btn').disabled = true;
        const move = {}; move[String(e.data.playerIndex)] = 1;
        window.parent.postMessage({ type: 'humanMove', move: JSON.stringify(move) }, '*');
      };
    }
  });
<\/script></body></html>`
}

function reloadPreview() {
  rendererPreviewHtml.value = rendererHtml.value
}

function sendTestGameLog() {
  try {
    const gameLog = JSON.parse(testGameLogJson.value)
    rendererPreviewRef.value?.contentWindow?.postMessage({ type: 'gameLog', gameLog, round: gameLog.rounds?.length - 1 }, '*')
  } catch (e) { message.error('gameLog JSON 格式错误') }
}

function sendTestGameState() {
  try {
    const gameState = JSON.parse(testGameStateJson.value)
    rendererPreviewRef.value?.contentWindow?.postMessage({ type: 'gameState', gameState, playerIndex: 0 }, '*')
  } catch (e) { message.error('gameState JSON 格式错误') }
}

function onIframeMsg(e: MessageEvent) {
  if (e.data?.type && e.data.type !== 'capabilities') {
    lastIframeMessage.value = JSON.stringify(e.data)
  }
}
onMounted(() => window.addEventListener('message', onIframeMsg))
onUnmounted(() => window.removeEventListener('message', onIframeMsg))

watch(rendererHtml, (html) => { if (html) rendererPreviewHtml.value = html })

async function publishRenderer() {
  if (!rendererTargetGameId.value || !rendererHtml.value) return
  publishingRenderer.value = true
  try {
    await competeApi.updateGame(rendererTargetGameId.value, { rendererHtml: rendererHtml.value })
    message.success('渲染器已发布到游戏！')
  } catch (e: any) { message.error(e?.message || '发布失败') }
  finally { publishingRenderer.value = false }
}

// ── Wiki ──
const wikiGameId = ref<number | null>(null)
const wikiGame = ref<any>(null)

async function loadWikiGame(id: number | null) {
  if (!id) { wikiGame.value = null; return }
  try {
    const res = await competeApi.getGame(id)
    wikiGame.value = res.data
  } catch (e) { console.error(e) }
}

const botInputTemplate = computed(() => {
  if (!wikiGame.value) return ''
  return `# 每轮从 stdin 读一行 JSON（BotInput）
# 写一行 JSON 到 stdout（你的移动）

import sys, json

for line in sys.stdin:
    data = json.loads(line.strip())
    # data = ${JSON.stringify({ example: 'depends on game' })}
    
    move = <your_move>   # 根据游戏规则决定
    print(json.dumps(move))
    sys.stdout.flush()`
})

const generalBotTemplate = `import sys, json

for line in sys.stdin:
    data = json.loads(line.strip())
    # Process BotInput, output your move
    move = 42
    print(json.dumps(move))
    sys.stdout.flush()`
</script>

<style scoped>
.playground-page {
  max-width: 1400px;
  margin: 0 auto;
}
.match-log {
  max-height: 500px;
  overflow-y: auto;
  border: 1px solid #e0e0e6;
  border-radius: 6px;
  padding: 8px;
}
.log-round {
  border-bottom: 1px solid #f0f0f0;
  padding: 8px 0;
}
.log-round:last-child { border-bottom: none; }
.log-round-header { margin-bottom: 6px; }
.log-section { margin: 4px 0; }
.log-label { font-size: 11px; color: #888; font-weight: 600; display: block; margin-bottom: 2px; }
.log-pre {
  background: #f8f8f8;
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-family: monospace;
  margin: 0;
  overflow-x: auto;
  max-height: 120px;
}
</style>
