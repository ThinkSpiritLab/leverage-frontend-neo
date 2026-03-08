<template>
  <NConfigProvider :theme="theme" style="height: 100%">
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
html,
body {
  height: 100%;
  margin: 0;
  padding: 0;
}

body {
  background-color: v-bind('isDark ? "#101014" : "#f5f5f5"');
  transition: background-color 0.3s;
}

/* 让 Nuxt 根容器也撑满 */
#__nuxt {
  height: 100%;
}
</style>
