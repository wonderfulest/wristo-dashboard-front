import type { ActivationTimelineItem } from '@/api/activationDetail'
export function activationDetailRoute(email: string): { path: string; query: { email: string } }
export function activationTime(value: string | null): string
export function activationSourceLabel(source: string): string
export function activationLocation(item: ActivationTimelineItem): { place: string; label: string }

export function activationAssetUrl(value: string | null | undefined): string
