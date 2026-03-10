<template>
  <div class="wiki-content">
    <!-- Track selector -->
    <div class="track-selector">
      <div
        v-for="t in tracks"
        :key="t.id"
        class="track-card"
        :class="{ selected: activeTrack === t.id }"
        @click="selectTrack(t.id)"
      >
        <div class="track-icon">{{ t.icon }}</div>
        <div class="track-title">{{ t.title }}</div>
        <div class="track-desc">{{ t.desc }}</div>
        <div class="track-meta">{{ t.steps }} 步 · {{ t.level }}</div>
      </div>
    </div>

    <!-- Progress bar -->
    <div class="progress-bar">
      <div class="progress-fill" :style="{ width: progressPct + '%' }" />
    </div>
    <div class="progress-text">进度 {{ currentStep + 1 }} / {{ activeSteps.length }}</div>

    <!-- Tutorial content -->
    <div v-if="activeTrack === 'bot'" class="tutorial-body">
      <WikiBotTutorial
        :step="currentStep"
        :games="games"
        :default-game-id="defaultGameId"
        @next="nextStep"
        @go-playground="$emit('go-playground', $event)"
      />
    </div>
    <div v-else-if="activeTrack === 'judge'" class="tutorial-body">
      <WikiJudgeTutorial
        :step="currentStep"
        @next="nextStep"
        @go-playground="$emit('go-playground', $event)"
      />
    </div>
    <div v-else-if="activeTrack === 'renderer'" class="tutorial-body">
      <WikiRendererTutorial
        :step="currentStep"
        @next="nextStep"
        @go-renderer="$emit('go-renderer', $event)"
      />
    </div>

    <!-- Nav buttons -->
    <div class="nav-buttons">
      <NButton :disabled="currentStep === 0" @click="prevStep">← 上一步</NButton>
      <NSpace>
        <NText depth="3" style="font-size:12px">第 {{ currentStep + 1 }} 步，共 {{ activeSteps.length }} 步</NText>
      </NSpace>
      <NButton type="primary" :disabled="currentStep >= activeSteps.length - 1" @click="nextStep">
        下一步 →
      </NButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { NButton, NSpace, NText } from 'naive-ui'
import WikiBotTutorial from './WikiBotTutorial.vue'
import WikiJudgeTutorial from './WikiJudgeTutorial.vue'
import WikiRendererTutorial from './WikiRendererTutorial.vue'

const props = defineProps<{
  games: any[]
  defaultGameId?: number | null
}>()

const emit = defineEmits<{
  'go-playground': [{ tab: string; gameId?: number; code?: string; lang?: string }]
  'go-renderer': [{ html?: string }]
}>()

const activeTrack = ref('bot')
const currentStep = ref(0)

const tracks = [
  { id: 'bot', icon: '🤖', title: '我的第一个 Bot', desc: '从零学习如何编写 Bot 参加对战', steps: 5, level: '入门' },
  { id: 'judge', icon: '⚖️', title: '编写自定义裁判', desc: '为自己的游戏设计裁判程序', steps: 4, level: '进阶' },
  { id: 'renderer', icon: '🎨', title: '自定义游戏渲染器', desc: '让你的游戏拥有精美的可视化界面', steps: 4, level: '进阶' },
]

const trackSteps: Record<string, number> = { bot: 5, judge: 4, renderer: 4 }
const activeSteps = computed(() => Array.from({ length: trackSteps[activeTrack.value] || 1 }))
const progressPct = computed(() => ((currentStep.value) / (activeSteps.value.length - 1)) * 100)

function selectTrack(id: string) {
  activeTrack.value = id
  currentStep.value = 0
}

function nextStep() {
  if (currentStep.value < activeSteps.value.length - 1) currentStep.value++
}
function prevStep() {
  if (currentStep.value > 0) currentStep.value--
}
</script>

<style scoped>
.wiki-content { display: flex; flex-direction: column; gap: 16px; }
.track-selector { display: flex; gap: 12px; flex-wrap: wrap; }
.track-card {
  flex: 1; min-width: 200px; max-width: 280px;
  border: 2px solid #e0e0e6; border-radius: 10px; padding: 14px;
  cursor: pointer; transition: all 0.2s; background: #fff;
}
.track-card:hover { border-color: #2080f0; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(32,128,240,0.1); }
.track-card.selected { border-color: #2080f0; background: #e8f4ff; }
.track-icon { font-size: 28px; margin-bottom: 6px; }
.track-title { font-weight: 700; font-size: 15px; margin-bottom: 4px; }
.track-desc { font-size: 12px; color: #666; margin-bottom: 8px; line-height: 1.5; }
.track-meta { font-size: 11px; color: #999; font-weight: 600; }
.progress-bar { height: 4px; background: #e0e0e6; border-radius: 2px; overflow: hidden; }
.progress-fill { height: 100%; background: linear-gradient(90deg, #2080f0, #18a058); border-radius: 2px; transition: width 0.4s ease; }
.progress-text { font-size: 12px; color: #888; }
.tutorial-body { min-height: 400px; }
.nav-buttons { display: flex; align-items: center; justify-content: space-between; padding-top: 16px; border-top: 1px solid #f0f0f0; }
</style>
