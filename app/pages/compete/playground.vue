<template>
  <div class="playground-page">
    <NBreadcrumb style="margin-bottom:12px">
      <NBreadcrumbItem @click="navigateTo('/compete')">竞技场</NBreadcrumbItem>
      <NBreadcrumbItem>🧪 Playground</NBreadcrumbItem>
    </NBreadcrumb>

    <!-- 教程模式 Banner（全局，所有 Tab 可见） -->
    <NAlert v-if="tutorialMode" type="info" :show-icon="false" style="margin-bottom:12px;border-radius:8px">
      <NSpace align="center" justify="space-between">
        <span>📖 <strong>教程模式</strong> — 正在使用「猜数字」游戏进行练习，不影响 ELO；发布功能已禁用</span>
        <NButton size="tiny" text @click="exitTutorialMode">退出教程模式</NButton>
      </NSpace>
    </NAlert>

    <NTabs :value="activeTab" type="card" animated @update:value="handleTabChange">

      <!-- ══════════════════════════════════════
           Tab 1: Bot 测试
      ══════════════════════════════════════ -->
      <NTabPane name="bot" tab="🤖 Bot 测试">
        <NGrid :cols="12" :x-gap="16" :y-gap="12" style="margin-top:12px">

          <!-- 配置面板 -->
          <NGridItem :span="3">
            <NSpace vertical :size="12">
              <NCard title="游戏 & 对手" size="small">
                <NSpace vertical :size="8">
                  <NSelect v-model:value="bot.gameId" :options="gameOptions" placeholder="选择游戏..." filterable :disabled="tutorialMode" @update:value="onBotGameChange" />
                  <NSelect v-model:value="bot.opponentGamerId" :options="opponentOptions" placeholder="选择对手..." filterable :disabled="!bot.gameId" :loading="opponentsLoading" />
                </NSpace>
              </NCard>

              <NButton type="primary" block :loading="bot.running"
                :disabled="!bot.gameId || !bot.opponentGamerId || !botCode.trim()"
                @click="runBotTest">
                ▶ 运行测试对局
              </NButton>

              <NButton v-if="bot.matchId" block secondary
                @click="navigateTo(`/compete/matches/${bot.matchId}`)">
                查看完整对局 →
              </NButton>

              <NButton v-if="bot.matchId && bot.status === 2 && !tutorialMode" block type="success" secondary
                @click="publishBotModal = true">
                🚀 发布为 Bot
              </NButton>
            </NSpace>
          </NGridItem>

          <!-- 代码编辑器 -->
          <NGridItem :span="9">
            <NCard size="small">
              <template #header>
                <NSpace align="center" justify="space-between">
                  <span>代码编辑器</span>
                  <NSpace>
                    <NSelect v-model:value="bot.language" :options="LANGUAGE_OPTIONS" size="small" style="width:130px" @update:value="onBotLangChange" />
                    <NButton size="small" text @click="insertBotTemplate">📋 插入模板</NButton>
                  </NSpace>
                </NSpace>
              </template>
              <CodeEditor v-model="botCode" :language="botEditorLang" height="400px" />
            </NCard>
          </NGridItem>

          <!-- 测试结果 -->
          <NGridItem v-if="bot.matchId" :span="12">
            <NCard size="small">
              <template #header>
                <NSpace align="center">
                  <span>📋 测试日志</span>
                  <NTag :type="matchStatusType(bot.status)" size="small">{{ matchStatusLabel(bot.status) }}</NTag>
                  <NSpin v-if="bot.status === 1" size="small" />
                </NSpace>
              </template>
              <MatchTimeline
                v-if="bot.timeline.length > 0"
                :rounds="bot.timeline"
                :final-result="bot.finalResult"
                :bot-names="bot.botNames"
              />
              <NEmpty v-else-if="bot.status === 1" description="对局运行中..." style="padding:24px 0" />
            </NCard>
          </NGridItem>
        </NGrid>
      </NTabPane>

      <!-- ══════════════════════════════════════
           Tab 2: 裁判测试
      ══════════════════════════════════════ -->
      <NTabPane name="judge" tab="⚖️ 裁判测试">
        <NGrid :cols="12" :x-gap="16" :y-gap="12" style="margin-top:12px">

          <!-- 配置 -->
          <NGridItem :span="3">
            <NSpace vertical :size="12">
              <NCard title="游戏 & Bots" size="small">
                <NSpace vertical :size="8">
                  <NSelect v-model:value="judge.gameId" :options="gameOptions" placeholder="使用哪个游戏的Bots..." filterable :disabled="tutorialMode && tutorialActiveTab === 'judge'" @update:value="onJudgeGameChange" />
                  <NSelect v-model:value="judge.bot0Id" :options="judgeOpponentOptions" placeholder="Bot 0 (先手)..." :loading="judgeOpponentsLoading" />
                  <NSelect v-model:value="judge.bot1Id" :options="judgeOpponentOptions" placeholder="Bot 1 (后手)..." :loading="judgeOpponentsLoading" />
                </NSpace>
              </NCard>
              <NButton type="primary" block :loading="judge.running"
                :disabled="!judgeCode.trim() || !judge.bot0Id || !judge.bot1Id"
                @click="runJudgeTest">
                ▶ 测试裁判
              </NButton>
              <NAlert type="info" :show-icon="false" style="font-size:12px">
                裁判程序将替代游戏内置裁判运行，不影响 ELO
              </NAlert>
            </NSpace>
          </NGridItem>

          <!-- 裁判代码 -->
          <NGridItem :span="9">
            <NCard size="small">
              <template #header>
                <NSpace align="center" justify="space-between">
                  <span>裁判代码</span>
                  <NSpace>
                    <NSelect v-model:value="judge.language" :options="LANGUAGE_OPTIONS" size="small" style="width:130px" @update:value="onJudgeLangChange" />
                    <NButton size="small" text @click="insertJudgeTemplate">📋 插入裁判模板</NButton>
                  </NSpace>
                </NSpace>
              </template>
              <CodeEditor v-model="judgeCode" :language="judgeEditorLang" height="400px" />
            </NCard>
          </NGridItem>

          <!-- 结果 -->
          <NGridItem v-if="judge.matchId" :span="12">
            <NCard size="small">
              <template #header>
                <NSpace align="center">
                  <span>⚖️ 裁判测试日志</span>
                  <NTag :type="matchStatusType(judge.status)" size="small">{{ matchStatusLabel(judge.status) }}</NTag>
                  <NSpin v-if="judge.status === 1" size="small" />
                </NSpace>
              </template>
              <MatchTimeline
                v-if="judge.timeline.length > 0"
                :rounds="judge.timeline"
                :final-result="judge.finalResult"
                judger-name="我的裁判"
                :bot-names="judge.botNames"
              />
            </NCard>
          </NGridItem>
        </NGrid>
      </NTabPane>

      <!-- ══════════════════════════════════════
           Tab 3: 组合调试器
      ══════════════════════════════════════ -->
      <NTabPane name="combo" tab="🔬 组合调试">
        <div style="margin-top:12px">
          <NAlert type="info" :show-icon="false" style="margin-bottom:16px;font-size:13px">
            将裁判 + 两个 Bot 组合运行，查看完整通信时序图。可自己编写或引入已有程序。
          </NAlert>

          <!-- 三个 Slot -->
          <NGrid :cols="3" :x-gap="16" style="margin-bottom:16px">
            <NGridItem>
              <ProgramSlot
                label="裁判"
                icon="⚖️"
                :model-value="combo.judgeCode"
                :lang="combo.judgeLang"
                :game-id="combo.gameId"
                slot-type="judge"
                @update:model-value="combo.judgeCode = $event"
                @update:lang="combo.judgeLang = $event"
                @update:imported-id="combo.importedJudgeId = $event"
              />
            </NGridItem>
            <NGridItem>
              <ProgramSlot
                label="Bot 0 (先手)"
                icon="🔵"
                :model-value="combo.bot0Code"
                :lang="combo.bot0Lang"
                :game-id="combo.gameId"
                slot-type="bot"
                @update:model-value="combo.bot0Code = $event"
                @update:lang="combo.bot0Lang = $event"
                @update:imported-id="combo.importedBot0Id = $event"
              />
            </NGridItem>
            <NGridItem>
              <ProgramSlot
                label="Bot 1 (后手)"
                icon="🔴"
                :model-value="combo.bot1Code"
                :lang="combo.bot1Lang"
                :game-id="combo.gameId"
                slot-type="bot"
                @update:model-value="combo.bot1Code = $event"
                @update:lang="combo.bot1Lang = $event"
                @update:imported-id="combo.importedBot1Id = $event"
              />
            </NGridItem>
          </NGrid>

          <!-- 运行控制 -->
          <NCard size="small" style="margin-bottom:16px">
            <NSpace align="center" justify="space-between">
              <NSelect v-model:value="combo.gameId" :options="gameOptions" placeholder="参考游戏（用于搜索Bot）..." filterable style="width:280px" />
              <NSpace>
                <NButton
                  type="primary"
                  :loading="combo.running"
                  :disabled="comboNotReady"
                  @click="runCombo"
                >
                  ▶ 运行组合调试
                </NButton>
                <NButton v-if="combo.matchId" @click="navigateTo(`/compete/matches/${combo.matchId}`)">
                  查看原始对局
                </NButton>
              </NSpace>
            </NSpace>
            <NText v-if="comboNotReady" depth="3" style="font-size:12px;display:block;margin-top:6px">
              ⚠️ 裁判和两个 Bot 都需要配置（编写或引入）
            </NText>
          </NCard>

          <!-- 时序图 -->
          <NCard v-if="combo.matchId" title="📡 通信时序图" size="small">
            <template #header-extra>
              <NSpace align="center">
                <NTag :type="matchStatusType(combo.status)" size="small">{{ matchStatusLabel(combo.status) }}</NTag>
                <NSpin v-if="combo.status === 1" size="small" />
              </NSpace>
            </template>
            <MatchTimeline
              v-if="combo.timeline.length > 0"
              :rounds="combo.timeline"
              :final-result="combo.finalResult"
              judger-name="自定义裁判"
              :bot-names="{ '0': 'Bot 0', '1': 'Bot 1' }"
            />
            <NEmpty v-else description="等待对局完成..." style="padding:32px 0" />
          </NCard>
        </div>
      </NTabPane>

      <!-- ══════════════════════════════════════
           Tab 4: 渲染器测试
      ══════════════════════════════════════ -->
      <NTabPane name="renderer" tab="🎨 渲染器">
        <NGrid :cols="2" :x-gap="16" :y-gap="12" style="margin-top:12px">
          <NGridItem>
            <NCard size="small">
              <template #header>
                <NSpace align="center" justify="space-between">
                  <span>渲染器 HTML</span>
                  <NButton size="small" text @click="insertRendererTemplate">最小模板</NButton>
                </NSpace>
              </template>
              <CodeEditor v-model="rendererHtml" language="html" height="420px" />
            </NCard>
          </NGridItem>
          <NGridItem>
            <NCard size="small">
              <template #header>
                <NSpace align="center" justify="space-between">
                  <span>实时预览</span>
                  <NSpace>
                    <NButton size="small" @click="sendGameLog">发送 gameLog</NButton>
                    <NButton size="small" @click="sendGameState">发送 gameState</NButton>
                    <NButton size="small" type="primary" @click="reloadRenderer">刷新</NButton>
                  </NSpace>
                </NSpace>
              </template>
              <div style="border:1px solid #e0e0e6;border-radius:6px;overflow:hidden">
                <iframe ref="rendererRef" :srcdoc="rendererPreview" sandbox="allow-scripts"
                  style="width:100%;height:420px;border:none" />
              </div>
            </NCard>
          </NGridItem>

          <!-- Test data -->
          <NGridItem :span="2">
            <NCard title="🧪 测试数据注入" size="small">
              <NGrid :cols="2" :x-gap="12">
                <NGridItem>
                  <NFormItem label="gameLog JSON" style="margin-bottom:0">
                    <NInput v-model:value="testGameLog" type="textarea" :rows="5" style="font-family:monospace;font-size:12px" />
                  </NFormItem>
                </NGridItem>
                <NGridItem>
                  <NFormItem label="gameState / BotInput" style="margin-bottom:0">
                    <NInput v-model:value="testGameState" type="textarea" :rows="5" style="font-family:monospace;font-size:12px" />
                  </NFormItem>
                </NGridItem>
              </NGrid>
              <div style="margin-top:8px">
                <NText depth="3" style="font-size:12px">
                  iframe 最后消息：<code>{{ lastIframeMsg || '—' }}</code>
                </NText>
              </div>
            </NCard>
          </NGridItem>

          <!-- Publish -->
          <NGridItem :span="2">
            <NCard title="发布渲染器到游戏" size="small">
              <NSpace align="center">
                <NSelect v-model:value="rendererTargetGame" :options="gameOptions" placeholder="目标游戏..." style="width:260px" />
                <NButton type="success" :loading="publishingRenderer" :disabled="!rendererTargetGame || !rendererHtml || tutorialMode" @click="publishRenderer">
                  🚀 发布
                </NButton>
              </NSpace>
            </NCard>
          </NGridItem>
        </NGrid>
      </NTabPane>

      <!-- ══════════════════════════════════════
           Tab 5: Wiki（交互式教程）
      ══════════════════════════════════════ -->
      <NTabPane name="wiki" tab="📖 教程">
        <div style="margin-top:12px">
          <WikiContent
            :games="games"
            :default-game-id="bot.gameId"
            @go-playground="handleWikiGoPlayground"
            @go-renderer="handleWikiGoRenderer"
          />
        </div>
      </NTabPane>
    </NTabs>

    <!-- Publish Bot Modal -->
    <NModal v-model:show="publishBotModal" title="发布为 Bot" preset="card" style="width:400px">
      <NForm label-placement="left" label-width="80">
        <NFormItem label="Bot 名称">
          <NInput v-model:value="publishBotName" placeholder="给 Bot 起个名字" />
        </NFormItem>
        <NFormItem label="是否开源">
          <NSwitch v-model:value="publishBotOpenSource" />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="publishBotModal = false">取消</NButton>
          <NButton type="primary" :loading="publishingBot" @click="publishBot">发布</NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import {
  NTabs, NTabPane, NGrid, NGridItem, NCard, NSpace, NButton, NSelect, NInput,
  NTag, NText, NAlert, NDescriptions, NDescriptionsItem, NEmpty, NSpin,
  NCollapse, NCollapseItem, NModal, NForm, NFormItem, NSwitch,
  useMessage,
} from 'naive-ui'
import { LANGUAGE_OPTIONS } from '~/types'
import type { TimelineRound } from '~/components/compete/MatchTimeline.vue'
import ProgramSlot from '~/components/compete/ProgramSlot.vue'
import confetti from 'canvas-confetti'
import MatchTimeline from '~/components/compete/MatchTimeline.vue'
import WikiContent from '~/components/compete/WikiContent.vue'

