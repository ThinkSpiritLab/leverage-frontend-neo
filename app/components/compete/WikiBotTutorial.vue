<template>
  <div class="bot-tutorial">
    <!-- Step 0: 了解 Bot 输入 -->
    <div v-if="step === 0">
      <div class="step-intro">
        <h3>🎓 第一步：了解 Bot 是如何工作的</h3>
        <p class="intro-text">
          Bot 是一个运行在沙箱中的程序。每一轮，裁判会把当前局面通过 <strong>stdin</strong> 发给你的 Bot，
          你的 Bot 需要在 <strong>stdout</strong> 输出一个移动（move）。
        </p>
      </div>

      <div class="concept-diagram">
        <div class="diagram-box judge-box">⚖️ 裁判</div>
        <div class="diagram-arrows">
          <div class="arrow-row">
            <span class="arrow-label stdin">局面 JSON → stdin</span>
            <span class="arrow-right">→</span>
          </div>
          <div class="arrow-row">
            <span class="arrow-left">←</span>
            <span class="arrow-label stdout">stdout → 你的移动</span>
          </div>
        </div>
        <div class="diagram-box bot-box">🤖 你的 Bot</div>
      </div>

      <NAlert type="info" :show-icon="false" style="margin:12px 0;font-size:13px">
        <strong>关键规则：</strong>
        <ul style="margin:6px 0 0 16px;line-height:2">
          <li>每轮读一行 stdin（一个 JSON）</li>
          <li>写一行 stdout（你的移动）</li>
          <li>时间限制内必须响应（默认 2 秒）</li>
          <li>可以写 stderr 输出调试信息（不影响对局）</li>
        </ul>
      </NAlert>

      <div class="example-section">
        <h4>以「猜数字」游戏为例：</h4>
        <p style="font-size:13px;color:#555;margin-bottom:8px">
          两名玩家同时猜1-100之间的数字，猜中裁判心中数字最近的人赢得该轮。
          你的 Bot 每轮会收到这样的输入：
        </p>
        <WikiCodeBlock
          :code="guessInputExample"
          lang="json"
          explanation="round=当前轮次, rounds=总轮数, lastScores=上一轮后的比分（第一轮为null）"
        />
        <p style="font-size:13px;color:#555;margin-bottom:8px">你需要输出一个 1-100 的整数：</p>
        <WikiCodeBlock :code="'50'" lang="text" explanation="直接输出数字即可，不需要 JSON" />
      </div>

      <div class="next-hint">
        <NButton type="primary" @click="$emit('next')">了解了，开始写 Bot →</NButton>
      </div>
    </div>

    <!-- Step 1: 第一个 Bot -->
    <div v-if="step === 1">
      <div class="step-intro">
        <h3>✏️ 第二步：写你的第一个 Bot</h3>
        <p class="intro-text">
          最简单的策略：随机猜一个数字。别小看它——在某些游戏中，随机策略出人意料地强！
        </p>
      </div>

      <WikiCodeBlock
        :code="simpleBotPy"
        lang="python"
        :tryable="true"
        explanation="这是一个完整的随机猜数 Bot。stdin 读 JSON，stdout 输出数字，stderr 写调试信息。"
        @try-it="$emit('go-playground', { tab: 'bot', code: $event, lang: 'python' })"
      />

      <NDivider style="margin:16px 0">用其他语言？</NCollapse>

      <NCollapse>
        <NCollapseItem title="C++ 版本" name="cpp">
          <WikiCodeBlock :code="simpleBotCpp" lang="cpp" :tryable="true"
            @try-it="$emit('go-playground', { tab: 'bot', code: $event, lang: 'cpp' })" />
        </NCollapseItem>
        <NCollapseItem title="Java 版本" name="java">
          <WikiCodeBlock :code="simpleBotJava" lang="java" :tryable="true"
            @try-it="$emit('go-playground', { tab: 'bot', code: $event, lang: 'java' })" />
        </NCollapseItem>
      </NCollapse>

      <WikiTryIt
        :initial-code="simpleBotPy"
        initial-lang="python"
        :game-id="defaultGameId"
        :opponent-gamer-id="defaultOpponentId"
        hint="修改猜数策略，看看赢率有没有变化"
        @try-code="(c, l) => $emit('go-playground', { tab: 'bot', code: c, lang: l })"
      />
    </div>

    <!-- Step 2: 了解输出格式 -->
    <div v-if="step === 2">
      <div class="step-intro">
        <h3>🔍 第三步：带调试信息的 JSON 输出</h3>
        <p class="intro-text">
          简单输出只能打印数字/字符串。如果你想要更多控制，可以输出 JSON 格式，
          加入 <code>debug</code> 字段——这些信息会出现在时序图里，帮你分析 Bot 的思考过程。
        </p>
      </div>

      <div class="format-compare">
        <div class="format-col">
          <div class="format-label">💬 简单输出</div>
          <WikiCodeBlock :code="simpleOutput" lang="text" explanation="适合快速写，不能以 { 开头" />
        </div>
        <div class="format-divider">vs</div>
        <div class="format-col">
          <div class="format-label">📦 JSON 输出（推荐）</div>
          <WikiCodeBlock :code="jsonOutput" lang="json" explanation="move 是你的移动，debug 在时序图显示" />
        </div>
      </div>

      <NAlert type="warning" :show-icon="false" style="margin:12px 0;font-size:12px">
        ⚠️ 简单输出<strong>不能以 { 开头</strong>。如果你的移动恰好是 JSON 字符串，请改用 JSON 输出格式。
      </NAlert>

      <h4 style="margin-top:16px">进阶猜数 Bot（带推理）：</h4>
      <WikiCodeBlock
        :code="smartBotPy"
        lang="python"
        :tryable="true"
        explanation="这个 Bot 会根据上一轮的比分调整策略，并用 debug 字段记录决策过程"
        @try-it="$emit('go-playground', { tab: 'bot', code: $event, lang: 'python' })"
      />

      <WikiTryIt
        :initial-code="smartBotPy"
        initial-lang="python"
        :game-id="defaultGameId"
        :opponent-gamer-id="defaultOpponentId"
        hint="尝试改进策略，比如根据上轮差距调整猜测范围"
      />
    </div>

    <!-- Step 3: 读入/输出规范 -->
    <div v-if="step === 3">
      <div class="step-intro">
        <h3>📖 第四步：理解 BotInput 格式</h3>
        <p class="intro-text">
          不同游戏的 BotInput 格式不同。这是裁判定义的——裁判给你什么，你就收什么。
          可以在游戏页面查看具体协议，也可以在这里看通用格式。
        </p>
      </div>

      <WikiCodeBlock
        :code="botInputFormat"
        lang="json"
        explanation="这是 leverage 通用的 BotInput 外层格式。内层 requests 是本局累积的裁判命令，responses 是历史回应。"
      />

      <NAlert type="info" :show-icon="false" style="margin:12px 0;font-size:13px">
        <strong>经验法则：</strong> 通常你只需要读 <code>requests</code> 的最后一条（当前轮的裁判命令）：
      </NAlert>

      <WikiCodeBlock
        :code="readLastRequest"
        lang="python"
        explanation="requests[-1] 是最新的裁判命令，也就是本轮你需要响应的内容"
      />

      <h4 style="margin-top:16px">游戏特定协议查询：</h4>
      <NSelect
        :value="wikiGameId"
        :options="[{label:'选择游戏...',value:null},...gameOptions]"
        placeholder="选择游戏查看协议"
        clearable
        style="max-width:300px"
        @update:value="wikiGameId = $event"
      />
      <div v-if="wikiGameId" style="margin-top:10px">
        <div v-if="selectedGame" class="game-proto-card">
          <div class="proto-title">{{ selectedGame.name || selectedGame.title }} · 输入协议</div>
          <div class="proto-desc">{{ selectedGame.description || '暂无协议说明，请联系游戏作者。' }}</div>
        </div>
      </div>
    </div>

    <!-- Step 4: 发布 -->
    <div v-if="step === 4">
      <div class="step-intro">
        <h3>🚀 第五步：测试并发布你的 Bot</h3>
        <p class="intro-text">
          Bot 准备好了？去 Playground 运行一局测试，满意后一键发布！
          发布的 Bot 会自动加入排行榜，和其他 Bot 较量，ELO 会根据胜负动态更新。
        </p>
      </div>

      <div class="publish-steps">
        <div class="pub-step">
          <div class="pub-num">1</div>
          <div>
            <strong>在 Playground → Bot 测试 Tab 运行测试</strong>
            <p>选择游戏和对手，贴上代码，点「运行测试对局」。时序图会展示每轮通信详情。</p>
          </div>
        </div>
        <div class="pub-step">
          <div class="pub-num">2</div>
          <div>
            <strong>查看时序图，分析 Bug</strong>
            <p>时序图里可以看每轮你的 debug 输出和 stderr，快速定位问题。</p>
          </div>
        </div>
        <div class="pub-step">
          <div class="pub-num">3</div>
          <div>
            <strong>点「发布为 Bot」</strong>
            <p>给 Bot 起个名字，选择是否开源，一键提交。发布后可以在「我的 Bot」页面管理。</p>
          </div>
        </div>
        <div class="pub-step">
          <div class="pub-num">4</div>
          <div>
            <strong>触发自动对战，观战 ELO 爬升</strong>
            <p>管理员可以触发 trigger-auto-match，你的 Bot 会自动和排行榜 TopN 对战。</p>
          </div>
        </div>
      </div>

      <div class="final-cta">
        <NButton type="primary" size="large" @click="$emit('go-playground', { tab: 'bot' })">
          🤖 去 Playground 写第一个 Bot →
        </NButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { NButton, NAlert, NDivider, NCollapse, NCollapseItem, NSelect } from 'naive-ui'
import WikiCodeBlock from './WikiCodeBlock.vue'
import WikiTryIt from './WikiTryIt.vue'

const props = defineProps<{
  step: number
  games: any[]
  defaultGameId?: number | null
}>()

defineEmits<{
  'next': []
  'go-playground': [{ tab: string; code?: string; lang?: string }]
}>()

const wikiGameId = ref<number | null>(null)
const gameOptions = computed(() => props.games.map(g => ({ label: g.name || g.title, value: g.id })))
const selectedGame = computed(() => props.games.find(g => g.id === wikiGameId.value))

// Find a default "random bot" opponent for try-it blocks
const defaultOpponentId = computed(() => {
  // We'd ideally find a 'code' type gamer for defaultGameId
  return null // will just show "go to playground" button
})

// Code examples
const guessInputExample = `{
  "round": 3,
  "rounds": 5,
  "lastScores": {"you": 1, "opponent": 1}
}`

const simpleBotPy = `import sys
import json
import random

for line in sys.stdin:
    line = line.strip()
    if not line:
        continue
    
    data = json.loads(line)
    # data 包含本轮局面信息
    
    # 策略：随机猜一个 1-100 的整数
    guess = random.randint(1, 100)
    
    print(guess)        # 输出移动
    sys.stdout.flush()  # 必须！否则裁判收不到
    
    # 调试信息（出现在时序图，不影响对局）
    print(f"[DEBUG] 猜了: {guess}", file=sys.stderr)`

const simpleBotCpp = `#include <bits/stdc++.h>
using namespace std;

int main() {
    srand(time(0));
    string line;
    while (getline(cin, line)) {
        if (line.empty()) continue;
        // 简单随机猜
        int guess = rand() % 100 + 1;
        cout << guess << endl;
        cerr << "[DEBUG] 猜了: " << guess << endl;
    }
    return 0;
}`

const simpleBotJava = `import java.util.*;
import java.io.*;

public class Bot {
    public static void main(String[] args) throws Exception {
        Random rand = new Random();
        Scanner sc = new Scanner(System.in);
        while (sc.hasNextLine()) {
            String line = sc.nextLine().trim();
            if (line.isEmpty()) continue;
            int guess = rand.nextInt(100) + 1;
            System.out.println(guess);
            System.out.flush();
            System.err.println("[DEBUG] 猜了: " + guess);
        }
    }
}`

const simpleOutput = `50`

const jsonOutput = `{"move": 50, "debug": "我猜50，根据上轮差距推断"}`

const smartBotPy = `import sys
import json
import random

low, high = 1, 100  # 搜索范围
last_mine = 50

for line in sys.stdin:
    line = line.strip()
    if not line: continue
    
    data = json.loads(line)
    round_num = data.get('round', 1)
    
    # 策略：根据历史信息缩小范围
    # 实际上猜数字游戏里裁判不告诉你答案
    # 所以用渐进策略
    if round_num == 1:
        guess = random.randint(40, 60)  # 第一轮猜中间区域
    else:
        # 加入一点随机扰动
        offset = random.randint(-15, 15)
        guess = max(1, min(100, last_mine + offset))
    
    last_mine = guess
    
    # 用 JSON 格式输出，debug 字段会出现在时序图
    print(json.dumps({
        "move": guess,
        "debug": f"第{round_num}轮猜{guess}，范围[{low},{high}]"
    }))
    sys.stdout.flush()`

const botInputFormat = `{
  "requests": [
    "{\\"round\\": 1, \\"rounds\\": 5}",    // 第1轮裁判命令（JSON字符串）
    "{\\"round\\": 2, \\"rounds\\": 5}"     // 第2轮裁判命令
  ],
  "responses": [
    "42",   // 你第1轮的回应（历史）
  ],
  "data": null,        // 跨轮持久数据（目前未启用）
  "globaldata": null,  // 全局数据（目前未启用）
  "time_limit": 2,     // 每轮时间限制（秒）
  "memory_limit": 256  // 内存限制（MB）
}`

const readLastRequest = `import sys, json

for line in sys.stdin:
    line = line.strip()
    if not line: continue
    
    bot_input = json.loads(line)
    
    # 读最新一条裁判命令（当前轮）
    latest = json.loads(bot_input['requests'][-1])
    
    # latest 就是游戏特定的局面 JSON
    # 例如猜数字: {"round": 2, "rounds": 5}
    
    move = 42
    print(move)
    sys.stdout.flush()`
</script>

<style scoped>
.bot-tutorial { max-width: 800px; }
.step-intro { margin-bottom: 16px; }
.step-intro h3 { font-size: 18px; margin-bottom: 8px; }
.intro-text { font-size: 14px; color: #444; line-height: 1.7; }
.concept-diagram {
  display: flex; align-items: center; justify-content: center;
  gap: 0; padding: 20px; background: #f9f9fb; border-radius: 10px; margin: 14px 0;
}
.diagram-box {
  padding: 12px 20px; border-radius: 8px; font-weight: 700; font-size: 15px;
}
.judge-box { background: #f0e6ff; color: #722ed1; }
.bot-box { background: #e6f4ff; color: #2080f0; }
.diagram-arrows { display: flex; flex-direction: column; gap: 6px; padding: 0 16px; align-items: center; }
.arrow-row { display: flex; align-items: center; gap: 6px; font-size: 12px; }
.arrow-label { font-size: 11px; font-weight: 600; }
.stdin { color: #722ed1; }
.stdout { color: #2080f0; }
.arrow-right, .arrow-left { font-size: 16px; color: #888; }
.example-section { margin-top: 16px; }
.example-section h4 { font-size: 14px; margin-bottom: 8px; }
.next-hint { margin-top: 20px; display: flex; justify-content: flex-end; }
.format-compare { display: flex; align-items: flex-start; gap: 12px; margin: 12px 0; }
.format-col { flex: 1; }
.format-label { font-size: 12px; font-weight: 700; color: #666; margin-bottom: 6px; }
.format-divider { padding-top: 40px; font-weight: 700; color: #888; flex-shrink: 0; }
.game-proto-card {
  padding: 12px; background: #f6f8fa; border-radius: 8px; border: 1px solid #e0e0e6;
}
.proto-title { font-weight: 700; font-size: 13px; margin-bottom: 6px; }
.proto-desc { font-size: 12px; color: #555; line-height: 1.7; white-space: pre-wrap; }
.publish-steps { display: flex; flex-direction: column; gap: 14px; margin: 14px 0; }
.pub-step { display: flex; gap: 12px; align-items: flex-start; }
.pub-num {
  width: 28px; height: 28px; border-radius: 50%; background: #2080f0; color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 13px; flex-shrink: 0;
}
.pub-step strong { font-size: 14px; display: block; margin-bottom: 4px; }
.pub-step p { font-size: 12px; color: #666; margin: 0; line-height: 1.6; }
.final-cta { text-align: center; padding: 20px 0; }
</style>
