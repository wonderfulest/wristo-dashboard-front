export function calculateGiftCommissionUsd(
  amountCny?: number | null,
  exchangeRate?: number | null,
): number | null

export function formatGiftPayoutStatus(record: {
  commissionEnabled?: boolean
  inPayout: number
}): 'No commission' | 'Yes' | 'No'
