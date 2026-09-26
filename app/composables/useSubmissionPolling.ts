import { onScopeDispose, ref } from 'vue'

interface StatusResponse<T> {
  data?: { status: T }
  status?: T
}

export function useSubmissionPolling<T>(
  fetchStatus: (id: number) => Promise<StatusResponse<T>>,
  onStatus: (status: T) => void,
  isFinalStatus: (status: T) => boolean,
) {
  const polling = ref(false)
  let timer: ReturnType<typeof setTimeout> | null = null
  let generation = 0

  function stop() {
    generation++
    if (timer) clearTimeout(timer)
    timer = null
    polling.value = false
  }

  function start(id: number, initialStatus?: T) {
    stop()
    if (initialStatus !== undefined && isFinalStatus(initialStatus)) return
    polling.value = true
    const runId = generation
    let failures = 0

    const schedule = (delay: number) => {
      timer = setTimeout(() => void poll(), delay)
    }

    const poll = async () => {
      try {
        const response = await fetchStatus(id)
        if (runId !== generation) return
        const status = response.data?.status ?? response.status
        if (status === undefined) throw new Error('Submission status missing')
        onStatus(status)
        if (isFinalStatus(status)) {
          polling.value = false
          timer = null
          return
        }
        failures = 0
        schedule(2000)
      }
      catch {
        if (runId !== generation) return
        failures++
        schedule(Math.min(2000 * 2 ** failures, 10000))
      }
    }

    schedule(2000)
  }

  onScopeDispose(stop)
  return { polling, start, stop }
}
