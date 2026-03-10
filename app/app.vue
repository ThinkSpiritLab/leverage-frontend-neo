<template>
  <NConfigProvider :theme="theme" :hljs="hljs" style="height: 100%">
    <NuxtLoadingIndicator color="#18a058" />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </NConfigProvider>
</template>

<script setup lang="ts">
import { darkTheme, lightTheme } from 'naive-ui'
import hljs from 'highlight.js/lib/core'
import python from 'highlight.js/lib/languages/python'
import cpp from 'highlight.js/lib/languages/cpp'
import java from 'highlight.js/lib/languages/java'
import javascript from 'highlight.js/lib/languages/javascript'
import bash from 'highlight.js/lib/languages/bash'
import json from 'highlight.js/lib/languages/json'
import plaintext from 'highlight.js/lib/languages/plaintext'

hljs.registerLanguage('python', python)
hljs.registerLanguage('cpp', cpp)
hljs.registerLanguage('java', java)
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('bash', bash)
hljs.registerLanguage('json', json)
hljs.registerLanguage('text', plaintext)
hljs.registerLanguage('plaintext', plaintext)

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
