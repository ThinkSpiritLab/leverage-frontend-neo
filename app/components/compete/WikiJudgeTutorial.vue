<template>
  <div class="judge-tutorial">
    <!-- Step 0: 裁判是什么 -->
    <div v-if="step === 0">
      <div class="step-intro">
        <h3>⚖️ 第一步：裁判是什么？</h3>
        <p class="intro-text">
          裁判（Judge）是游戏的大脑。它负责：维护游戏状态、每轮给 Bot 发指令、接收 Bot 的移动、判断胜负。
          裁判本身也是一个沙箱程序，通过 stdio JSON 和 botzone 引擎通信。
        </p>
      </div>

      <div class="judge-flow">
        <div class="flow-row">
          <div class="flow-node engine">🔧 引擎</div>
          <div class="flow-arrow">→ <span class="flow-label">{"round":1, "responses":{}}</span></div>
          <div class="flow-node judge">⚖️ 裁判</div>
          <div class="flow-arrow">→ <span class="flow-label">{"commands":{...}, "verdict":"continue"}</span></div>
          <div class="flow-node engine">🔧 引擎</div>
        </div>
        <div class="flow-sub">(引擎再把 commands 分发给各个 Bot，收集回应，再发回裁判)</div>
      </div>

      <h4 style="margin-top:16px">裁判的 stdin（每轮）：</h4>
      <WikiCodeBlock
        :code="judgeStdin"
        lang="json"
        explanation="round=轮次, responses=本轮各Bot的回应（首轮为空{}）"
      />
      <h4>裁判的 stdout（每轮）：</h4>
      <WikiCodeBlock
        :code="judgeStdout"
        lang="json"
        explanation="commands=发给各Bot的指令, verdict=继续/结束, scores=游戏结束时的最终得分, debug=调试信息"
      />

      <NAlert type="info" :show-icon="false" style="margin:12px 0;font-size:13px">
        裁判是<strong>长驻进程</strong>，整个对局期间持续运行，通过 stdin/stdout 和引擎交换消息。
      </NAlert>
    </div>

    <!-- Step 1: 第一个裁判 -->
    <div v-if="step === 1">
      <div class="step-intro">
        <h3>✏️ 第二步：写一个「猜数字」裁判</h3>
        <p class="intro-text">
          我们来实现「猜数字」游戏的裁判：5 轮，两名玩家同时猜 1-100 的整数，
          猜得最近的赢得该轮，多轮胜者获胜。
        </p>
      </div>

      <WikiCodeBlock
        :code="guessJudgePy"
        lang="python"
        :tryable="true"
        explanation="这是完整的猜数字裁判实现。注意 stdout.flush() 必须有，否则引擎收不到输出！"
        @try-it="$emit('go-playground', { tab: 'judge', code: $event, lang: 'python' })"
      />

      <div class="key-points">
        <h4>关键点解析：</h4>
        <div class="point-card">
          <div class="point-icon">🎯</div>
          <div>
            <strong>首轮判断</strong>：<code>responses == {}</code> → 发送初始化命令，告诉 Bot 游戏参数
          </div>
        </div>
        <div class="point-card">
          <div class="point-icon">📊</div>
          <div>
            <strong>verdict 两种状态</strong>：<code>"continue"</code>（继续对局）或 <code>"finish"</code>（游戏结束），
            结束时必须提供 <code>scores</code>
          </div>
        </div>
        <div class="point-card">
          <div class="point-icon">💬</div>
          <div>
            <strong>debug 字段</strong>：这里的内容会出现在时序图中，帮你调试裁判逻辑
          </div>
        </div>
      </div>
    </div>

    <!-- Step 2: 错误处理和边界 -->
    <div v-if="step === 2">
      <div class="step-intro">
        <h3>🛡️ 第三步：处理异常输入</h3>
        <p class="intro-text">
          Bot 可能提交非法移动（非数字、越界、格式错误）。健壮的裁判应该妥善处理这些情况，
          而不是自己崩溃。
        </p>
      </div>

      <WikiCodeBlock
        :code="robustJudgePy"
        lang="python"
        explanation="加入了输入验证。Bot 提交非法移动时裁判给一个惩罚分，而不是崩溃退出。"
      />

      <NAlert type="warning" :show-icon="false" style="margin:12px 0;font-size:13px">
        <strong>裁判崩溃 = 对局异常</strong>。如果裁判因为 Bot 的非法输入而崩溃，这个对局会被标记为错误，
        影响排行榜。请务必加 try-except/try-catch！
      </NAlert>

      <div class="checklist">
        <h4>发布裁判前检查清单：</h4>
        <div class="check-item">✅ <span>stdout.flush() 每轮都有</span></div>
        <div class="check-item">✅ <span>Bot 非法输入有处理（try-except）</span></div>
        <div class="check-item">✅ <span>游戏结束时 verdict="finish" 且有 scores</span></div>
        <div class="check-item">✅ <span>没有无限循环（必须按轮次退出）</span></div>
        <div class="check-item">✅ <span>debug 字段有有意义的输出</span></div>
      </div>
    </div>

    <!-- Step 3: 发布 -->
    <div v-if="step === 3">
      <div class="step-intro">
        <h3>🚀 第四步：在 Playground 测试并发布游戏</h3>
        <p class="intro-text">
          裁判写好后，先在 Playground 的「裁判测试」Tab 里验证它能跑通，
          再去管理后台创建游戏，把裁判代码填进去。
        </p>
      </div>

      <div class="publish-flow">
        <div class="pflow-step">
          <span class="pflow-num">1</span>
          <div>
            <strong>Playground → 裁判测试 Tab</strong>
            <p>把裁判代码粘贴进去，选两个已有 Bot 测试，查看时序图确认逻辑正确。</p>
          </div>
        </div>
        <div class="pflow-step">
          <span class="pflow-num">2</span>
          <div>
            <strong>管理后台 → 创建游戏</strong>
            <p>填写游戏名称、玩家数、时间/内存限制、游戏规则描述，粘贴裁判代码。</p>
          </div>
        </div>
        <div class="pflow-step">
          <span class="pflow-num">3</span>
          <div>
            <strong>上传渲染器（可选）</strong>
            <p>在 Playground → 渲染器 Tab 写 HTML 渲染器，上传到游戏。</p>
          </div>
        </div>
        <div class="pflow-step">
          <span class="pflow-num">4</span>
          <div>
            <strong>邀请玩家参与</strong>
            <p>游戏创建后，其他用户可以提交 Bot 参与对战。</p>
          </div>
        </div>
      </div>

      <div class="final-cta">
        <NButton type="primary" size="large" @click="$emit('go-playground', { tab: 'judge' })">
          ⚖️ 去 Playground 测试裁判 →
        </NButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { NButton, NAlert } from 'naive-ui'
