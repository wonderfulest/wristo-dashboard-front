export type GiftGrantMethod = 'APP_ID' | 'ACTIVATION_CODE'

export function validateGiftTarget(
  targetType: 'APP' | 'BUNDLE',
  grantMethod: GiftGrantMethod,
  appId?: number | null,
  bundleId?: number | null,
  activationCode?: string | null,
): string | null

export function buildGiftTargetPayload(
  targetType: 'APP' | 'BUNDLE',
  grantMethod: GiftGrantMethod,
  appId?: number | null,
  bundleId?: number | null,
  activationCode?: string | null,
): {
  appId: number | null | undefined
  bundleId: number | null | undefined
  activationCode: string | null
}
