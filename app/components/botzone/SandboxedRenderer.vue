<template>
  <div class="sandboxed-renderer">
    <iframe
      ref="iframeRef"
      :srcdoc="rendererHtml"
      sandbox="allow-scripts"
      allowfullscreen
      class="renderer-iframe"
      @load="onIframeLoad"
    />
  </div>
</template>

<script setup lang="ts">
import type { BotzoneGameLog } from '~/types/botzone'

const props = defineProps<{
  rendererHtml: string
  gameLog: BotzoneGameLog
  currentRound: number
}>()

const iframeRef = ref<HTMLIFrameElement | null>(null)

function postGameLog() {
  iframeRef.value?.contentWindow?.postMessage(
    { type: 'gameLog', gameLog: props.gameLog, round: props.currentRound },
    '*',
  )
}

function onIframeLoad() {
  postGameLog()
}

onMounted(() => {
  postGameLog()
})

watch(() => props.currentRound, () => {
  postGameLog()
})

watch(() => props.gameLog, () => {
  postGameLog()
})
</script>

<style scoped>
.sandboxed-renderer {
  width: 100%;
}
.renderer-iframe {
  width: 100%;
  height: min(68vh, 640px);
  border: none;
  display: block;
  border-radius: 8px;
}
</style>
