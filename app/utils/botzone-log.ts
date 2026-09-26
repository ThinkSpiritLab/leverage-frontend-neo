import type { BotzoneGameLog, BotzoneRound } from '~/types/botzone'

const record = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

/** Accept Match.result JSON text/object (or providerMeta.gameLog); return null when no replay exists. */
export function normalizeGameLog(raw: unknown, gameId: string | number = ''): BotzoneGameLog | null {
  let value: unknown = raw
  if (typeof value === 'string') {
    try { value = JSON.parse(value) }
    catch { return null }
  }
  if (!record(value)) return null
  // Older provider poll responses keep the rounds under providerMeta.gameLog.
  const nested = record(value.providerMeta) && record(value.providerMeta.gameLog)
    ? value.providerMeta.gameLog : value
  if (!Array.isArray(nested.rounds) || !nested.rounds.length || !nested.rounds.every(record)) return null

  const rounds: BotzoneRound[] = nested.rounds.map((rd: Record<string, unknown>, index: number) => {
    const judgeCmd = record(rd.judgeCmd) ? rd.judgeCmd : null
    const rawOutputs = record(rd.botResponses) ? rd.botResponses : record(rd.botOutputs) ? rd.botOutputs : {}
    const outputs = { ...rawOutputs }
    // Keep the old Playground recovery in one place; retain raw botResponses below.
    if ('move' in outputs) {
      const players = Object.keys(outputs).filter(key => /^\d+$/.test(key))
      const missing = Array.from({ length: players.length + 1 }, (_, i) => String(i)).find(key => !players.includes(key))
      if (missing !== undefined) outputs[missing] = outputs.move
    }
    return {
      ...rd,
      round: typeof rd.round === 'number' && Number.isFinite(rd.round) ? rd.round : index + 1,
      judgerDisplay: rd.display ?? judgeCmd?.display ?? rd.judgerDisplay ?? null,
      botOutputs: outputs,
      // Retain both aliases and all raw keys: legacy renderers use judgeCmd.display/botResponses.
      botResponses: record(rd.botResponses) ? rd.botResponses : outputs,
    }
  })
  const rawScores = record(nested.finalResult) ? nested.finalResult : record(value.finalResult) ? value.finalResult : {}
  const finalResult: Record<string, number> = {}
  for (const [player, score] of Object.entries(rawScores)) {
    if (typeof score === 'number' && Number.isFinite(score)) finalResult[player] = score
  }
  return {
    ...value,
    ...nested,
    gameId: String(nested.gameId ?? value.gameId ?? gameId),
    rounds,
    finalResult,
    verdict: typeof nested.verdict === 'string' ? nested.verdict : typeof value.verdict === 'string' ? value.verdict : '',
  }
}
