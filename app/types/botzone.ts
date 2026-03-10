export interface BotzoneRound {
  round: number
  judgerDisplay: unknown
  botOutputs: Record<string, unknown>
}

export interface BotzoneGameLog {
  gameId: string
  rounds: BotzoneRound[]
  finalResult: Record<string, number>
  verdict: string
}