const message = useMessage()
const competeApi = useCompeteApi()
const authStore = useAuthStore()

const activeTab = ref('wiki')
const tutorialMode = ref(false)
const tutorialActiveTab = ref('bot') // which test tab the tutorial is on
const TUTORIAL_GAME_ID = 3  // 猜数字 — 系统内置游戏

// In tutorial mode, only tutorialActiveTab and 'wiki' are accessible
function handleTabChange(tab: string) {
  if (tutorialMode.value && tab !== 'wiki' && tab !== tutorialActiveTab.value) {
    message.warning('教程模式中请使用教程指定的标签页，或退出教程模式后自由切换')
    return
  }
  activeTab.value = tab
}

// ── Games ──
const games = ref<any[]>([])
const gameOptions = computed(() => games.value.map(g => ({ label: g.name || g.title, value: g.id })))

onMounted(async () => {
  try {
    const res = await competeApi.listGames({ page: 1, perPage: 100 })
    games.value = (res.data as any)?.items || res.data || []
  } catch (e) { console.error(e) }
})

// ── Helper: convert match result to timeline ──
function buildTimeline(result: any): TimelineRound[] {
  if (!result?.rounds) return []
  return result.rounds.map((r: any) => {
    const events: any[] = []
    const cmd = r.judgeCmd
    if (cmd?.content) {
      for (const [pid, data] of Object.entries(cmd.content)) {
        events.push({ from: 'Judge', to: `Bot${pid}`, type: 'cmd', data, debug: cmd.debug, stderr: cmd.stderr })
      }
    }
    if (r.botResponses) {
      for (const [pid, resp] of Object.entries(r.botResponses)) {
        // Skip non-numeric keys — these are artifacts from old buggy game logs (e.g. "move", "debug")
        if (!/^\d+$/.test(pid)) continue
        const debugInfo = r.debug?.[`bot_${pid}`]
        const stderrInfo = r.debug?.[`bot_${pid}_stderr`]
        events.push({ from: `Bot${pid}`, to: 'Judge', type: 'resp', data: resp, debug: debugInfo, stderr: stderrInfo })
      }
    }
    return { round: r.round, events, display: cmd?.display }
  })
}

