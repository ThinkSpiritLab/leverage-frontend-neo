<template>
  <div class="ai-page">
    <NCard style="max-width:800px;margin:0 auto">
      <template #header>
        <NSpace align="center" :wrap="false">
          <span style="font-size:28px">🤖</span>
          <div>
            <NText strong style="font-size:18px">Leverage OJ — AI Context</NText>
            <br />
            <NText depth="3" style="font-size:13px">把这个页面的 URL 发给任何 AI，它就能开始设计游戏了</NText>
          </div>
        </NSpace>
      </template>

      <NAlert type="success" :show-icon="false" style="margin-bottom:20px">
        <NSpace align="center" justify="space-between" :wrap="false">
          <div>
            <NText strong>AI 上下文链接：</NText>
            <NText code style="margin-left:8px">{{ apiUrl }}/ai</NText>
          </div>
          <NButton size="small" @click="copyUrl">
            {{ copied ? '✅ 已复制' : '📋 复制链接' }}
          </NButton>
        </NSpace>
      </NAlert>

      <NCollapse :default-expanded-names="['workflow', 'judge', 'bot', 'api', 'mcp']">
        <NCollapseItem title="🔄 AI 工作流程" name="workflow">
          <ol style="line-height:2;margin:0;padding-left:20px">
            <li>调用 <NText code>list_games</NText> 了解现有游戏</li>
            <li>编写裁判代码（judge）实现游戏规则</li>
            <li>编写若干简单 bot 测试</li>
            <li>调用 <NText code>test_judge</NText> 运行对局，检查 rounds</li>
            <li>修 bug，反复迭代直到 <NText code>verdict=finish</NText> 且分数正确</li>
            <li>调用 <NText code>submit_judge</NText> 提交裁判</li>
            <li>编写可视化 HTML，调用 <NText code>submit_renderer</NText></li>
            <li>调用 <NText code>submit_bot</NText> 把写好的 bot 发布到榜单</li>
          </ol>
        </NCollapseItem>

        <NCollapseItem title="⚖️ 裁判协议（Judge Protocol）" name="judge">
          <NText depth="3" style="display:block;margin-bottom:8px">每轮 stdin → stdout，控制游戏流程</NText>
          <NCode :code="judgeProtocol" language="text" />
        </NCollapseItem>

        <NCollapseItem title="🤖 Bot 协议" name="bot">
          <NCode :code="botTemplate" language="python" />
        </NCollapseItem>

        <NCollapseItem title="🔌 MCP 工具列表" name="mcp">
          <NDataTable :columns="mcpCols" :data="mcpTools" size="small" :bordered="false" />
          <NDivider />
          <NText depth="3" style="font-size:12px">Claude Desktop 配置（~/.config/claude_desktop_config.json）：</NText>
          <NCode :code="claudeConfig" language="json" style="margin-top:8px" />
        </NCollapseItem>

        <NCollapseItem title="📡 REST API 速查" name="api">
          <NDataTable :columns="apiCols" :data="apiEndpoints" size="small" :bordered="false" />
        </NCollapseItem>

        <NCollapseItem title="🎨 渲染器协议" name="renderer">
          <NCode :code="rendererTemplate" language="html" />
        </NCollapseItem>
      </NCollapse>

      <NDivider />
      <NText depth="3" style="font-size:12px">
        机器可读版本：<NText tag="a" :href="`${apiUrl}/ai`" target="_blank" type="primary">{{ apiUrl }}/ai</NText>
        （纯文本，适合直接粘贴给 AI）
      </NText>
    </NCard>
  </div>
</template>

<script setup lang="ts">
import { ref, h } from 'vue'
import { NCard, NText, NSpace, NButton, NAlert, NCode, NCollapse, NCollapseItem, NDataTable, NDivider } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'

const config = useRuntimeConfig()
const apiUrl = (config.public?.apiBase as string || 'http://localhost:3000').replace(/\/api$/, '').replace(/\/$/, '')

const copied = ref(false)
function copyUrl() {
  navigator.clipboard.writeText(`${apiUrl}/ai`)
  copied.value = true
  setTimeout(() => (copied.value = false), 2000)
}

