export interface AppScoreVO {
  appId: string
  score: number
}

export interface DeviceOverviewVO {
  appId: string
  active: number
  lost: number
  total: number
  avgLifecycleMinutes: number
}

export interface DeviceActiveVO {
  token: string
  lastOnlineTime: number
}

export interface DeviceDetailVO {
  appId: string
  token: string
  firstTime: number
  lastTime: number
  lifecycleMinutes: number
}

export interface AppStatsVO {
  appId: number
  installCount: number
  orderCount: number
  revenue: number
  usageMinutes: number
  dau: number
}

export interface MeterConfigVO {
  enabled: boolean
  keyTtlDays: number
  usageMaxGapSeconds: number
  lifecycleAppIds: string
  lifecycleFixedRateMs: number
}

export interface AppMeterVO {
  appId: number
  date: string
  dau: number
  newUsers: number
  totalUsers: number
  activeUsers: number
  mau: number
  dauMau: number
  d1Retention: number
  d7Retention: number
  usageSeconds: number
  usageMinutes: number
  avgUsageSeconds: number
  avgUsageMinutes: number
  sessions: number
  orders: number
  revenue: number
  conversionRate: number
  arpu: number
}