import WikiCodeBlock from './WikiCodeBlock.vue'

defineProps<{ step: number }>()
defineEmits<{ 'next': []; 'go-playground': [any] }>()

const judgeStdin = `{"round": 2, "responses": {"0": "42", "1": "87"}}`

const judgeStdout = `{
  "commands": {
    "0": {"round": 2, "rounds": 5},
    "1": {"round": 2, "rounds": 5}
  },
  "display": {"round": 2, "secret": 65},
  "verdict": "continue",
  "debug": "secret=65, Bot0猜42差23, Bot1猜87差22, Bot1赢本轮"
}`

const guessJudgePy = `import sys
import json
import random

rounds_total = 5
secret = random.randint(1, 100)
scores = {"0": 0, "1": 0}
round_num = 0

for line in sys.stdin:
    line = line.strip()
    if not line: continue
    data = json.loads(line)
    round_num = data.get('round', round_num + 1)
    responses = data.get('responses', {})
    
    if not responses:
        # 首轮：发送游戏初始化信息
        result = {
            "commands": {
                "0": {"round": 1, "rounds": rounds_total},
                "1": {"round": 1, "rounds": rounds_total}
            },
            "display": {"round": 1, "total": rounds_total},
            "verdict": "continue",
            "debug": f"游戏开始！秘密数字={secret}"
        }
    else:
        # 处理 Bot 的猜测
        guess0 = int(responses.get("0", 50))
        guess1 = int(responses.get("1", 50))
        diff0 = abs(guess0 - secret)
        diff1 = abs(guess1 - secret)
        
        # 判断本轮胜负
        if diff0 < diff1:
            scores["0"] += 1
        elif diff1 < diff0:
            scores["1"] += 1
        # diff0 == diff1 → 平局，不加分
        
        secret = random.randint(1, 100)  # 换新秘密数字
        
        if round_num >= rounds_total:
            # 游戏结束
            result = {
                "commands": {},
                "display": {"final": True, "scores": scores},
                "verdict": "finish",
                "scores": scores,
                "debug": f"游戏结束！Bot0={scores['0']}分 Bot1={scores['1']}分"
            }
        else:
            # 继续下一轮
            result = {
                "commands": {
                    "0": {"round": round_num + 1, "rounds": rounds_total, "scores": scores},
                    "1": {"round": round_num + 1, "rounds": rounds_total, "scores": scores}
                },
                "display": {"round": round_num + 1, "scores": scores},
                "verdict": "continue",
                "debug": f"第{round_num}轮: secret={secret-1}, Bot0猜{guess0}(差{diff0}), Bot1猜{guess1}(差{diff1})"
            }
    
    print(json.dumps(result))
    sys.stdout.flush()  # 必须！`

