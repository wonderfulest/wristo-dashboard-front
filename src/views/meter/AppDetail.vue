<template>
  <div class="meter-app-detail-page">
    <div class="header">
      <h2>应用指标详情</h2>
      <div class="filters">
        <AppSearchSelect
          v-model="appId"
          width="360px"
          placeholder="搜索应用（按名称）"
          @selected="onSelected"
        />
        <el-date-picker
          v-model="date"
          type="date"
          placeholder="选择日期（可选）"
          format="YYYYMMDD"
          value-format="YYYYMMDD"
          style="width: 180px"
          clearable
        />
        <el-button type="primary" :loading="loading" :disabled="!appId" @click="fetchMeter">刷新</el-button>
      </div>
    </div>

    <el-empty v-if="!appId" description="请选择应用" />

    <template v-else>
      <el-card class="section-card" shadow="never" v-loading="loading">
        <template #header>
          <div class="card-header">
            <span>关键指标</span>
            <span class="header-meta">
              <span v-if="selectedAppName" class="app-name">{{ selectedAppName }}</span>
              <span class="meta-split">·</span>
              <span>AppID：{{ appId }}</span>
              <span class="meta-split">·</span>
              <span>日期：{{ (meter?.date || date || '-') }}</span>
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
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import AppSearchSelect from '@/components/common/AppSearchSelect.vue'
import { getAppMeter } from '@/api/meter'
import { getProduct } from '@/api/products'
import type { AppMeterVO } from '@/types/meter'
import type { Product } from '@/types/product'

const route = useRoute()
const router = useRouter()

const appId = ref<number | null | undefined>(undefined)
const date = ref('')

const loading = ref(false)
const meter = ref<AppMeterVO | null>(null)
const selectedAppName = ref('')
const inited = ref(false)

const formatPercent = (v?: number | null) => {
  const n = Number(v ?? 0)
  if (!Number.isFinite(n)) return '0%'
  return `${(n * 100).toFixed(2)}%`
}

const fetchAppName = async () => {
  if (!appId.value) {
    selectedAppName.value = ''
    return
  }
  try {
    const res = await getProduct(appId.value)
    if (res.code === 0 && res.data) {
      selectedAppName.value = res.data.name || ''
    }
  } catch {
    // ignore
  }
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

const syncQuery = async () => {
  const nextQuery: Record<string, any> = { ...route.query }
  if (appId.value) nextQuery.appId = String(appId.value)
  else delete nextQuery.appId

  if (date.value) nextQuery.date = date.value
  else delete nextQuery.date

  await router.replace({ query: nextQuery })
}

const fetchMeter = async () => {
  if (!appId.value) {
    meter.value = null
    return
  }

  loading.value = true
  try {
    const res = await getAppMeter(appId.value, date.value || undefined)
    meter.value = res.data || null
  } catch {
    meter.value = null
    ElMessage.error('获取应用指标失败')
  } finally {
    loading.value = false
  }
}

const onSelected = (p: Product) => {
  selectedAppName.value = p.name || ''
}

watch([appId, date], async () => {
  if (!inited.value) return
  await syncQuery()
  await fetchAppName()
  await fetchMeter()
})

onMounted(async () => {
  const qAppId = route.query.appId
  const qDate = route.query.date

  if (typeof qAppId === 'string' && qAppId.trim()) {
    const id = Number(qAppId)
    appId.value = Number.isFinite(id) ? id : undefined
  }
  if (typeof qDate === 'string') {
    date.value = qDate
  }

  if (appId.value) {
    await fetchAppName()
    await fetchMeter()
  }

  inited.value = true
})
</script>

<style scoped>
.meter-app-detail-page { padding: 16px; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px; }
.filters { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
.section-card { margin-bottom: 24px; }
.card-header { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
.header-meta { color: #909399; font-size: 12px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.app-name { color: #606266; font-weight: 600; }
.meta-split { opacity: 0.7; }
.stats-cards { margin-bottom: 20px; }
.stats-cards .el-statistic { background: var(--el-bg-color-page); border-radius: 8px; padding: 16px; }
.stats-detail { margin-top: 8px; }
</style>
