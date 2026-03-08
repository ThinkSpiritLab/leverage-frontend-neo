import { useApi } from '~/composables/useApi'

export function useCompeteApi() {
  const api = useApi()
  return {
    listGames: (params?: { page?: number; perPage?: number }) =>
      api.get<{ items: any[]; total: number }>('/compete/games', { params }),
    getGame: (id: number) => api.get<any>(`/compete/games/${id}`),
    updateGame: (id: number, dto: Record<string, any>) => api.patch<any>(`/compete/games/${id}`, dto),
    getLeaderboard: (gameId: number) =>
      api.get<any[]>(`/compete/games/${gameId}/leaderboard`),
    listGamers: (params: { gameId?: number; page?: number; perPage?: number }) =>
      api.get<{ items: any[]; total: number }>('/compete/gamers', { params }),
    createGamer: (dto: { gameId: number; name: string; code: string; language: string }) =>
      api.post<any>('/compete/gamers', dto),
    updateGamer: (id: number, dto: { name?: string; code?: string; language?: string }) =>
      api.patch<any>(`/compete/gamers/${id}`, dto),
    getGamer: (id: number) => api.get<any>(`/compete/gamers/${id}`),
    listMatches: (params: { gameId?: number; page?: number; perPage?: number }) =>
      api.get<{ items: any[]; total: number }>('/compete/matches', { params }),
    getMatch: (id: number) => api.get<any>(`/compete/matches/${id}`),
    launchMatch: (gameId: number, gamerIds: number[]) =>
      api.post<any>('/compete/matches', { gameId, gamerIds }),
    // ─── Rooms ───────────────────────────────────────────────────────────────
    listRooms: () => api.get<any[]>('/compete/rooms'),
    getRoom: (id: number) => api.get<any>(`/compete/rooms/${id}`),
    createRoom: (dto: { gameId: number }) => api.post<any>('/compete/rooms', dto),
    openRoom: (id: number) => api.put<any>(`/compete/rooms/${id}/open`),
    closeRoom: (id: number) => api.put<any>(`/compete/rooms/${id}/close`),
    submitGamerToRoom: (roomId: number, gamerId: number) =>
      api.post<any>(`/compete/rooms/${roomId}/submit`, { gamerId }),
    startRoom: (id: number) => api.post<any>(`/compete/rooms/${id}/start`),
  }
}
