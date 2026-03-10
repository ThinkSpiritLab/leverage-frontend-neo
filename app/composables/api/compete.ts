import { useApi } from '~/composables/useApi'

export function useCompeteApi() {
  const api = useApi()
  return {
    listGames: (params?: { page?: number; perPage?: number }) =>
      api.get<{ items: any[]; total: number }>('/compete/games', { params }),
    getGame: (id: number) => api.get<any>(`/compete/games/${id}`),
    updateGame: (id: number, dto: Record<string, any>) => api.patch<any>(`/compete/games/${id}`, dto),
    runPlayground: (gameId: number, dto: { code: string; language: string; opponentGamerId: number }) =>
      api.post<any>(`/compete/games/${gameId}/playground`, dto),
    deleteGame: (id: number) => api.delete<any>(`/compete/games/${id}`),
    createGame: (dto: Record<string, any>) => api.post<any>('/compete/games', dto),
    getLeaderboard: (gameId: number, board: 'inner' | 'outer' = 'inner') =>
      api.get<any[]>(`/compete/games/${gameId}/leaderboard`, { params: { board } }),
    listGamers: (params: { gameId?: number; page?: number; perPage?: number }) =>
      api.get<{ items: any[]; total: number }>('/compete/gamers', { params }),
    createGamer: (dto: {
      gameId: number
      title: string
      type?: 'code' | 'webhook'
      code?: string
      language?: string
      opensource?: boolean
      webhookUrl?: string
      webhookSecret?: string
    }) => api.post<any>('/compete/gamers', dto),
    updateGamer: (id: number, dto: {
      title?: string
      type?: 'code' | 'webhook'
      code?: string
      language?: string
      opensource?: boolean
      webhookUrl?: string
      webhookSecret?: string
    }) => api.patch<any>(`/compete/gamers/${id}`, dto),
    triggerAutoMatch: (gameId: number) =>
      api.post<any>(`/compete/games/${gameId}/trigger-auto-match`),
    botTurnPoll: (gamerId: number) =>
      api.get<any>('/compete/bot-turn', { params: { gamerId } }),
    botRespond: (turnToken: string, response: string) =>
      api.post<any>('/compete/bot-respond', { turnToken, response }),
    getGamer: (id: number) => api.get<any>(`/compete/gamers/${id}`),
    getEloHistory: (id: number) => api.get<any[]>(`/compete/gamers/${id}/elo-history`),
    deleteGamer: (id: number) => api.delete<any>(`/compete/gamers/${id}`),
    listMatches: (params: { gameId?: number; page?: number; perPage?: number }) =>
      api.get<{ items: any[]; total: number }>('/compete/matches', { params }),
    getMatch: (id: number) => api.get<any>(`/compete/matches/${id}`),
    launchMatch: (gameId: number, gamerIds: number[]) =>
      api.post<any>('/compete/matches', { gameId, gamerIds }),
    // ─── Rooms ───────────────────────────────────────────────────────────────
    listRooms: (params?: { gameId?: number }) => api.get<any[]>('/compete/rooms', { params }),
    getRoom: (id: number) => api.get<any>(`/compete/rooms/${id}`),
    createRoom: (dto: { gameId: number }) => api.post<any>('/compete/rooms', dto),
    openRoom: (id: number) => api.put<any>(`/compete/rooms/${id}/open`),
    closeRoom: (id: number) => api.put<any>(`/compete/rooms/${id}/close`),
    submitGamerToRoom: (roomId: number, gamerId: number) =>
      api.post<any>(`/compete/rooms/${roomId}/submit`, { gamerId }),
    startRoom: (id: number) => api.post<any>(`/compete/rooms/${id}/start`),
  }
}
