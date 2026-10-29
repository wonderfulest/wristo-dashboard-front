import instance from '@/config/axios'
import type { ApiResponse } from '@/types/api'
export interface RuleDocument { id: string; version: string; sha256: string; source: string }
export interface RuleState { revision: number; published: RuleDocument; draftSource: string | null }
export interface RuleHistory { revision: number; action: string; source: string; actor: string; note: string; restoredFrom: number | null; createdAt: string }
export interface RuleContent {
  id: string; version: string; defaults: Record<string, number>;
  policy: string; naming: string; geometry: string; requirementsMarkdown: string; capabilityPolicy: string;
  [key: string]: unknown
}
const base = '/admin/watchface-rules'
export const getRules = (): Promise<ApiResponse<RuleState>> => instance.get(base)
export const getRuleHistory = (page: number): Promise<ApiResponse<RuleHistory[]>> => instance.get(`${base}/history`, { params: { page } })
export const saveRuleDraft = (expectedRevision: number, source: string, note: string): Promise<ApiResponse<RuleState>> => instance.put(`${base}/draft`, { expectedRevision, source, note })
export const publishRules = (expectedRevision: number, note: string): Promise<ApiResponse<RuleState>> => instance.post(`${base}/publish`, { expectedRevision, note })
export const rollbackRules = (expectedRevision: number, targetRevision: number, note: string): Promise<ApiResponse<RuleState>> => instance.post(`${base}/rollback`, { expectedRevision, targetRevision, note })
