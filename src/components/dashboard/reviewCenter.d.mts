export type ReviewKey = 'designs' | 'posts' | 'comments' | 'reports' | 'social'
export interface ReviewCount { count: number | null; error: boolean }
export const reviewCategories: readonly { key: ReviewKey; label: string; note: string; path: string }[]
export function requireCount(response: unknown, key: string): number
export function loadReviewCounts(loaders: Record<ReviewKey, () => Promise<number>>): Promise<Record<ReviewKey, ReviewCount>>