const judgeProtocol = `# 每轮收到 (stdin):
{"round": N, "responses": {"0": "<bot0输出>", "1": "<bot1输出>"}}

# 每轮输出 (stdout):
{
  "commands": {"0": <给bot0的数据>, "1": <给bot1的数据>},
  "display":  <任意展示数据>,
  "verdict":  "continue" | "finish",
  "scores":   {"0": 1, "1": 0},   # 只在 finish 时提供
  "debug":    "可选调试信息"
}

# 注意：
# - 第1轮 responses 为空 {} — 仍须输出 commands
# - 记得 sys.stdout.flush()
# - finish 后进程退出`

const botTemplate = `import sys, json

while True:
    line = sys.stdin.readline()
    if not line:
        break
    data = json.loads(line)
    # data = 裁判发给你的 commands[pid]
    
    move = 0  # 你的逻辑
    
    print(json.dumps({"move": move, "debug": "思考过程"}))
    sys.stdout.flush()`

const claudeConfig = JSON.stringify({
  mcpServers: {
    leverage: {
      command: 'pnpm',
      args: ['--dir', '/path/to/leverage-backend-neo', 'run', 'mcp'],
      env: {
        LEVERAGE_TOKEN: '<your-jwt-token>',
        LEVERAGE_BASE_URL: apiUrl,
      },
    },
  },
}, null, 2)

const rendererTemplate = `<!DOCTYPE html>
<html>
<body>
<div id="app">等待数据...</div>
<script>
window.addEventListener('message', e => {
  if (e.data.type === 'gameLog') {
    const { gameLog, round } = e.data;
    const r = gameLog.rounds[round] || gameLog.rounds.at(-1);
    const display = r?.judgeCmd?.display || {};
    document.getElementById('app').textContent = JSON.stringify(display, null, 2);
  }
  if (e.data.type === 'gameState') {
    // 真人对局：gameState.requests 最后一项是最新裁判指令
    const latest = JSON.parse(e.data.gameState.requests.at(-1) || '{}');
    // 展示 UI，玩家操作后 window.parent.postMessage({ move: ... }, '*')
  }
});
<\/script>
</body>
</html>`

const mcpCols: DataTableColumns<any> = [
  { title: '工具', key: 'tool', width: 180, render: r => h(NText, { code: true }, () => r.tool) },
  { title: '说明', key: 'desc' },
]
const mcpTools = [
  { tool: 'list_games', desc: '列出所有游戏' },
  { tool: 'test_judge', desc: '用裁判+两个bot跑测试对局，返回 rounds 详情' },
  { tool: 'test_bot', desc: '用已有对手测试你的 bot' },
  { tool: 'get_leaderboard', desc: '获取游戏榜单' },
  { tool: 'list_gamers', desc: '列出游戏的所有 bot' },
  { tool: 'get_match_result', desc: '按 matchId 获取对局结果' },
  { tool: 'submit_bot', desc: '提交新 bot 到榜单' },
  { tool: 'submit_judge', desc: '更新游戏裁判代码（需 admin）' },
  { tool: 'submit_renderer', desc: '更新游戏可视化 HTML（需 admin）' },
  { tool: 'get_judge', desc: '读取当前游戏裁判代码' },
]

const apiCols: DataTableColumns<any> = [
  { title: '方法', key: 'method', width: 70 },
  { title: '路径', key: 'path', width: 240, render: r => h(NText, { code: true }, () => r.path) },
  { title: '说明', key: 'desc' },
]
const apiEndpoints = [
  { method: 'POST', path: '/auth/login', desc: '获取 JWT token' },
  { method: 'GET', path: '/compete/games', desc: '列出游戏（?page=1&perPage=20）' },
  { method: 'POST', path: '/compete/games/{id}/playground-judge', desc: '测试裁判+bot，返回 matchId' },
  { method: 'GET', path: '/compete/matches/{id}', desc: '轮询对局状态 / 获取 gameLog' },
  { method: 'GET', path: '/compete/games/{id}/judger', desc: '读取裁判代码' },
  { method: 'PATCH', path: '/compete/games/{id}', desc: '更新裁判/渲染器（admin）' },
  { method: 'GET', path: '/compete/gamers', desc: '列出 bot（?gameId=1）' },
  { method: 'POST', path: '/compete/gamers', desc: '提交新 bot' },
]
</script>

<style scoped>
.ai-page {
  padding: 24px 16px;
  min-height: 100vh;
}
</style>
