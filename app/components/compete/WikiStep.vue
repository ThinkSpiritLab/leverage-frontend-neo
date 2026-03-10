<template>
  <div class="wiki-step" :class="{ 'step-active': active, 'step-done': done }">
    <div class="step-badge">
      <span v-if="done" class="badge-check">✓</span>
      <span v-else class="badge-num">{{ num }}</span>
    </div>
    <div class="step-content">
      <div class="step-title">{{ title }}</div>
      <div v-if="active" class="step-body">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ num: number; title: string; active?: boolean; done?: boolean }>()
</script>

<style scoped>
.wiki-step { display: flex; gap: 14px; padding: 10px 0; position: relative; }
.wiki-step:not(:last-child)::after {
  content: ''; position: absolute; left: 15px; top: 44px; bottom: 0;
  width: 2px; background: #e0e0e6;
}
.step-done.wiki-step::after { background: #18a058; }
.step-badge {
  width: 32px; height: 32px; border-radius: 50%; border: 2px solid #d0d0d8;
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 14px; flex-shrink: 0;
  background: #fff; z-index: 1; transition: all 0.2s;
}
.step-active .step-badge { border-color: #2080f0; color: #2080f0; background: #e8f4ff; }
.step-done .step-badge { border-color: #18a058; color: #fff; background: #18a058; }
.badge-check { font-size: 16px; }
.step-title {
  font-weight: 600; font-size: 14px; padding-top: 5px; cursor: pointer;
  color: #333;
}
.step-active .step-title { color: #2080f0; }
.step-done .step-title { color: #888; }
.step-body { margin-top: 10px; }
</style>
