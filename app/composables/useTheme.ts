export const useTheme = () => {
  const isDark = useState('theme:dark', () => false)

  // 初始化：读取 localStorage，fallback 到系统主题
  if (import.meta.client) {
    const saved = localStorage.getItem('theme')
    if (saved === 'dark') {
      isDark.value = true
    }
    else if (saved === 'light') {
      isDark.value = false
    }
    else {
      isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
    }
  }

  const toggle = () => {
    isDark.value = !isDark.value
    if (import.meta.client) {
      localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
    }
  }

  return { isDark, toggle }
}