function matchStatusLabel(s: number) {
  return ({ 0: '等待中', 1: '运行中', 2: '已完成', 3: '失败' } as Record<number, string>)[s] || '-'
}
function matchStatusType(s: number): 'default' | 'info' | 'success' | 'error' {
  return ({ 0: 'default', 1: 'info', 2: 'success', 3: 'error' } as Record<number, any>)[s] || 'default'
}

// ── Poll helper ──
function startPoll(matchId: number, onUpdate: (m: any) => void, onDone: (m: any) => void) {
  const timer = setInterval(async () => {
    try {
      const res = await competeApi.getMatch(matchId)
      const m = res.data as any
      onUpdate(m)
      if (m.status === 2 || m.status === 3) {
        clearInterval(timer)
        onDone(m)
      }
    } catch (e) { console.error(e) }
  }, 1500)
  onUnmounted(() => clearInterval(timer))
  return timer
}

// ══════════════════════════════════════
// BOT TEST
// ══════════════════════════════════════
const bot = ref({
  gameId: null as number | null,
  opponentGamerId: null as number | null,
  language: 'python',
  running: false,
  matchId: null as number | null,
  status: 0,
  timeline: [] as TimelineRound[],
  finalResult: null as any,
  botNames: {} as Record<string, string>,
})
const botCode = ref('')
const botOpponents = ref<any[]>([])
const opponentsLoading = ref(false)
const publishBotModal = ref(false)
const publishBotName = ref('')
const publishBotOpenSource = ref(false)
const publishingBot = ref(false)

