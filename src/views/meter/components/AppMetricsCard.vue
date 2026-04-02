<template>
  <el-card class="section-card" shadow="never" v-loading="loading">
    <template #header>
      <div class="card-header">
        <span>今日表现</span>
        <span class="header-meta">
          <span v-if="selectedAppName" class="app-name">{{ selectedAppName }}</span>
          <span class="meta-split">·</span>
          <span>AppID：{{ appId }}</span>
          <span class="meta-split">·</span>
          <span>日期：{{ displayDate }}</span>
        </span>
      </div>
    </template>

    <el-empty v-if="!meter" description="暂无数据" />

    <template v-else>
      <el-row :gutter="16" class="stats-cards">
        <el-col :span="4"><el-statistic title="DAU" :value="meter.dau ?? 0" /></el-col>
        <el-col :span="4"><el-statistic title="MAU" :value="meter.mau ?? 0" /></el-col>
        <el-col :span="4"><el-statistic title="新增用户" :value="meter.newUsers ?? 0" /></el-col>
        <el-col :span="4"><el-statistic title="活跃用户" :value="meter.activeUsers ?? 0" /></el-col>
        <el-col :span="4"><el-statistic title="订单数" :value="meter.orders ?? 0" /></el-col>
        <el-col :span="4"><el-statistic title="收入" :value="formatMoney(meter.revenue)" /></el-col>
      </el-row>

      <el-descriptions :column="2" border class="stats-detail">
        <el-descriptions-item label="总用户">{{ meter.totalUsers ?? 0 }}</el-descriptions-item>
        <el-descriptions-item label="会话数">{{ meter.sessions ?? 0 }}</el-descriptions-item>

        <el-descriptions-item label="DAU/MAU">{{ formatRatio(meter.dauMau) }}</el-descriptions-item>
        <el-descriptions-item label="转化率">{{ formatPercent(meter.conversionRate) }}</el-descriptions-item>

        <el-descriptions-item label="D1 留存">{{ formatPercent(meter.d1Retention) }}</el-descriptions-item>
        <el-descriptions-item label="D7 留存">{{ formatPercent(meter.d7Retention) }}</el-descriptions-item>

        <el-descriptions-item label="使用时长">{{ formatMinutes(meter.usageMinutes) }}</el-descriptions-item>
        <el-descriptions-item label="平均使用时长">{{ formatMinutes(meter.avgUsageMinutes) }}</el-descriptions-item>

        <el-descriptions-item label="ARPU">{{ formatMoney(meter.arpu) }}</el-descriptions-item>
      </el-descriptions>
    </template>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { AppMeterVO } from '@/types/meter'

const props = defineProps<{
  loading: boolean
  meter: AppMeterVO | null
  appId: number
  date: string
  selectedAppName: string
}>()

const displayDate = computed(() => props.meter?.date || props.date || '-')

const formatPercent = (v?: number | null) => {
  const n = Number(v ?? 0)
  if (!Number.isFinite(n)) return '0%'
  return `${(n * 100).toFixed(2)}%`
}

const formatRatio = (v?: number | null) => {
  const n = Number(v ?? 0)
  if (!Number.isFinite(n)) return '0'
  return n.toFixed(4)
}

const formatMoney = (v?: number | null) => {
  const n = Number(v ?? 0)
  if (!Number.isFinite(n)) return 0
  return Number(n.toFixed(2))
}

const formatMinutes = (v?: number | null) => {
  const n = Number(v ?? 0)
  if (!Number.isFinite(n)) return '-'
  return `${n.toFixed(2)} 分钟`
}
</script>

<style scoped>
.section-card { margin-bottom: 24px; }
.card-header { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
.header-meta { color: #909399; font-size: 12px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.app-name { color: #606266; font-weight: 600; }
.meta-split { opacity: 0.7; }
.stats-cards { margin-bottom: 20px; }
.stats-cards .el-statistic { background: var(--el-bg-color-page); border-radius: 8px; padding: 16px; }
.stats-detail { margin-top: 8px; }
</style>
