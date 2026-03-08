<template>
  <NTag :type="color as any" :bordered="false">
    {{ label }}
  </NTag>
</template>

<script setup lang="ts">
import { STATUS_LABEL, STATUS_COLOR } from '~/types'

const props = defineProps<{
  status: number
}>()

const label = computed(() => STATUS_LABEL[props.status] ?? '未知')
const color = computed(() => STATUS_COLOR[props.status] ?? 'default')
</script>
