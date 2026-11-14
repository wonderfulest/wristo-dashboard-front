import { configSnapshot } from './configSnapshot'
export interface ConfigChange { field: string; before: string; after: string }
const labels: Record<string, string> = {
  enabled: '启用', checkInEnabled: '签到启用', checkInCredits: '签到奖励', purchaseEnabled: '购买奖励启用', purchaseCredits: '购买奖励',
  downloadEnabled: '下载奖励启用', downloadCredits: '下载奖励', downloadDailyLimit: '下载每日上限', downloadsPerReward: '下载奖励门槛',
  creditsPerVisit: '有效访问奖励', minimumVisibleSeconds: '有效浏览秒数', userDailyCredits: '用户每日上限', globalDailyCredits: '全站每日上限',
  startsAt: '开始时间', endsAt: '结束时间', models: '模型', scenes: '场景', model: '模型名称', modelId: '默认模型', provider: '供应商', capability: '能力', creditCost: '消耗 AI 点数',
  WATCHFACE: '表盘生成', WATCHFACE_ADJUST: '表盘调整', BANNER: 'Banner', TAGS: '标签', DESCRIPTION: '描述', id: '编号',
}
function parse(value: unknown): unknown { if (typeof value !== 'string') return value; try { return JSON.parse(value) } catch { return value } }
function flatten(value: unknown, path = '', result: Record<string, unknown> = {}): Record<string, unknown> {
  if (value !== null && typeof value === 'object' && Object.keys(value).length) {
    for (const [key, item] of Object.entries(value)) flatten(item, path ? `${path}.${key}` : key, result)
  } else result[path || '配置'] = value
  return result
}
function display(value: unknown): string {
  if (value === undefined) return '未设置'
  if (value === null || value === '') return '空'
  if (typeof value === 'boolean') return value ? '开启' : '关闭'
  return typeof value === 'object' ? JSON.stringify(value) : String(value)
}
export function configChanges(before: unknown, after: unknown): ConfigChange[] {
  const oldFields = flatten(parse(before)), newFields = flatten(parse(after))
  return [...new Set([...Object.keys(oldFields), ...Object.keys(newFields)])]
    .filter(key => configSnapshot(oldFields[key]) !== configSnapshot(newFields[key]))
    .map(key => ({ field: key.split('.').map(part => labels[part] || (/^\d+$/.test(part) ? `第 ${Number(part) + 1} 项` : part)).join(' / '), before: display(oldFields[key]), after: display(newFields[key]) }))
}
