export function calculateGiftCommissionUsd(
  amountCny?: number | null,
  exchangeRate?: number | null,
): number | null

export function formatGiftPayoutStatus(record: {
  commissionEnabled?: boolean
  inPayout: number | null
}): 'No commission' | 'Yes' | 'No'

export function validateGiftPaymentMethod(
  commissionEnabled: boolean,
  paymentMethod?: string | null,
): string | null
