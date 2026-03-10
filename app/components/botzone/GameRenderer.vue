<template>
  <div class="game-renderer">
    <!-- 有自定义 HTML 渲染器时：可视化/JSON 切换 -->
    <template v-if="rendererHtml && gameLog">
      <!-- 视图切换 -->
      <NSpace align="center" style="margin-bottom: 12px">
        <NText style="font-size: 13px; color: var(--n-text-color-3)">显示模式：</NText>
        <NRadioGroup v-model:value="viewMode" size="small">
          <NRadioButton value="visual">可视化</NRadioButton>
          <NRadioButton value="json">JSON</NRadioButton>
        </NRadioGroup>
      </NSpace>

      <template v-if="viewMode === 'visual'">
        <!-- 回合导航 -->
        <NSpace align="center" style="margin-bottom: 12px">
          <NButton size="small" :disabled="currentRoundIdx === 0" @click="prevRound">← 上一回合</NButton>
          <NText style="font-size: 14px; font-weight: 600">
            第 {{ (gameLog.rounds[currentRoundIdx]?.round ?? currentRoundIdx + 1) }} 回合
            / 共 {{ gameLog.rounds.length }} 回合
          </NText>
          <NButton size="small" :disabled="currentRoundIdx === gameLog.rounds.length - 1" @click="nextRound">下一回合 →</NButton>
          <NButton size="small" secondary @click="currentRoundIdx = 0">⏮ 首回合</NButton>
          <NButton size="small" secondary @click="currentRoundIdx = gameLog.rounds.length - 1">末回合 ⏭</NButton>
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
          style="margin-top: 12px"
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

function prevRound() {
  if (currentRoundIdx.value > 0) currentRoundIdx.value--
}

function nextRound() {
  if (props.gameLog && currentRoundIdx.value < props.gameLog.rounds.length - 1) {
    currentRoundIdx.value++
  }
}

// 切换游戏时重置
watch(() => props.gameLog, () => {
  currentRoundIdx.value = 0
})
</script>

<style scoped>
.game-renderer {
  width: 100%;
}
</style>
