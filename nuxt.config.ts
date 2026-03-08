// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false, // SPA 模式

  future: { compatibilityVersion: 4 },

  modules: [
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@nuxt/eslint',
  ],

  css: [
    'katex/dist/katex.min.css',
  ],

  app: {
    head: {
      title: 'LevOJ',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
    },
  },

  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || '/api',
    },
  },

  // 开发模式：将 /api/* 代理到后端，与生产 Nginx 行为一致
  vite: {
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          rewrite: (path: string) => path.replace(/^\/api/, ''),
          changeOrigin: true,
        },
      },
    },
  },

  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
})
