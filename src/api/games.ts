import api from '@/config/axios'
import type { ApiResponse } from '@/types/api'
export interface GameConfig {
  key: string; garminAppId: string | null; name: string; nameZh: string; description: string; descriptionZh: string; summary: string; summaryZh: string
  instructions: string; instructionsZh: string; logoUrl: string; coverUrl: string; heroUrl: string | null; shareUrl: string | null; shareUrls: string[]; downloadUrl: string
  websiteVisible: boolean; enabled: boolean; sortOrder: number; modes: string[]; metric: string; rulesVersion: number
}
export const getGameConfigs = (): Promise<ApiResponse<GameConfig[]>> => api.get('/admin/games')
export const setGameWebsiteVisibility = (key: string, websiteVisible: boolean): Promise<ApiResponse<GameConfig>> =>
  api.put(`/admin/games/${encodeURIComponent(key)}/website-visibility`, { websiteVisible })
export const saveGameConfig = (game: GameConfig): Promise<ApiResponse<GameConfig>> => {
  const { name, nameZh, summary, summaryZh, description, descriptionZh, instructions, instructionsZh,
    logoUrl, coverUrl, heroUrl, shareUrl, downloadUrl, enabled, sortOrder, shareUrls } = game
  // Send only Edit DTO fields. Empty galleries also work with the legacy single-image API.
  return api.put(`/admin/games/${game.key}`, {
    name, nameZh, summary, summaryZh, description, descriptionZh, instructions, instructionsZh,
    logoUrl, coverUrl, heroUrl, shareUrl: shareUrls ? (shareUrls[0] || '') : shareUrl,
    downloadUrl, enabled, sortOrder,
    ...(shareUrls?.length ? { shareUrls } : {}),
  })
}

export interface GameMetrics {
  activePlayers: number; endDayActive: number; starts: number; completions: number
  newPlayers: number; totalPlayers: number; uploadedRuns: number; uploadPlayers: number
}
export interface GameDaily {
  date: string; activePlayers: number; starts: number; completions: number
  newPlayers: number; uploadedRuns: number; uploadPlayers: number
}
export interface GameOverviewRow {
  key: string; name: string; nameZh: string; garminAppId: string | null; enabled: boolean; metrics: GameMetrics
}
export type GameTrendDaily = Pick<GameDaily, 'date' | 'activePlayers' | 'starts' | 'completions'>
export interface GameOverview { timezone: string; from: string; to: string; games: GameOverviewRow[]; daily?: GameTrendDaily[] }
export interface GameReport { timezone: string; from: string; to: string; summary: GameMetrics; daily: GameDaily[] }
export interface GameBoard {
  gameKey: string; mode: string; metric: string; participants: number
  entries: { rank: number; player: string; score: number }[]
}
export interface GameRun { runId: string; player: string; mode: string; startedAt: number | null; completedAt: number | null; score: number | null }
export interface GameRuns { total: number; page: number; size: number; items: GameRun[] }
export const getGameOverview = (from: string, to: string): Promise<ApiResponse<GameOverview>> => api.get('/admin/games/analytics', { params: { from, to } })
export const getGameReport = (key: string, from: string, to: string): Promise<ApiResponse<GameReport>> => api.get(`/admin/games/${key}/analytics`, { params: { from, to } })
export const getGameBoard = (key: string, mode: string): Promise<ApiResponse<GameBoard>> => api.get(`/admin/games/${key}/leaderboard`, { params: { mode, limit: 50 } })
export const getGameRuns = (key: string, from: string, to: string, page: number): Promise<ApiResponse<GameRuns>> => api.get(`/admin/games/${key}/runs`, { params: { from, to, page, size: 20 } })
