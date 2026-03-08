<template>
  <NConfigProvider :theme="theme">
    <NuxtLoadingIndicator color="#18a058" />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </NConfigProvider>
</template>

<script setup lang="ts">
import { darkTheme, lightTheme } from 'naive-ui'

const { isDark } = useTheme()
const theme = computed(() => isDark.value ? darkTheme : lightTheme)
</script>

<style>
body {
  background-color: v-bind('isDark ? "#101014" : "#f5f5f5"');
  transition: background-color 0.3s;
}
</style>
