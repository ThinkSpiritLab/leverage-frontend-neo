<template>
  <iframe
    ref="iframeRef"
    :srcdoc="rendererHtml"
    sandbox="allow-scripts"
    style="width:100%;height:400px;border:none;display:block"
    @load="onIframeLoad"
  />
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
  // postMessage after the iframe has loaded (handled via @load),
  // but also attempt immediately in case srcdoc renders synchronously.
  postGameLog()
})

watch(() => props.currentRound, () => {
  postGameLog()
})

watch(() => props.gameLog, () => {
  postGameLog()
})
</script>
