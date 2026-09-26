import { onBeforeUnmount } from 'vue'
import { useCompeteApi } from '~/composables/api/compete'
import type { Match } from '~/types/compete'

/** Independent test runs, bounded recovery, and no overlapping HTTP polls. */
export function useMatchPolling() {
  const api = useCompeteApi()
  const stops = new Set<() => void>()
  function start(id: number, onUpdate: (match: Match) => void, onDone: (match: Match) => void, onError: (message: string) => void) {
    let timer: ReturnType<typeof setTimeout> | undefined
    let active = true
    let failures = 0
    const started = Date.now()
    const stop = () => { active = false; if (timer) clearTimeout(timer); stops.delete(stop) }
    stops.add(stop)
    async function tick() {
      if (!active) return
      try {
        const { data } = await api.getMatch(id)
        if (!active) return
        failures = 0
        onUpdate(data)
        if (data.status === 2 || data.status === 3) { stop(); onDone(data); return }
      }
      catch (error: unknown) {
        if (!active) return
        failures++
        const status = (error as { response?: { status?: number } })?.response?.status
        if ([401, 403, 404].includes(status ?? 0)) { stop(); onError('无法读取对局，请检查登录状态或访问权限'); return }
      }
      // UI wait budget, not a judge execution limit. The match remains inspectable.
      if (Date.now() - started > 120_000) { stop(); onError('等待时间较长，可打开对局详情查看后续结果'); return }
      timer = setTimeout(() => { void tick() }, Math.min(1000 * 2 ** failures, 8000))
    }
    void tick()
    return stop
  }
  onBeforeUnmount(() => { for (const stop of stops) stop() })
  return { start }
}
