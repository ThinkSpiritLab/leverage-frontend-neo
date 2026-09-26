// Match.result is JSON text from the backend; the normalized view is sent to sandboxed renderers.
export interface BotzoneRound {
  round: number
  judgerDisplay: unknown
  botOutputs: Record<string, unknown>
  /** Original judge response, including content/display/verdict; not just per-player commands. */
  judgeCmd?: unknown
  display?: unknown
  botResponses?: Record<string, unknown>
  /** Per-participant debug info from UserJudgeStrategy / BotOutputParser */
  debug?: Record<string, string | null>
  /** Other producer-specific log fields are retained for existing renderers. */
  [key: string]: unknown
}

export interface BotzoneGameLog {
  gameId: string
  rounds: BotzoneRound[]
  finalResult: Record<string, number>
  verdict: string
  /** Other producer-specific result fields (e.g. roundCount) are retained. */
  [key: string]: unknown
}
