import type { BusinessReferenceDetail } from '@/api/pointsReferences'

export function businessReferenceLedgerLink(current?: BusinessReferenceDetail) {
  if (!current || !['AI_CALL', 'REDEMPTION'].includes(current.kind)) return undefined
  const event = current.fields.find(field => field.key === (current.kind === 'AI_CALL' ? 'creditEventKey' : 'eventKey'))?.value
  const createdAt = current.fields.find(field => field.key === 'createdAt')?.value
  if (!event || !createdAt || !Number.isFinite(Date.parse(createdAt))) return undefined
  const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' })
  const day = formatter.format(new Date(createdAt))
  // The debit can precede the AI call across Beijing midnight; the event key still matches exactly.
  const from = current.kind === 'AI_CALL' ? formatter.format(new Date(Date.parse(createdAt) - 86400000)) : day
  return { path: '/ops/points-ledger', query: { userId: current.userId, asset: current.kind === 'AI_CALL' ? 'AI' : 'REWARD', eventKey: event, from, to: day } }
}
