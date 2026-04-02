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
      <el-card class="section-card" shadow="never" v-loading="productLoading">
        <template #header>
          <div class="card-header">
            <span>应用基础信息</span>
            <el-button
              v-if="productDetail?.garminStoreUrl"
              type="primary"
              link
              @click="openStoreUrl(productDetail.garminStoreUrl)"
            >
              打开 Garmin 商店页
            </el-button>
          </div>
        </template>

        <el-empty v-if="!productDetail" description="暂无应用信息" />

        <template v-else>
          <div class="product-overview">
            <div class="product-cover">
              <el-image
                v-if="productImageUrl"
                :src="productImageUrl"
                fit="cover"
                class="product-cover__image"
                preview-teleported
              />
              <div v-else class="product-cover__placeholder">暂无图片</div>
            </div>

            <div class="product-main">
              <div class="product-main__title">
                <div>
                  <div class="product-name">{{ productDetail.name || '-' }}</div>
                  <!-- <div class="product-desc">{{ productDetail.description || '暂无描述' }}</div> -->
                </div>
              </div>

              <el-row :gutter="16" class="stats-cards product-summary">
                <el-col :span="12"><el-statistic title="总下载" :value="productDetail.download ?? 0" /></el-col>
                <el-col :span="12"><el-statistic title="购买数" :value="productDetail.purchase ?? 0" /></el-col>
              </el-row>

              <el-descriptions :column="2" border class="stats-detail">
                <el-descriptions-item label="AppID">{{ productDetail.appId ?? '-' }}</el-descriptions-item>
                <el-descriptions-item label="价格">{{ formatPriceDisplay(productDetail.price) }}</el-descriptions-item>
                <el-descriptions-item label="试用期">{{ formatTrialDisplay(productDetail.trialLasts) }}</el-descriptions-item>
                <el-descriptions-item label="设计ID">
                  <span class="mono">{{ productDetail.designId || '-' }}</span>
                </el-descriptions-item>
                <el-descriptions-item label="Garmin UUID">
                  <span class="mono">{{ productDetail.garminAppUuid || '-' }}</span>
                </el-descriptions-item>
                <el-descriptions-item label="最后上架时间">{{ formatDateDisplay(productDetail.lastGoLive) }}</el-descriptions-item>
              </el-descriptions>
            </div>
          </div>
        </template>
      </el-card>

      <!-- 关键指标 -->
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

      <!-- 设备监控 -->
      <el-card class="section-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span>设备监控</span>
            <el-button type="primary" link :loading="deviceOverviewLoading" @click="fetchDeviceOverview">刷新</el-button>
          </div>
        </template>

        <div v-if="deviceOverviewLoading && !deviceOverview" v-loading="true" style="height: 80px" />

        <template v-else-if="deviceOverview">
          <el-row :gutter="16" class="overview-cards">
            <el-col :span="6">
              <el-statistic
                title="活跃设备"
                :value="deviceOverview.active"
                class="clickable-stat"
                @click="showDeviceList('active')"
              >
                <template #suffix><span class="suffix-text">台</span></template>
              </el-statistic>
            </el-col>
            <el-col :span="6">
              <el-statistic
                title="流失设备"
                :value="deviceOverview.lost"
                class="clickable-stat"
                @click="showDeviceList('lost')"
              >
                <template #suffix><span class="suffix-text">台</span></template>
              </el-statistic>
            </el-col>
            <el-col :span="6">
              <el-statistic
                title="总设备"
                :value="deviceOverview.total"
                class="clickable-stat"
                @click="showDeviceList('all')"
              >
                <template #suffix><span class="suffix-text">台</span></template>
              </el-statistic>
            </el-col>
            <el-col :span="6">
              <el-statistic title="平均生命周期" :value="Number((deviceOverview.avgLifecycleMinutes ?? 0).toFixed(2))">
                <template #suffix><span class="suffix-text">分钟</span></template>
              </el-statistic>
            </el-col>
          </el-row>
        </template>

        <el-empty v-else description="暂无设备数据" />
      </el-card>

      <!-- 活跃设备列表 -->
      <el-card v-if="deviceList === 'active'" class="section-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span>活跃设备列表（最近 30 分钟）</span>
            <el-button type="primary" link :loading="activeDevicesLoading" @click="fetchActiveDevices">刷新</el-button>
          </div>
        </template>
        <el-table :data="activeDevices" v-loading="activeDevicesLoading" style="width: 100%" max-height="400">
          <el-table-column type="index" label="#" width="60" />
          <el-table-column prop="token" label="Device Token" min-width="300">
            <template #default="{ row }">
              <span class="mono">{{ row.token }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="lastOnlineTime" label="最后登录时间" min-width="220">
            <template #default="{ row }">
              <div class="time-cell">
                <div>{{ formatTs(row.lastOnlineTime) }}</div>
                <div class="time-cell__relative">{{ formatRelativeTime(row.lastOnlineTime) }}</div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <el-button type="primary" link @click="openDeviceDetail(row.token)">详情</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- 流失设备列表 -->
      <el-card v-if="deviceList === 'lost'" class="section-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span>流失设备列表</span>
            <el-button type="primary" link :loading="lostDevicesLoading" @click="fetchLostDevices">刷新</el-button>
          </div>
        </template>
        <el-table :data="lostDevices" v-loading="lostDevicesLoading" style="width: 100%" max-height="400">
          <el-table-column type="index" label="#" width="60" />
          <el-table-column prop="token" label="Device Token" min-width="300">
            <template #default="{ row }">
              <span class="mono">{{ row.token }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="lastOnlineTime" label="最后登录时间" min-width="220">
            <template #default="{ row }">
              <div class="time-cell">
                <div>{{ formatTs(row.lastOnlineTime) }}</div>
                <div class="time-cell__relative">{{ formatRelativeTime(row.lastOnlineTime) }}</div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <el-button type="primary" link @click="openDeviceDetail(row.token)">详情</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- 所有设备列表 -->
      <el-card v-if="deviceList === 'all'" class="section-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span>所有设备列表</span>
            <el-button type="primary" link :loading="allDevicesLoading" @click="fetchAllDevices">刷新</el-button>
          </div>
        </template>
        <el-table :data="allDevices" v-loading="allDevicesLoading" style="width: 100%" max-height="400">
          <el-table-column type="index" label="#" width="60" />
          <el-table-column prop="token" label="Device Token" min-width="300">
            <template #default="{ row }">
              <span class="mono">{{ row.token }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="lastOnlineTime" label="最后登录时间" min-width="220">
            <template #default="{ row }">
              <div class="time-cell">
                <div>{{ formatTs(row.lastOnlineTime) }}</div>
                <div class="time-cell__relative">{{ formatRelativeTime(row.lastOnlineTime) }}</div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <el-button type="primary" link @click="openDeviceDetail(row.token)">详情</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- 设备详情抽屉 -->
      <el-drawer v-model="deviceDetailVisible" title="设备详情" size="420px">
        <div v-if="deviceDetail" class="detail-content">
          <el-descriptions :column="1" border>
            <el-descriptions-item label="App ID">{{ deviceDetail.appId }}</el-descriptions-item>
            <el-descriptions-item label="Token">
              <span class="mono">{{ deviceDetail.token }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="首次心跳">{{ formatTs(deviceDetail.firstTime) }}</el-descriptions-item>
            <el-descriptions-item label="最后心跳">{{ formatTs(deviceDetail.lastTime) }}</el-descriptions-item>
            <el-descriptions-item label="生命周期">{{ (deviceDetail.lifecycleMinutes ?? 0).toFixed(2) }} 分钟</el-descriptions-item>
          </el-descriptions>
        </div>
        <div v-else-if="deviceDetailLoading" v-loading="true" style="height: 200px" />
      </el-drawer>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import AppSearchSelect from '@/components/common/AppSearchSelect.vue'
import { getAppMeter, getDeviceOverview, getActiveDevices, getLostDevices, getAllDevices, getDeviceDetail } from '@/api/meter'
import { getProduct } from '@/api/products'
import type { AppMeterVO, DeviceOverviewVO, DeviceActiveVO, DeviceDetailVO } from '@/types/meter'
import type { Product } from '@/types/product'
import { formatDateTime } from '@/utils/date'

const route = useRoute()
const router = useRouter()

const appId = ref<number | null | undefined>(undefined)
const date = ref('')

const loading = ref(false)
const productLoading = ref(false)
const meter = ref<AppMeterVO | null>(null)
const productDetail = ref<Product | null>(null)
const selectedAppName = ref('')
const inited = ref(false)

// ---- Device monitoring ----
const deviceOverviewLoading = ref(false)
const deviceOverview = ref<DeviceOverviewVO | null>(null)
const deviceList = ref<'active' | 'lost' | 'all' | null>(null)

const activeDevicesLoading = ref(false)
const activeDevices = ref<DeviceActiveVO[]>([])

const lostDevicesLoading = ref(false)
const lostDevices = ref<DeviceActiveVO[]>([])

const allDevicesLoading = ref(false)
const allDevices = ref<DeviceActiveVO[]>([])

const deviceDetailVisible = ref(false)
const deviceDetailLoading = ref(false)
const deviceDetail = ref<DeviceDetailVO | null>(null)

const productImageUrl = computed(() => {
  if (!productDetail.value) return ''
  return productDetail.value.garminImageUrl || productDetail.value.rawImageUrl || productDetail.value.bannerImageUrl || ''
})

const formatTs = (ts: number) => {
  if (!ts) return '-'
  return formatDateTime(new Date(ts))
}

const formatRelativeTime = (ts: number) => {
  if (!ts) return '-'
  const diff = Date.now() - ts
  if (diff < 0) return '刚刚'
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  if (diff < minute) return '刚刚'
  if (diff < hour) return `${Math.floor(diff / minute)} 分钟前`
  if (diff < day) return `${Math.floor(diff / hour)} 小时前`
  return `${Math.floor(diff / day)} 天前`
}

const fetchDeviceOverview = async () => {
  if (!appId.value) return
  deviceOverviewLoading.value = true
  try {
    const res = await getDeviceOverview(String(appId.value))
    deviceOverview.value = res.data || null
  } catch {
    deviceOverview.value = null
  } finally {
    deviceOverviewLoading.value = false
  }
}

const showDeviceList = async (type: 'active' | 'lost' | 'all') => {
  deviceList.value = type
  if (type === 'active') await fetchActiveDevices()
  else if (type === 'lost') await fetchLostDevices()
  else await fetchAllDevices()
}

const fetchActiveDevices = async () => {
  if (!appId.value) return
  activeDevicesLoading.value = true
  try {
    const res = await getActiveDevices(String(appId.value))
    activeDevices.value = res.data || []
  } catch {
    activeDevices.value = []
  } finally {
    activeDevicesLoading.value = false
  }
}

const fetchLostDevices = async () => {
  if (!appId.value) return
  lostDevicesLoading.value = true
  try {
    const res = await getLostDevices(String(appId.value))
    lostDevices.value = res.data || []
  } catch {
    lostDevices.value = []
  } finally {
    lostDevicesLoading.value = false
  }
}

const fetchAllDevices = async () => {
  if (!appId.value) return
  allDevicesLoading.value = true
  try {
    const res = await getAllDevices(String(appId.value))
    allDevices.value = res.data || []
  } catch {
    allDevices.value = []
  } finally {
    allDevicesLoading.value = false
  }
}

const openDeviceDetail = async (token: string) => {
  if (!appId.value) return
  deviceDetailVisible.value = true
  deviceDetailLoading.value = true
  deviceDetail.value = null
  try {
    const res = await getDeviceDetail(String(appId.value), token)
    deviceDetail.value = res.data || null
  } catch {
    ElMessage.error('获取设备详情失败')
  } finally {
    deviceDetailLoading.value = false
  }
}

// ---- Meter metrics ----
const formatPercent = (v?: number | null) => {
  const n = Number(v ?? 0)
  if (!Number.isFinite(n)) return '0%'
  return `${(n * 100).toFixed(2)}%`
}

const formatDateDisplay = (v?: string | null) => {
  if (!v) return '-'
  return formatDateTime(v)
}

const formatPriceDisplay = (v?: number | null) => {
  const n = Number(v ?? 0)
  if (!Number.isFinite(n)) return '-'
  return `$${n.toFixed(2)}`
}

const formatTrialDisplay = (v?: number | null) => {
  const n = Number(v ?? 0)
  if (!Number.isFinite(n) || n <= 0) return '无试用'
  if (Number.isInteger(n)) return `${n} 小时`
  return `${n.toFixed(2)} 小时`
}

const fetchAppName = async () => {
  if (!appId.value) {
    selectedAppName.value = ''
    productDetail.value = null
    return
  }
  productLoading.value = true
  try {
    const res = await getProduct(appId.value)
    if (res.code === 0 && res.data) {
      productDetail.value = res.data
      selectedAppName.value = res.data.name || ''
    }
  } catch {
    productDetail.value = null
  } finally {
    productLoading.value = false
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

const openStoreUrl = (url: string) => {
  window.open(url, '_blank', 'noopener,noreferrer')
}

watch([appId, date], async () => {
  if (!inited.value) return
  await syncQuery()
  await fetchAppName()
  await fetchMeter()
  deviceOverview.value = null
  deviceList.value = null
  await fetchDeviceOverview()
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
    await Promise.all([fetchMeter(), fetchDeviceOverview()])
  }

  inited.value = true
})
</script>

<style scoped>
.meter-app-detail-page { padding: 16px; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px; }
.filters { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
.section-card { margin-bottom: 24px; }
.overview-cards { margin-bottom: 8px; }
.overview-cards .el-statistic { background: var(--el-bg-color-page); border-radius: 8px; padding: 20px; }
.clickable-stat { cursor: pointer; transition: box-shadow 0.2s; }
.clickable-stat:hover { box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12); }
.suffix-text { font-size: 14px; color: #909399; }
.mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
.time-cell { line-height: 1.4; }
.time-cell__relative { font-size: 12px; color: #909399; }
.detail-content { padding: 8px; }
.card-header { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
.header-meta { color: #909399; font-size: 12px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.app-name { color: #606266; font-weight: 600; }
.meta-split { opacity: 0.7; }
.stats-cards { margin-bottom: 20px; }
.stats-cards .el-statistic { background: var(--el-bg-color-page); border-radius: 8px; padding: 16px; }
.stats-detail { margin-top: 8px; }
.product-overview { display: flex; gap: 20px; align-items: flex-start; flex-wrap: wrap; }
.product-cover { width: 180px; flex: 0 0 180px; }
.product-cover__image,
.product-cover__placeholder {
  width: 180px;
  height: 180px;
  border-radius: 12px;
  overflow: hidden;
  background: var(--el-fill-color-light);
}
.product-cover__placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
  font-size: 14px;
}
.product-main { flex: 1; min-width: 320px; }
.product-main__title { margin-bottom: 16px; }
.product-name { font-size: 22px; font-weight: 700; color: #303133; line-height: 1.3; }
.product-desc { margin-top: 8px; color: #606266; line-height: 1.6; white-space: pre-wrap; }
.product-summary { margin-bottom: 0; }
</style>
