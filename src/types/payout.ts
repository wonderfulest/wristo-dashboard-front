import type { UserBase } from './user'

export interface PayoutVO {
  id: number
  userId: number
  totalIncomeToDate: number
  currentBalance: number
  nextPayoutAmount: number
  nextPayDay: string
  currencyCode: string
  paddlePayoutId: string | null
  payoutMethod: string
  payoutAccount: string
  payoutStatus: string
  payoutStatusDesc: string
  createdAt: string
  updatedAt: string
  version: number
  user: UserBase | null
}
