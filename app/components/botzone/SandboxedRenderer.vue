<template>
  <div ref="containerRef" :class="['sandboxed-renderer', { 'is-fullscreen': isFullscreen }]">
    <!-- 全屏切换按钮 -->
    <button class="fullscreen-btn" :title="isFullscreen ? '退出全屏' : '全屏'" @click="toggleFullscreen">
      {{ isFullscreen ? '✕' : '⛶' }}
    </button>
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
const containerRef = ref<HTMLElement | null>(null)
const isFullscreen = ref(false)

function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value
  if (isFullscreen.value) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
}

// Close fullscreen on Escape
onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && isFullscreen.value) {
    isFullscreen.value = false
    document.body.style.overflow = ''
  }
}

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
  position: relative;
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
}

.renderer-iframe {
  width: 100%;
  height: min(68vh, 640px);
  border: none;
  display: block;
}

/* 全屏覆盖层 */
.sandboxed-renderer.is-fullscreen {
  position: fixed;
  inset: 0;
  z-index: 9000;
  background: #fff;
  border-radius: 0;
  padding: 0;
}
.sandboxed-renderer.is-fullscreen .renderer-iframe {
  height: 100vh;
  width: 100vw;
}

/* 全屏按钮 */
.fullscreen-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 9001;
  background: rgba(0, 0, 0, 0.45);
  color: #fff;
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
  line-height: 1;
}
.fullscreen-btn:hover {
  background: rgba(0, 0, 0, 0.7);
}
</style>
