export function calculateGiftCommissionUsd(amountCny, exchangeRate) {
  const amount = Number(amountCny)
  const rate = Number(exchangeRate)
  if (!Number.isFinite(amount) || !Number.isFinite(rate) || amount <= 0 || rate <= 0) {
    return null
  }
  return Math.round((amount / rate) * 100) / 100
}

export function formatGiftPayoutStatus(record) {
  if (!record?.commissionEnabled) return 'No commission'
  return record.inPayout === 1 ? 'Yes' : 'No'
}