const opponentOptions = computed(() => botOpponents.value.map(g => ({
  label: `${g.title || g.name} (ELO ${g.elo ?? 1200})`,
  value: g.id,
})))

const botEditorLang = computed(() => editorLangMap[bot.value.language] || 'python')

const editorLangMap: Record<string, string> = {
  python: 'python', cpp: 'cpp', java: 'java', javascript: 'javascript', go: 'go', c: 'c',
}

async function onBotGameChange(id: number | null) {
  if (!id) return
  opponentsLoading.value = true
  try {
    const res = await competeApi.listGamers({ gameId: id, page: 1, perPage: 100 })
    const all = (res.data as any)?.items || res.data || []
    botOpponents.value = all.filter((g: any) => g.type === 'code' && !g.disabled)
  } catch (e) { console.error(e) }
  finally { opponentsLoading.value = false }
}

function onBotLangChange(lang: string) {
  bot.value.language = lang
}

const BOT_TEMPLATES: Record<string, string> = {
  python: `import sys
import json

for line in sys.stdin:
    line = line.strip()
    if not line: continue
    data = json.loads(line)
    
    # TODO: implement your logic
    move = 0
    
    # Output with debug info (visible in timeline)
    print(json.dumps({"move": move, "debug": f"received: {data}"}))
    sys.stdout.flush()
`,
  cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    string line;
    while (getline(cin, line)) {
        if (line.empty()) continue;
        // Parse JSON and implement logic
        cout << 0 << endl;  // your move
        cerr << "Debug: got " << line << endl;
    }
}
`,
  java: `import java.util.*;
