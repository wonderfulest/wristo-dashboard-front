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

const GIFT_PAYMENT_METHODS = new Set(['alipay', 'wechat', 'other'])

export function validateGiftPaymentMethod(commissionEnabled, paymentMethod) {
  if (!commissionEnabled) return null
  if (!paymentMethod) return '请选择支付方式'
  return GIFT_PAYMENT_METHODS.has(paymentMethod) ? null : '请选择有效的支付方式'
}
