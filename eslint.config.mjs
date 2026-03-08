// @ts-check
import withNuxt from './node_modules/.cache/nuxt/.nuxt/eslint.config.mjs'

export default withNuxt(
  {
    rules: {
      // API 层尚未完善类型定义，暂时降级为 warn，待后续补全
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
)