import java.io.*;
public class Bot {
    public static void main(String[] args) throws Exception {
        Scanner sc = new Scanner(System.in);
        while (sc.hasNextLine()) {
            String line = sc.nextLine().trim();
            if (line.isEmpty()) continue;
            // TODO: parse JSON and implement logic
            System.out.println("0");
            System.out.flush();
        }
    }
}
`,
  javascript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
rl.on('line', (line) => {
    if (!line.trim()) return;
    const data = JSON.parse(line);
    // TODO: implement logic
    process.stdout.write(JSON.stringify({move: 0, debug: \`got \${JSON.stringify(data)}\`}) + '\\n');
});
`,
  go: `package main
import ("bufio";"encoding/json";"fmt";"os")
func main() {
    scanner := bufio.NewScanner(os.Stdin)
    for scanner.Scan() {
        line := scanner.Text()
        if line == "" { continue }
        var data interface{}
        json.Unmarshal([]byte(line), &data)
        // TODO: implement logic
        fmt.Println(0)
    }
}
`,
}

function insertBotTemplate() {
  botCode.value = BOT_TEMPLATES[bot.value.language] || BOT_TEMPLATES.python
}

async function runBotTest() {
  if (!bot.value.gameId || !bot.value.opponentGamerId) return
  bot.value.running = true
  bot.value.timeline = []
  bot.value.finalResult = null
  try {
    const res = await competeApi.runPlayground(bot.value.gameId, {
      code: botCode.value,
      language: bot.value.language,
      opponentGamerId: bot.value.opponentGamerId,
    })
    const data = res.data as any
    bot.value.matchId = data.matchId
    bot.value.status = 0
    const opp = botOpponents.value.find(g => g.id === bot.value.opponentGamerId)
    bot.value.botNames = { '0': '我的 Bot', '1': opp?.title || opp?.name || 'Opponent' }
    startPoll(data.matchId, (m) => { bot.value.status = m.status },
      (m) => {
        bot.value.status = m.status
        const r = typeof m.result === 'string' ? JSON.parse(m.result) : m.result
        bot.value.finalResult = r?.finalResult
        bot.value.timeline = buildTimeline(r)
      })
  } catch (e: any) {
    message.error(e?.message || '运行失败')
  } finally {
    bot.value.running = false
  }
}

async function publishBot() {
  if (!publishBotName.value.trim() || !bot.value.gameId) return
  publishingBot.value = true
  try {
    const res = await competeApi.createGamer({
      gameId: bot.value.gameId,
      title: publishBotName.value,
      language: bot.value.language,
      code: botCode.value,
      type: 'code',
      opensource: publishBotOpenSource.value,
    })
    message.success('Bot 发布成功！')
    publishBotModal.value = false
    navigateTo(`/compete/gamer/${(res.data as any).id}`)
  } catch (e: any) {
    message.error(e?.message || '发布失败')
  } finally {
    publishingBot.value = false
  }
}

// ══════════════════════════════════════
// JUDGE TEST
// ══════════════════════════════════════
const judge = ref({
  gameId: null as number | null,
  bot0Id: null as number | null,
  bot1Id: null as number | null,
  language: 'python',
  running: false,
  matchId: null as number | null,
  status: 0,
  timeline: [] as TimelineRound[],
  finalResult: null as any,
  botNames: {} as Record<string, string>,
})
const judgeCode = ref('')
const judgeOpponents = ref<any[]>([])
const judgeOpponentsLoading = ref(false)

const judgeOpponentOptions = computed(() => judgeOpponents.value.map(g => ({
  label: `${g.title || g.name} (ELO ${g.elo ?? 1200})`,
  value: g.id,
})))
const judgeEditorLang = computed(() => editorLangMap[judge.value.language] || 'python')

