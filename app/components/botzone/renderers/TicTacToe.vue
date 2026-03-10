<template>
  <div class="ttt-wrapper">
    <div class="ttt-board">
      <div
        v-for="(cell, i) in board"
        :key="i"
        class="ttt-cell"
        :class="`cell-${cell}`"
      >
        <span v-if="cell === 1" class="mark x">✕</span>
        <span v-else-if="cell === 2" class="mark o">○</span>
      </div>
    </div>
    <div class="ttt-legend">
      <NTag size="small" :bordered="false" type="primary">✕ 玩家 0</NTag>
      <NTag size="small" :bordered="false" type="error">○ 玩家 1</NTag>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  judgerDisplay: unknown
}>()

const board = computed<number[]>(() => {
  const d = props.judgerDisplay as any
  if (Array.isArray(d?.board) && d.board.length === 9) return d.board
  return Array(9).fill(0)
})
</script>

<style scoped>
.ttt-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 8px;
}
.ttt-board {
  display: grid;
  grid-template-columns: repeat(3, 72px);
  grid-template-rows: repeat(3, 72px);
  gap: 4px;
}
.ttt-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--n-color-embedded, #f5f5f5);
  border-radius: 8px;
  font-size: 32px;
  transition: background 0.2s;
}
.mark { line-height: 1; }
.mark.x { color: #2080f0; font-weight: 700; }
.mark.o { color: #d03050; font-weight: 700; }
.ttt-legend {
  display: flex;
  gap: 12px;
}
</style>
