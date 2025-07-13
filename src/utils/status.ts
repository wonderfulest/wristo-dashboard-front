import { PACKAGING_STATUS, PACKAGING_STATUS_COLORS, PACKAGING_STATUS_TEXT } from '@/types/product'

/**
 * 获取打包状态的颜色类型
 * @param status 打包状态
 * @returns Element Plus 的 tag 类型
 */
export const getPackagingStatusColor = (status: string): string => {
  return PACKAGING_STATUS_COLORS[status as keyof typeof PACKAGING_STATUS_COLORS] || 'info'
}

/**
 * 获取打包状态的显示文本
 * @param status 打包状态
 * @returns 中文显示文本
 */
export const getPackagingStatusText = (status: string): string => {
  return PACKAGING_STATUS_TEXT[status as keyof typeof PACKAGING_STATUS_TEXT] || status
}

/**
 * 检查是否为有效的打包状态
 * @param status 状态值
 * @returns 是否为有效状态
 */
export const isValidPackagingStatus = (status: string): boolean => {
  return Object.values(PACKAGING_STATUS).includes(status as any)
}

/**
 * 获取所有打包状态选项
 * @returns 状态选项数组
 */
export const getPackagingStatusOptions = () => {
  return Object.entries(PACKAGING_STATUS_TEXT).map(([value, label]) => ({
    label,
    value
  }))
}

/**
 * 验证逗号分隔的状态字符串
 * @param statusString 逗号分隔的状态字符串
 * @returns 是否所有状态都有效
 */
export const validatePackagingStatusString = (statusString: string): boolean => {
  if (!statusString) return true
  const statuses = statusString.split(',').map(s => s.trim())
  return statuses.every(status => isValidPackagingStatus(status))
}

/**
 * 格式化状态数组为逗号分隔的字符串
 * @param statusArray 状态数组
 * @returns 逗号分隔的状态字符串
 */
export const formatPackagingStatusArray = (statusArray: string[]): string => {
  if (!statusArray || statusArray.length === 0) return ''
  return statusArray.filter(status => isValidPackagingStatus(status)).join(',')
} 