async function onJudgeGameChange(id: number | null) {
  if (!id) return
  judgeOpponentsLoading.value = true
  try {
    const res = await competeApi.listGamers({ gameId: id, page: 1, perPage: 100 })
    const all = (res.data as any)?.items || res.data || []
    judgeOpponents.value = all.filter((g: any) => g.type === 'code' && !g.disabled)
  } catch (e) { console.error(e) }
  finally { judgeOpponentsLoading.value = false }
}

function onJudgeLangChange(lang: string) { judge.value.language = lang }

const JUDGE_TEMPLATE_PY = `import sys
import json

round_num = 0

for line in sys.stdin:
    line = line.strip()
    if not line: continue
    data = json.loads(line)
    round_num = data.get('round', round_num + 1)
    responses = data.get('responses', {})
    
    if not responses:
        # First call: initialize game, send first commands
        result = {
            "commands": {
                "0": {"round": 1, "info": "game start"},
                "1": {"round": 1, "info": "game start"}
            },
            "display": {"round": 1},
            "verdict": "continue",
            "debug": "Game initialized"
        }
    else:
        # Process responses, decide next state
        # responses = {"0": <move_from_bot0>, "1": <move_from_bot1>}
        
        if round_num >= 5:  # Game over condition
            result = {
                "commands": {},
                "display": {"result": responses},
                "verdict": "finish",
                "scores": {"0": 1, "1": 0},  # Your scoring logic
                "debug": f"Game over after {round_num} rounds"
            }
        else:
            result = {
                "commands": {
                    "0": {"round": round_num + 1},
                    "1": {"round": round_num + 1}
                },
                "display": {"round": round_num + 1, "lastMoves": responses},
                "verdict": "continue",
                "debug": f"Round {round_num} done. Moves: {responses}"
            }
    
    print(json.dumps(result))
    sys.stdout.flush()
`

function insertJudgeTemplate() {
  judgeCode.value = JUDGE_TEMPLATE_PY
}

async function runJudgeTest() {
  if (!judgeCode.value.trim() || !judge.value.bot0Id || !judge.value.bot1Id) return
  judge.value.running = true
  judge.value.timeline = []
  judge.value.finalResult = null
  try {
    const gameId = judge.value.gameId || bot.value.gameId
    if (!gameId) { message.error('请先选择一个游戏'); return }
    const res = await competeApi.runPlaygroundJudge(gameId, {
      judgerCode: judgeCode.value,
      judgerLanguage: judge.value.language,
      bot0: { gamerId: judge.value.bot0Id },
      bot1: { gamerId: judge.value.bot1Id },
    })
    const { matchId } = res.data as any
    judge.value.matchId = matchId
    judge.value.status = 0
    const b0 = judgeOpponents.value.find(g => g.id === judge.value.bot0Id)
    const b1 = judgeOpponents.value.find(g => g.id === judge.value.bot1Id)
    judge.value.botNames = { '0': b0?.title || b0?.name || 'Bot0', '1': b1?.title || b1?.name || 'Bot1' }
    startPoll(matchId, (m) => { judge.value.status = m.status },
      (m) => {
        judge.value.status = m.status
        const r = typeof m.result === 'string' ? JSON.parse(m.result) : m.result
        judge.value.finalResult = r?.finalResult
        judge.value.timeline = buildTimeline(r)
      })
  } catch (e: any) {
    message.error(e?.message || '运行失败')
  } finally {
    judge.value.running = false
  }
}

// ══════════════════════════════════════
// COMBO DEBUGGER
// ══════════════════════════════════════
const combo = ref({
  gameId: null as number | null,
  judgeCode: '', judgeLang: 'python', importedJudgeId: null as number | null,
  bot0Code: '', bot0Lang: 'python', importedBot0Id: null as number | null,
  bot1Code: '', bot1Lang: 'python', importedBot1Id: null as number | null,
  running: false,
  matchId: null as number | null,
  status: 0,
  timeline: [] as TimelineRound[],
  finalResult: null as any,
})

const comboNotReady = computed(() =>
  (!combo.value.judgeCode.trim() && !combo.value.importedJudgeId) ||
  (!combo.value.bot0Code.trim() && !combo.value.importedBot0Id) ||
  (!combo.value.bot1Code.trim() && !combo.value.importedBot1Id)
)

