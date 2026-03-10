<template>
  <NCard title="Botzone 对局回放">
    <!-- gameLog 缺失时的占位 -->
    <template v-if="!gameLog">
      <NEmpty description="暂无对局数据" />
    </template>

    <template v-else>
      <!-- 对局元信息 -->
      <NDescriptions :column="2" label-placement="left" bordered style="margin-bottom: 16px">
        <NDescriptionsItem label="Game ID">{{ gameLog.gameId }}</NDescriptionsItem>
        <NDescriptionsItem label="裁决">
          <NTag :type="verdictTagType(gameLog.verdict)" :bordered="false" size="small">
            {{ gameLog.verdict }}
          </NTag>
        </NDescriptionsItem>
        <NDescriptionsItem label="总回合数">{{ gameLog.rounds.length }}</NDescriptionsItem>
        <NDescriptionsItem label="当前回合">{{ currentRoundIndex + 1 }} / {{ gameLog.rounds.length }}</NDescriptionsItem>
      </NDescriptions>

      <!-- 最终得分（末局时始终显示） -->
      <NCard
        embedded
        size="small"
        title="最终得分"
        style="margin-bottom: 16px"
      >
        <NSpace>
          <NTag
            v-for="(score, player) in gameLog.finalResult"
            :key="player"
            size="medium"
            type="info"
            :bordered="false"
          >
            {{ player }}: {{ score }}
          </NTag>
        </NSpace>
      </NCard>

      <!-- 回合导航 -->
      <NSpace align="center" style="margin-bottom: 16px">
        <NButton
          :disabled="currentRoundIndex === 0"
          size="small"
          @click="prevRound"
        >
          ← 上一回合
        </NButton>
        <NText style="font-size: 14px; font-weight: 600">
          第 {{ currentRound.round }} 回合
        </NText>
        <NButton
          :disabled="currentRoundIndex === gameLog.rounds.length - 1"
          size="small"
          @click="nextRound"
        >
          下一回合 →
        </NButton>
        <NButton
          size="small"
          secondary
          @click="currentRoundIndex = 0"
        >
          ⏮ 首局
        </NButton>
        <NButton
          size="small"
          secondary
          @click="currentRoundIndex = gameLog.rounds.length - 1"
        >
          末局 ⏭
        </NButton>
      </NSpace>

      <!-- 裁判显示字段 -->
      <NCard embedded size="small" title="裁判输出 (judgerDisplay)" style="margin-bottom: 12px">
        <NCode
          :code="judgerDisplayStr"
          language="json"
          show-line-numbers
          style="font-size: 12px"
        />
      </NCard>

      <!-- 每位玩家的输出 -->
      <NCard embedded size="small" title="各玩家输出 (botOutputs)">
        <NEmpty v-if="botOutputKeys.length === 0" description="本回合无玩家输出" />
        <NCollapse v-else :default-expanded-names="botOutputKeys.slice(0, 2)">
          <NCollapseItem
            v-for="player in botOutputKeys"
            :key="player"
            :title="`玩家 ${player}`"
            :name="player"
          >
            <NCode
              :code="botOutputStr(player)"
              language="json"
              show-line-numbers
              style="font-size: 12px"
            />
          </NCollapseItem>
        </NCollapse>
      </NCard>

      <!-- Debug 信息（来自自定义裁判/Bot 的 debug 字段） -->
      <NCard v-if="hasDebugInfo" embedded size="small" style="margin-top:8px">
        <template #header>
          <NSpace align="center">
            <span style="font-size:13px;font-weight:600">💬 调试信息</span>
            <NTag size="small" :bordered="false" type="warning">debug</NTag>
          </NSpace>
        </template>
        <div v-for="(val, key) in currentRound.debug" :key="key" class="debug-line">
          <span class="debug-key">{{ key }}</span>
          <span class="debug-val">{{ val }}</span>
        </div>
      </NCard>

      <!-- 末局时额外高亮显示得分 -->
      <NAlert
        v-if="currentRoundIndex === gameLog.rounds.length - 1"
        type="info"
        title="末局 — 最终结果"
        style="margin-top: 16px"
      >
        <NSpace>
          <span v-for="(score, player) in gameLog.finalResult" :key="player">
            <NText strong>{{ player }}</NText>：{{ score }} 分
          </span>
        </NSpace>
      </NAlert>
    </template>
  </NCard>
</template>

<script setup lang="ts">
import type { BotzoneGameLog } from '~/types/botzone'

const props = defineProps<{
  gameLog?: BotzoneGameLog | null
}>()

const currentRoundIndex = ref(0)

const currentRound = computed(() => props.gameLog!.rounds[currentRoundIndex.value])

const judgerDisplayStr = computed(() => {
  try {
    return JSON.stringify(currentRound.value.judgerDisplay, null, 2)
  }
  catch {
    return String(currentRound.value.judgerDisplay)
  }
})

const botOutputKeys = computed(() =>
  Object.keys(currentRound.value?.botOutputs ?? {}),
)

const hasDebugInfo = computed(() => {
  const d = currentRound.value?.debug
  return d && Object.keys(d).some(k => d[k] !== null && d[k] !== '')
})

function botOutputStr(player: string): string {
  try {
    return JSON.stringify(currentRound.value.botOutputs[player], null, 2)
  }
  catch {
    return String(currentRound.value.botOutputs[player])
  }
}

function prevRound() {
  if (currentRoundIndex.value > 0) currentRoundIndex.value--
}

function nextRound() {
  if (props.gameLog && currentRoundIndex.value < props.gameLog.rounds.length - 1) {
    currentRoundIndex.value++
  }
}

function verdictTagType(verdict: string): 'success' | 'error' | 'warning' | 'info' | 'default' {
  const v = verdict?.toLowerCase() ?? ''
  if (v.includes('win') || v === 'accepted') return 'success'
  if (v.includes('lose') || v === 'lose' || v.includes('error')) return 'error'
  if (v.includes('draw')) return 'warning'
  return 'info'
}

// 切换 gameLog 时重置回合索引
watch(() => props.gameLog, () => {
  currentRoundIndex.value = 0
})
</script>

<style scoped>
.debug-line { display: flex; gap: 8px; font-size: 12px; padding: 3px 0; border-bottom: 1px solid #f0f0f0; }
.debug-line:last-child { border-bottom: none; }
.debug-key { color: #722ed1; font-weight: 600; font-family: monospace; min-width: 120px; flex-shrink: 0; }
.debug-val { color: #555; font-family: monospace; word-break: break-all; }
</style>
