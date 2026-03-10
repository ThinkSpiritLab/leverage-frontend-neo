<template>
  <div class="game-renderer">
    <!-- 自定义 HTML 沙箱渲染器 -->
    <BotzoneBotzoneReplaySection v-if="!rendererHtml && gameLog" :game-log="gameLog" />
    <template v-else-if="rendererHtml">
      <BotzoneSandboxedRenderer
        v-if="gameLog"
        :renderer-html="rendererHtml"
        :game-log="gameLog"
        :current-round="currentRound"
      />
      <NEmpty v-else description="暂无对局数据" />
    </template>
    <NEmpty v-else description="游戏可视化即将推出" />
  </div>
</template>

<script setup lang="ts">
import type { BotzoneGameLog } from '~/types/botzone'

const props = defineProps<{
  gameLog?: BotzoneGameLog | null
  rendererHtml?: string
  currentRound?: number
}>()

const currentRound = computed(() => props.currentRound ?? 0)
</script>

<style scoped>
.game-renderer {
  width: 100%;
}
</style>
