<template>
  <div class="timeline-container">
    <!-- Participants header -->
    <div class="timeline-header">
      <div
        v-for="p in participants"
        :key="p.id"
        class="participant-badge"
        :style="{ borderColor: p.color, background: p.color + '15' }"
      >
        <span class="participant-icon">{{ p.icon }}</span>
        <span class="participant-name">{{ p.name }}</span>
      </div>
    </div>

    <!-- Timeline rounds -->
    <div class="timeline-body">
      <TransitionGroup name="round-appear">
        <div
          v-for="(round, ri) in visibleRounds"
          :key="ri"
          class="timeline-round"
        >
          <div class="round-label">
            <NTag size="small" type="info" :bordered="false">第 {{ round.round }} 轮</NTag>
          </div>

          <TransitionGroup name="event-appear">
            <div
              v-for="(event, ei) in round.events"
              :key="ei"
              class="timeline-event"
              :class="`event-${event.type}`"
            >
              <!-- Arrow row -->
              <div class="event-arrow">
                <span class="event-from" :style="{ color: getColor(event.from) }">
                  {{ getIcon(event.from) }} {{ event.from }}
                </span>
                <span class="event-arrow-sym">→</span>
                <span class="event-to" :style="{ color: getColor(event.to) }">
                  {{ getIcon(event.to) }} {{ event.to }}
                </span>
              </div>

              <!-- Content -->
              <div class="event-content">
                <pre class="event-data">{{ formatData(event.data) }}</pre>
                <!-- Debug info -->
                <div v-if="event.debug" class="event-debug">
                  <span class="debug-label">💬</span>
                  <span class="debug-text">{{ event.debug }}</span>
                </div>
                <div v-if="event.stderr" class="event-stderr">
                  <span class="debug-label">📋 stderr:</span>
                  <span class="debug-text">{{ event.stderr }}</span>
                </div>
              </div>
            </div>
          </TransitionGroup>

          <!-- Display data -->
          <div v-if="round.display && showDisplay" class="round-display">
            <span class="display-label">🖼 Display</span>
            <pre class="event-data">{{ JSON.stringify(round.display, null, 2) }}</pre>
          </div>
        </div>
      </TransitionGroup>

      <!-- Final result -->
      <Transition name="round-appear">
        <div v-if="finalResult && visibleRounds.length === allRounds.length" class="timeline-result">
          <NAlert
            :type="resultType"
            :show-icon="false"
            style="border-radius:8px"
          >
            <div class="result-content">
              <span class="result-emoji">{{ resultEmoji }}</span>
              <div>
                <div class="result-title">{{ resultTitle }}</div>
                <div class="result-scores">
                  <span
                    v-for="(score, pid) in finalResult"
                    :key="pid"
                    class="score-chip"
                    :style="{ background: getColor(`Bot${pid}`) + '30', color: getColor(`Bot${pid}`) }"
                  >
                    {{ participantName(pid) }}: {{ score }}
                  </span>
                </div>
              </div>
            </div>
          </NAlert>
        </div>
      </Transition>
    </div>

    <!-- Controls -->
    <div v-if="allRounds.length > 0" class="timeline-controls">
      <NSlider
        :value="animStep"
        :min="0"
        :max="allRounds.length"
        :step="1"
        style="flex:1"
        @update:value="jumpTo"
      />
      <NText depth="3" style="font-size:12px;min-width:60px;text-align:right">
        {{ visibleRounds.length }} / {{ allRounds.length }} 轮
      </NText>
      <NButton size="small" :disabled="animStep >= allRounds.length" @click="animateAll">
        {{ animStep === 0 ? '▶ 播放' : '⏩ 继续' }}
      </NButton>
      <NButton size="small" text @click="showDisplay = !showDisplay">
        {{ showDisplay ? '隐藏 Display' : '显示 Display' }}
      </NButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { NTag, NAlert, NButton, NText, NSlider } from 'naive-ui'

export interface TimelineEvent {
  from: string   // 'Judge' | 'Bot0' | 'Bot1'
  to: string
  type: 'cmd' | 'resp' | 'display'
  data: any
  debug?: string
  stderr?: string
}

export interface TimelineRound {
  round: number
  events: TimelineEvent[]
  display?: any
}

interface Participant {
  id: string
  name: string
  icon: string
  color: string
}

const props = defineProps<{
  rounds: TimelineRound[]
  finalResult?: Record<string, number> | null
  judgerName?: string
  botNames?: Record<string, string>  // pid → name
}>()

const showDisplay = ref(false)
const animStep = ref(0)
let animTimer: ReturnType<typeof setTimeout> | null = null

const allRounds = computed(() => props.rounds)
const visibleRounds = computed(() => allRounds.value.slice(0, animStep.value))

const COLORS: Record<string, string> = {
  Judge: '#722ed1',
  Bot0: '#2080f0',
  Bot1: '#d03050',
  Bot2: '#f0a020',
}

const ICONS: Record<string, string> = {
  Judge: '⚖️',
  Bot0: '🤖',
  Bot1: '🤖',
  Bot2: '🤖',
}

function getColor(id: string) {
  return COLORS[id] || '#888'
}

function getIcon(id: string) {
  return ICONS[id] || '📦'
}