async function runCombo() {
  combo.value.running = true
  combo.value.timeline = []
  combo.value.finalResult = null
  try {
    const gameId = combo.value.gameId
    if (!gameId) { message.error('请先选择参考游戏'); combo.value.running = false; return }
    const bot0Spec = combo.value.importedBot0Id
      ? { gamerId: combo.value.importedBot0Id }
      : { code: combo.value.bot0Code, language: combo.value.bot0Lang }
    const bot1Spec = combo.value.importedBot1Id
      ? { gamerId: combo.value.importedBot1Id }
      : { code: combo.value.bot1Code, language: combo.value.bot1Lang }
    const judgeSpec = combo.value.importedJudgeId
      ? {} // use game's judge
      : { judgerCode: combo.value.judgeCode, judgerLanguage: combo.value.judgeLang }
    const res = await competeApi.runPlaygroundJudge(gameId, { ...judgeSpec, bot0: bot0Spec, bot1: bot1Spec })
    const { matchId } = res.data as any
    combo.value.matchId = matchId
    combo.value.status = 0
    startPoll(matchId, (m) => { combo.value.status = m.status },
      (m) => {
        combo.value.status = m.status
        const r = typeof m.result === 'string' ? JSON.parse(m.result) : m.result
        combo.value.finalResult = r?.finalResult
        combo.value.timeline = buildTimeline(r)
      })
  } catch (e: any) {
    message.error(e?.message || '运行失败')
  } finally {
    combo.value.running = false
  }
}

// ══════════════════════════════════════
// RENDERER TEST
// ══════════════════════════════════════
const rendererHtml = ref('')
const rendererPreview = ref('')
const rendererRef = ref<HTMLIFrameElement | null>(null)
const testGameLog = ref(JSON.stringify({
  rounds: [
    {
      round: 1,
      judgeCmd: { content: { "0": { round: 1, rounds: 5 }, "1": { round: 1, rounds: 5 } }, display: { round: 1, secret: 42 } },
      botResponses: { "0": 50, "1": 70 },
    },
    {
      round: 2,
      judgeCmd: { content: { "0": { round: 2, rounds: 5, hint: "smaller" }, "1": { round: 2, rounds: 5, hint: "smaller" } }, display: { round: 2, scores: [0, 0] } },
      botResponses: { "0": 30, "1": 55 },
    },
    {
      round: 3,
      judgeCmd: { content: { "0": { round: 3, rounds: 5, hint: "bigger" }, "1": { round: 3, rounds: 5, hint: "smaller" } }, display: { round: 3, scores: [0, 0] } },
      botResponses: { "0": 42, "1": 48 },
    },
  ],
  finalResult: { "0": 1, "1": 0 },
}, null, 2))
const testGameState = ref(JSON.stringify({
  requests: [
    JSON.stringify({ round: 1, rounds: 5 }),
    JSON.stringify({ round: 2, rounds: 5, hint: 'smaller' }),
  ],
  responses: ['50', '30'],
  data: null,
  globaldata: null,
  time_limit: 2,
  memory_limit: 256,
}, null, 2))
const lastIframeMsg = ref('')
const rendererTargetGame = ref<number | null>(null)
const publishingRenderer = ref(false)

function insertRendererTemplate() {
  rendererHtml.value = `<!DOCTYPE html>
<html lang="zh"><head><meta charset="UTF-8">
<style>body{font-family:sans-serif;background:#0f1117;color:#e2e8f0;padding:16px;min-height:400px;}</style>
</head><body>
<div id="app">等待游戏数据…</div>
<script>
  window.parent.postMessage({type:'capabilities',interactive:true},'*');
  const app=document.getElementById('app');let done=false;
  window.addEventListener('message',(e)=>{
    if(!e.data?.type)return;
    if(e.data.type==='gameLog'){
      app.innerHTML='<h3>回放</h3><pre>'+JSON.stringify(e.data.gameLog,null,2)+'</pre>';
    } else if(e.data.type==='gameState'){
      const req=JSON.parse(e.data.gameState.requests?.slice(-1)[0]||'{}');
      app.innerHTML=\`<h3>你的回合(玩家\${e.data.playerIndex})</h3><p>\${JSON.stringify(req)}</p><button id="b">提交</button>\`;
      document.getElementById('b').onclick=()=>{
        if(done)return;done=true;
        const m={};m[String(e.data.playerIndex)]=1;
        window.parent.postMessage({type:'humanMove',move:JSON.stringify(m)},'*');
      };
    }
  });
<\/script></body></html>`
}

function reloadRenderer() {
  rendererPreview.value = rendererHtml.value
}

function sendGameLog() {
  try {
    const gameLog = JSON.parse(testGameLog.value)
    rendererRef.value?.contentWindow?.postMessage({ type: 'gameLog', gameLog, round: 0 }, '*')
  } catch { message.error('gameLog JSON 格式错误') }
}

function sendGameState() {
  try {
    const gameState = JSON.parse(testGameState.value)
    rendererRef.value?.contentWindow?.postMessage({ type: 'gameState', gameState, playerIndex: 0 }, '*')
  } catch { message.error('gameState JSON 格式错误') }
}

