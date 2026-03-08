<template>
  <NTag :bordered="false" :style="tagStyle">
    {{ label }}
  </NTag>
</template>

<script setup lang="ts">
import { STATUS_LABEL } from '~/types'

const props = defineProps<{
  status: number
}>()

const label = computed(() => STATUS_LABEL[props.status] ?? '未知')

const statusColorMap: Record<number, { bg: string; text: string }> = {
  0: { bg: '#e8f7ef', text: '#18a058' }, // AC
  1: { bg: '#fdecee', text: '#d03050' }, // WA
  2: { bg: '#fff3e0', text: '#f0a020' }, // TLE
  3: { bg: '#fff7e6', text: '#d48806' }, // MLE
  4: { bg: '#f1f5f9', text: '#64748b' }, // CE
  5: { bg: '#fef2f2', text: '#dc2626' },
  6: { bg: '#fef2f2', text: '#dc2626' },
  7: { bg: '#fff7ed', text: '#ea580c' },
  8: { bg: '#fef2f2', text: '#b91c1c' },
  9: { bg: '#f8fafc', text: '#64748b' },
  10: { bg: '#eff6ff', text: '#2563eb' },
  11: { bg: '#eef2ff', text: '#4f46e5' },
  12: { bg: '#fff7ed', text: '#ea580c' },
  13: { bg: '#fffbeb', text: '#b45309' },
}

const tagStyle = computed(() => {
  const color = statusColorMap[props.status] ?? { bg: '#f8fafc', text: '#475569' }
  return {
    background: color.bg,
    color: color.text,
    fontWeight: 600,
  }
})
</script>
