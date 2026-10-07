import type { BatchJob, BatchRequest, Candidate, Quote, Thresholds } from '../../api/tagGeneration'
export function validThresholds(value: { minDownloads?: number; minPurchases?: number }): boolean
export function createBatchRequest(apps: Pick<Candidate, 'appId'>[], thresholds: Thresholds, quote: Quote, requestId: string): BatchRequest
export function batchStatus(status: string): string
export function batchFeedback(job: Pick<BatchJob, 'status' | 'providerBatchId'>): string