function onIframeMsg(e: MessageEvent) {
  if (e.data?.type && e.data.type !== 'capabilities') {
    lastIframeMsg.value = JSON.stringify(e.data)
  }
}
onMounted(() => window.addEventListener('message', onIframeMsg))
onUnmounted(() => window.removeEventListener('message', onIframeMsg))
watch(rendererHtml, html => { if (html) rendererPreview.value = html })

async function publishRenderer() {
  if (!rendererTargetGame.value || !rendererHtml.value) return
  publishingRenderer.value = true
  try {
    await competeApi.updateGame(rendererTargetGame.value, { rendererHtml: rendererHtml.value })
    message.success('渲染器已发布！')
  } catch (e: any) { message.error(e?.message || '发布失败') }
  finally { publishingRenderer.value = false }
}

// ══════════════════════════════════════
// WIKI
// ══════════════════════════════════════
const wikiGameId = ref<number | null>(null)
const wikiGame = ref<any>(null)

async function loadWikiGame(id: number | null) {
  if (!id) { wikiGame.value = null; return }
  try {
    const res = await competeApi.getGame(id)
    wikiGame.value = res.data
  } catch (e) { console.error(e) }
}

function goPlayWithGame() {
  if (!wikiGame.value) return
  activeTab.value = 'bot'
  bot.value.gameId = wikiGame.value.id
  onBotGameChange(wikiGame.value.id)
}

const simpleBotTemplate = `import sys, json

for line in sys.stdin:
    data = json.loads(line.strip())
    # data = game-specific input JSON
    
    move = 42  # your logic here
    print(move)  # simple: just print the value
    sys.stdout.flush()`

const jsonBotTemplate = `import sys, json

for line in sys.stdin:
    data = json.loads(line.strip())
    move = 42  # your logic
    
    # JSON format: supports debug info shown in timeline
    print(json.dumps({"move": move, "debug": f"chose {move}"}))
    sys.stdout.flush()
    
    # You can also write to stderr for debug:
    print(f"Input was: {data}", file=sys.stderr)`

const judgeProtocolExample = `# stdin each round:  {"round": 1, "responses": {"0": 42, "1": 87}}
# stdout each round: {"commands": {"0": {...}, "1": {...}}, "display": {...},
#                    "verdict": "continue"|"finish", "scores": {...}, "debug": "..."}

import sys, json
for line in sys.stdin:
    data = json.loads(line.strip())
    responses = data.get('responses', {})
    # ... your judging logic ...
    print(json.dumps({"commands": {"0": {}, "1": {}}, "verdict": "continue"}))
    sys.stdout.flush()`

// ══════════════════════════════════════
// WIKI → Playground navigation
// ══════════════════════════════════════
function fireConfetti() {
  confetti({ particleCount: 80, spread: 70, origin: { y: 0.5 }, colors: ['#18a058', '#2080f0', '#f0a020', '#d03050', '#7fe7c4'] })
}

function exitTutorialMode() {
  tutorialMode.value = false
  activeTab.value = 'wiki'
}

async function handleWikiGoPlayground(opts: { tab?: string; code?: string; lang?: string; gameId?: number }) {
  const targetTab = opts.tab || 'bot'
  tutorialMode.value = true
  tutorialActiveTab.value = targetTab

  const targetGame = opts.gameId || TUTORIAL_GAME_ID

  if (targetTab === 'judge') {
    // Pre-fill judge code
    if (opts.code) { judgeCode.value = opts.code; nextTick(fireConfetti) }
    if (opts.lang) judge.value.language = opts.lang || 'python'
    // Auto-select game for judge tab
    if (judge.value.gameId !== targetGame) {
      judge.value.gameId = targetGame
      await onJudgeGameChange(targetGame)
      if (!judge.value.bot0Id && judgeOpponents.value.length) judge.value.bot0Id = judgeOpponents.value[0]?.id
      if (!judge.value.bot1Id && judgeOpponents.value.length > 1) judge.value.bot1Id = judgeOpponents.value[1]?.id
    }
  } else {
    // Bot tab (default)
    if (opts.code) { botCode.value = opts.code; nextTick(fireConfetti) }
    if (opts.lang) bot.value.language = opts.lang || 'python'
    if (bot.value.gameId !== targetGame) {
      bot.value.gameId = targetGame
      await onBotGameChange(targetGame)
      if (!bot.value.opponentGamerId && botOpponents.value.length) {
        bot.value.opponentGamerId = botOpponents.value[0].id
      }
    }
  }

  activeTab.value = targetTab
}

function handleWikiGoRenderer(opts: { html?: string }) {
  if (opts.html) { rendererHtml.value = opts.html; rendererPreview.value = opts.html }
  activeTab.value = 'renderer'
}
</script>

<style scoped>
.playground-page { max-width: 1500px; margin: 0 auto; }
.wiki-code {
  background: #f5f5f5; padding: 12px; border-radius: 6px;
  font-size: 12px; font-family: monospace; overflow: auto;
  max-height: 300px; white-space: pre; margin: 0;
}
</style>