const robustJudgePy = `def parse_move(raw, default=50):
    """安全解析 Bot 的移动，失败返回默认值"""
    try:
        val = int(str(raw).strip())
        return max(1, min(100, val))  # 限制在 [1, 100]
    except (ValueError, TypeError):
        return default  # 非法输入使用默认值

# 在处理 responses 时：
guess0 = parse_move(responses.get("0"), default=50)
guess1 = parse_move(responses.get("1"), default=50)`
</script>

<style scoped>
.judge-tutorial { max-width: 800px; }
.step-intro { margin-bottom: 16px; }
.step-intro h3 { font-size: 18px; margin-bottom: 8px; }
.intro-text { font-size: 14px; color: #444; line-height: 1.7; }
.judge-flow { padding: 16px; background: #f9f9fb; border-radius: 10px; margin: 14px 0; }
.flow-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.flow-node { padding: 8px 14px; border-radius: 8px; font-weight: 700; font-size: 14px; }
.engine { background: #fff7e6; color: #d46b08; }
.judge { background: #f9f0ff; color: #722ed1; }
.flow-arrow { display: flex; align-items: center; gap: 4px; font-size: 12px; color: #888; }
.flow-label { background: #fff; padding: 2px 8px; border-radius: 4px; border: 1px solid #e0e0e6; font-family: monospace; font-size: 11px; }
.flow-sub { font-size: 11px; color: #aaa; margin-top: 8px; text-align: center; }
.key-points { margin-top: 16px; display: flex; flex-direction: column; gap: 8px; }
.key-points h4 { font-size: 14px; margin-bottom: 4px; }
.point-card { display: flex; gap: 10px; padding: 10px; background: #f6f8fa; border-radius: 8px; font-size: 13px; }
.point-icon { font-size: 18px; flex-shrink: 0; }
.checklist { margin-top: 16px; }
.checklist h4 { font-size: 14px; margin-bottom: 8px; }
.check-item { font-size: 13px; padding: 5px 0; }
.check-item span { color: #444; }
.publish-flow, .pflow-step { display: flex; flex-direction: column; gap: 12px; margin: 14px 0; }
.pflow-step { flex-direction: row; gap: 12px; }
.pflow-num {
  width: 28px; height: 28px; border-radius: 50%; background: #722ed1; color: #fff;
  display: flex; align-items: center; justify-content: center; font-weight: 700; flex-shrink: 0;
}
.pflow-step strong { display: block; font-size: 14px; margin-bottom: 4px; }
.pflow-step p { font-size: 12px; color: #666; margin: 0; line-height: 1.6; }
.final-cta { text-align: center; padding: 20px 0; }
</style>
