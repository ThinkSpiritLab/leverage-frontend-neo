<template>
  <div class="game-renderer">
    <!-- 有自定义 HTML 渲染器时：可视化/JSON 切换 -->
    <template v-if="rendererHtml && gameLog">
      <NSpace align="center" style="margin-bottom: 12px">
        <NText style="font-size: 13px; color: var(--n-text-color-3)">显示模式：</NText>
        <NRadioGroup v-model:value="viewMode" size="small">
          <NRadioButton value="visual">可视化</NRadioButton>
          <NRadioButton value="json">JSON</NRadioButton>
        </NRadioGroup>
      </NSpace>

      <template v-if="viewMode === 'visual'">
        <BotzoneSandboxedRenderer
          :renderer-html="rendererHtml"
          :game-log="gameLog"
          :current-round="currentRound"
        />
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
const currentRound = computed(() => props.currentRound ?? 0)
</script>

<style scoped>
.game-renderer {
  width: 100%;
}
</style>
