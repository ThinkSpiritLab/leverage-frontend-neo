export interface BotzoneRound {
  round: number
  judgerDisplay: unknown
  botOutputs: Record<string, unknown>
  /** Per-participant debug info from UserJudgeStrategy / BotOutputParser */
  debug?: Record<string, string | null>
}

export interface BotzoneGameLog {
  gameId: string
  rounds: BotzoneRound[]
  finalResult: Record<string, number>
  verdict: string
}
