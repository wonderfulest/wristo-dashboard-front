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
      <AppBasicInfoCard :loading="productLoading" :product="productDetail" :image-url="productImageUrl" />

      <AppScoreCard :score="meter?.score || null" />

      <AppMetricsCard
        :loading="loading"
        :meter="meter"
        :app-id="appId"
        :date="date"
        :selected-app-name="selectedAppName"
      />

      <AppDeviceSection
        :overview-loading="deviceOverviewLoading"
        :overview="deviceOverview"
        :device-list="deviceList"
        :active-loading="activeDevicesLoading"
        :active-devices="activeDevices"
        :lost-loading="lostDevicesLoading"
        :lost-devices="lostDevices"
        :all-loading="allDevicesLoading"
        :all-devices="allDevices"
        :detail-visible="deviceDetailVisible"
        :detail-loading="deviceDetailLoading"
        :detail="deviceDetail"
        @refresh-overview="fetchDeviceOverview"
        @show-list="showDeviceList"
        @refresh-list="refreshDeviceList"
        @open-detail="openDeviceDetail"
        @update:detailVisible="deviceDetailVisible = $event"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import AppSearchSelect from '@/components/common/AppSearchSelect.vue'
import AppBasicInfoCard from '@/views/meter/components/AppBasicInfoCard.vue'
import AppMetricsCard from '@/views/meter/components/AppMetricsCard.vue'
import AppScoreCard from '@/views/meter/components/AppScoreCard.vue'
import AppDeviceSection from '@/views/meter/components/AppDeviceSection.vue'
import { getAppMeter, getDeviceOverview, getActiveDevices, getLostDevices, getAllDevices, getDeviceDetail } from '@/api/meter'
import { getProduct } from '@/api/products'
import type { AppMeterVO, DeviceOverviewVO, DeviceActiveVO, DeviceDetailVO } from '@/types/meter'
import type { Product } from '@/types/product'

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

const refreshDeviceList = async (type: 'active' | 'lost' | 'all') => {
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
</style>
