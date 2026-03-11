<template>
  <!-- 全屏覆盖层包裹整个回放区（含控制按钮） -->
  <div :class="['game-renderer', { 'is-fullscreen': isFullscreen }]">
    <!-- 有自定义 HTML 渲染器时：可视化/JSON 切换 -->
    <template v-if="rendererHtml && gameLog">
      <!-- 顶栏：视图切换 + 全屏按钮 -->
      <div class="renderer-topbar">
        <NSpace align="center" style="flex:1">
          <NText style="font-size: 13px; color: var(--n-text-color-3)">显示模式：</NText>
          <NRadioGroup v-model:value="viewMode" size="small">
            <NRadioButton value="visual">可视化</NRadioButton>
            <NRadioButton value="json">JSON</NRadioButton>
          </NRadioGroup>
        </NSpace>
        <button class="fullscreen-btn" :title="isFullscreen ? '退出全屏 (Esc)' : '全屏'" @click="toggleFullscreen">
          {{ isFullscreen ? '✕' : '⛶' }}
        </button>
      </div>

      <template v-if="viewMode === 'visual'">
        <!-- 回合导航 -->
        <NSpace align="center" style="margin-bottom: 10px; flex-wrap: wrap">
          <NButton size="small" :disabled="currentRoundIdx === 0" @click="prevRound">← 上一回合</NButton>
          <NText style="font-size: 14px; font-weight: 600">
            第 {{ (gameLog.rounds[currentRoundIdx]?.round ?? currentRoundIdx + 1) }} 回合
            / 共 {{ gameLog.rounds.length }} 回合
          </NText>
          <NButton size="small" :disabled="currentRoundIdx === gameLog.rounds.length - 1" @click="nextRound">下一回合 →</NButton>
          <NButton size="small" secondary @click="currentRoundIdx = 0">⏮</NButton>
          <NButton size="small" secondary @click="currentRoundIdx = gameLog.rounds.length - 1">⏭</NButton>
        </NSpace>

        <BotzoneSandboxedRenderer
          :renderer-html="rendererHtml"
          :game-log="gameLog"
          :current-round="currentRoundIdx"
        />

        <!-- 末回合最终得分 -->
        <NAlert
          v-if="currentRoundIdx === gameLog.rounds.length - 1"
          type="info"
          title="最终得分"
          style="margin-top: 10px"
        >
          <NSpace>
            <span v-for="(score, player) in gameLog.finalResult" :key="player">
              <NText strong>{{ player }}</NText>：{{ score }} 分
            </span>
          </NSpace>
        </NAlert>
      </template>

      <template v-else>
        <BotzoneReplaySection :game-log="gameLog" />
      </template>
    </template>

    <!-- 无渲染器：纯 JSON 回放 -->
    <BotzoneReplaySection v-else-if="gameLog" :game-log="gameLog" />

    <NEmpty v-else description="暂无对局数据" />
  </div>
</template>

<script setup lang="ts">
import type { BotzoneGameLog } from '~/types/botzone'

const props = defineProps<{
  gameLog?: BotzoneGameLog | null
  rendererHtml?: string
  currentRound?: number
}>()

const viewMode = ref<'visual' | 'json'>('visual')
const currentRoundIdx = ref(props.currentRound ?? 0)
const isFullscreen = ref(false)

function prevRound() {
  if (currentRoundIdx.value > 0) currentRoundIdx.value--
}

function nextRound() {
  if (props.gameLog && currentRoundIdx.value < props.gameLog.rounds.length - 1) {
    currentRoundIdx.value++
  }
}

function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value
  document.body.style.overflow = isFullscreen.value ? 'hidden' : ''
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && isFullscreen.value) {
    isFullscreen.value = false
    document.body.style.overflow = ''
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})

// 切换游戏时重置
watch(() => props.gameLog, () => {
  currentRoundIdx.value = 0
})
</script>

<style scoped>
.game-renderer {
  width: 100%;
  position: relative;
}

/* 全屏：整个回放区（含控制按钮）铺满视口 */
.game-renderer.is-fullscreen {
  position: fixed;
  inset: 0;
  z-index: 9000;
  background: var(--n-color, #fff);
  padding: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

/* 全屏时 iframe 撑满剩余高度 */
.game-renderer.is-fullscreen :deep(.renderer-iframe) {
  height: calc(100vh - 120px);
  flex: 1;
}

/* 顶栏：视图切换 + 全屏按钮 */
.renderer-topbar {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  gap: 8px;
}

/* 全屏按钮 */
.fullscreen-btn {
  margin-left: auto;
  background: rgba(0, 0, 0, 0.12);
  color: inherit;
  border: none;
  border-radius: 4px;
  width: 32px;
  height: 32px;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  flex-shrink: 0;
}
.fullscreen-btn:hover {
  background: rgba(0, 0, 0, 0.25);
}
</style>