const participants = computed<Participant[]>(() => {
  const ps: Participant[] = [
    { id: 'Judge', name: props.judgerName || '裁判', icon: '⚖️', color: '#722ed1' },
  ]
  const bots = props.botNames || {}
  const numBots = Object.keys(bots).length || 2
  for (let i = 0; i < numBots; i++) {
    ps.push({
      id: `Bot${i}`,
      name: bots[String(i)] || `Bot ${i}`,
      icon: '🤖',
      color: i === 0 ? '#2080f0' : '#d03050',
    })
  }
  return ps
})

function participantName(pid: string | number): string {
  const pidStr = String(pid)
  if (props.botNames?.[pidStr]) return props.botNames[pidStr]
  return `Bot${pidStr}`
}

function formatData(data: any): string {
  if (data === null || data === undefined) return '—'
  if (typeof data === 'object') return JSON.stringify(data, null, 2)
  return String(data)
}

const maxScore = computed(() => {
  if (!props.finalResult) return 0
  return Math.max(...Object.values(props.finalResult))
})

const winners = computed(() => {
  if (!props.finalResult) return []
  return Object.entries(props.finalResult)
    .filter(([, v]) => v === maxScore.value)
    .map(([k]) => k)
})

const isDraw = computed(() => props.finalResult && winners.value.length === Object.keys(props.finalResult).length)

const resultType = computed<'success' | 'warning' | 'error'>(() =>
  isDraw.value ? 'warning' : 'success'
)

const resultEmoji = computed(() => isDraw.value ? '🤝' : '🏆')

const resultTitle = computed(() => {
  if (!props.finalResult) return ''
  if (isDraw.value) return '平局！'
  return `${winners.value.map(pid => participantName(pid)).join('、')} 获胜！`
})

function jumpTo(step: number) {
  if (animTimer) { clearTimeout(animTimer); animTimer = null }
  animStep.value = step
}

function animateAll() {
  if (animStep.value >= allRounds.value.length) return
  function step() {
    if (animStep.value < allRounds.value.length) {
      animStep.value++
      animTimer = setTimeout(step, 400)
    }
  }
  step()
}

// Auto-animate when rounds arrive
watch(() => props.rounds.length, (len) => {
  if (len > 0 && animStep.value === 0) {
    animStep.value = 0
    setTimeout(animateAll, 300)
  }
}, { immediate: true })
</script>

<style scoped>
.timeline-container { display: flex; flex-direction: column; gap: 8px; }
.timeline-header {
  display: flex; gap: 12px; padding: 8px 0; border-bottom: 2px solid #f0f0f0;
}
.participant-badge {
  display: flex; align-items: center; gap: 6px;
  padding: 4px 12px; border-radius: 20px; border: 2px solid;
  font-size: 13px; font-weight: 600;
}
.participant-icon { font-size: 16px; }
.timeline-body { display: flex; flex-direction: column; gap: 4px; }
.timeline-round { border-left: 3px solid #e0e0e6; padding-left: 12px; margin-bottom: 8px; }
.round-label { margin-bottom: 6px; }
.timeline-event {
  display: flex; flex-direction: column; gap: 2px;
  margin-bottom: 6px; padding: 6px 10px;
  border-radius: 6px; background: #fafafa; border: 1px solid #f0f0f0;
}
.event-cmd { border-left: 3px solid #722ed1; }
.event-resp { border-left: 3px solid #2080f0; }
.event-display { border-left: 3px solid #18a058; }
.event-arrow {
  display: flex; align-items: center; gap: 8px;
  font-size: 12px; font-weight: 600;
}
.event-arrow-sym { color: #aaa; }
.event-content { margin-top: 2px; }
.event-data {
  font-size: 11px; font-family: monospace; background: #f5f5f5;
  padding: 4px 8px; border-radius: 4px; margin: 0;
  max-height: 100px; overflow: auto; white-space: pre-wrap; word-break: break-all;
}
.event-debug, .event-stderr {
  display: flex; gap: 4px; font-size: 11px; margin-top: 3px;
  padding: 2px 6px; border-radius: 3px; background: #fffbe6;
}
.event-stderr { background: #fff1f0; }
.debug-label { font-weight: 600; flex-shrink: 0; }
.debug-text { color: #666; font-family: monospace; }
.round-display {
  padding: 6px 10px; border-radius: 6px; background: #f6ffed;
  border: 1px dashed #b7eb8f; margin-top: 4px;
}
.display-label { font-size: 11px; font-weight: 600; color: #52c41a; display: block; margin-bottom: 4px; }
.timeline-result { margin-top: 12px; }
.result-content { display: flex; align-items: center; gap: 12px; }
.result-emoji { font-size: 28px; }
.result-title { font-weight: 700; font-size: 15px; margin-bottom: 6px; }
.result-scores { display: flex; gap: 8px; flex-wrap: wrap; }
.score-chip {
  padding: 2px 10px; border-radius: 12px;
  font-size: 13px; font-weight: 600;
}
.timeline-controls {
  display: flex; align-items: center; gap: 8px;
  padding-top: 8px; border-top: 1px solid #f0f0f0;
}

/* Transitions */
.round-appear-enter-active { transition: all 0.35s ease; }
.round-appear-enter-from { opacity: 0; transform: translateY(-8px); }
.event-appear-enter-active { transition: all 0.25s ease; }
.event-appear-enter-from { opacity: 0; transform: translateX(-6px); }
</style>
