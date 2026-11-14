import type { OperationsQuery } from '@/api/pointsOperations'
export type OperationsMode = 'ledger' | 'redemptions'
export const shanghaiDate = (date: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
export function operationsRange(days = 30, now = new Date()): [string, string] {
  return [shanghaiDate(new Date(now.getTime() - (days - 1) * 86400000)), shanghaiDate(now)]
}
export function parseOperationsQuery(input: Record<string, unknown>, mode: OperationsMode, now = new Date()): OperationsQuery {
  const text = (key: string) => {
    const value = input[key]
    if (value == null || value === '') return ''
    if (typeof value !== 'string' && typeof value !== 'number') throw new Error('筛选参数无效，请重置后查询。')
    return String(value).trim()
  }
  const [defaultFrom, defaultTo] = operationsRange(30, now)
  const from = text('from') || defaultFrom, to = text('to') || defaultTo
  const validDay = (day: string) => /^\d{4}-\d{2}-\d{2}$/.test(day) && Number.isFinite(Date.parse(day)) && new Date(day).toISOString().slice(0, 10) === day
  if (!validDay(from) || !validDay(to) || from < '1970-01-01' || from > to || to > shanghaiDate(now) || (Date.parse(to) - Date.parse(from)) / 86400000 >= 366) throw new Error('请选择截至今天、最多 366 天的有效日期范围。')
  const page = Number(text('page') || 1), pageSize = Number(text('pageSize') || 20)
  if (!Number.isInteger(page) || page < 1 || page > 10000 || ![20, 50, 100].includes(pageSize)) throw new Error('分页参数无效，请重置后查询。')
  const query: OperationsQuery = { from, to, page, pageSize }
  const userId = text('userId')
  if (userId && (!/^[1-9]\d{0,18}$/.test(userId) || BigInt(userId) > 9223372036854775807n)) throw new Error('用户 ID 须为有效的正整数。')
  if (userId) query.userId = userId
  const keyword = text('keyword')
  if (keyword.length > 100) throw new Error('关键词最多 100 字。')
  if (keyword) query.keyword = keyword
  if (mode === 'ledger') {
    const asset = text('asset'), direction = text('direction'), type = text('type'), eventKey = text('eventKey')
    if (asset && !['REWARD', 'AI'].includes(asset)) throw new Error('请选择奖励积分或 AI 点数。')
    if (direction && !['IN', 'OUT', 'ZERO'].includes(direction)) throw new Error('收支方向无效。')
    if (type && !/^[A-Za-z0-9_:-]{1,64}$/.test(type)) throw new Error('流水类型无效。')
    if (eventKey.length > 191) throw new Error('业务事件编号最多 191 字。')
    if (asset) query.asset = asset as OperationsQuery['asset']
    if (direction) query.direction = direction as OperationsQuery['direction']
    if (type) query.type = type
    if (eventKey) query.eventKey = eventKey
  } else {
    const source = text('source'), kind = text('kind'), id = text('id')
    if (source && !['MINIAPP', 'CN_BRIDGE'].includes(source)) throw new Error('兑换来源无效。')
    if (kind && !['WATCHFACE', 'RESOURCE'].includes(kind)) throw new Error('兑换类型无效。')
    if (id.length > 35) throw new Error('兑换编号过长。')
    if (source) query.source = source as OperationsQuery['source']
    if (kind) query.kind = kind as OperationsQuery['kind']
    if (id) query.id = id
  }
  return query
}
export function operationsRouteQuery(query: OperationsQuery, mode: OperationsMode): Record<string, string> {
  const values: Record<string, string> = mode === 'redemptions' ? { tab: 'records' } : {}
  for (const [key, value] of Object.entries(query)) if (value != null && value !== '') values[key] = String(value)
  return values
}
export function redemptionLedgerQuery(row: { userId: string; eventKey: string; createdAt: string }): Record<string, string> {
  const date = shanghaiDate(new Date(row.createdAt))
  return { userId: row.userId, asset: 'REWARD', eventKey: row.eventKey, from: date, to: date }
}
