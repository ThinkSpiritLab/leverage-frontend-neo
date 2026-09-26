/** Runtime names supported by the pinned botzone-neo adapter; distinct from OJ IDs. */
export const BOTZONE_LANGUAGE_OPTIONS = [
  { label: 'Python 3', value: 'python' },
  { label: 'C++17', value: 'cpp' },
  { label: 'JavaScript', value: 'javascript' },
  { label: 'TypeScript', value: 'typescript' },
]

/** Read legacy stored aliases without changing an unknown language's meaning. */
export function botzoneLanguage(value: string | number | null | undefined): string {
  const aliases: Record<string, string> = { '1': 'cpp', '9': 'python', '10': 'javascript', '11': 'typescript', cpp17: 'cpp', python3: 'python' }
  return aliases[String(value)] ?? (value == null || value === '' ? 'python' : String(value))
}

export function botzoneEditorLanguage(value: string): string {
  const language = botzoneLanguage(value)
  if (language === 'typescript') return 'typescript'
  if (language === 'cpp' || language === 'python' || language === 'javascript') return language
  return 'text'
}
