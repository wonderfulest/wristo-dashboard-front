<template>
  <div class="meter-app-detail-page">
    <div class="header">
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

      <el-card class="section-card" shadow="never" v-loading="reviewsLoading">
        <template #header>
          <div class="card-header">
            <span>用户评价</span>
            <el-button type="primary" link :disabled="!appId" @click="fetchReviews">刷新评价</el-button>
          </div>
        </template>
        <el-empty v-if="!productReviews.length" description="暂无评价" />
        <el-table v-else :data="productReviews" row-key="id" border>
          <el-table-column label="用户" min-width="180">
            <template #default="{ row }">
              <div class="review-user">
                <strong>{{ row.userNickname || row.userName || 'Wristo 用户' }}</strong>
                <span>{{ row.userEmail || `#${row.userId}` }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="评分" width="150">
            <template #default="{ row }">
              <el-rate :model-value="row.rating" disabled size="small" />
            </template>
          </el-table-column>
          <el-table-column label="评价" min-width="260">
            <template #default="{ row }">
              <div class="review-comment">{{ row.comment || '-' }}</div>
            </template>
          </el-table-column>
          <el-table-column label="回复" min-width="260">
            <template #default="{ row }">
              <div v-if="row.adminReply" class="review-reply">
                <div>{{ row.adminReply }}</div>
                <span>{{ row.replyUserNickname || row.replyUserName || 'Admin' }} · {{ formatReviewTime(row.repliedAt) }}</span>
              </div>
              <span v-else class="muted">未回复</span>
            </template>
          </el-table-column>
          <el-table-column label="更新时间" width="180">
            <template #default="{ row }">{{ formatReviewTime(row.updatedAt || row.createdAt) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="110" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link @click="openReplyDialog(row)">
                {{ row.adminReply ? '编辑回复' : '回复' }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

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
import { ElMessage, ElMessageBox } from 'element-plus'
import AppSearchSelect from '@/components/common/AppSearchSelect.vue'
import AppBasicInfoCard from '@/views/meter/components/AppBasicInfoCard.vue'
import AppMetricsCard from '@/views/meter/components/AppMetricsCard.vue'
import AppScoreCard from '@/views/meter/components/AppScoreCard.vue'
import AppDeviceSection from '@/views/meter/components/AppDeviceSection.vue'
import { getAppMeter, getDeviceOverview, getActiveDevices, getLostDevices, getAllDevices, getDeviceDetail } from '@/api/meter'
import { getProduct, getProductReviews, replyProductReview } from '@/api/products'
import type { AppMeterVO, DeviceOverviewVO, DeviceActiveVO, DeviceDetailVO } from '@/types/meter'
import type { Product, ProductReviewVO } from '@/types/product'

const route = useRoute()
const router = useRouter()

const appId = ref<number | null | undefined>(undefined)
const date = ref('')

const loading = ref(false)
const productLoading = ref(false)
const reviewsLoading = ref(false)
const meter = ref<AppMeterVO | null>(null)
const productDetail = ref<Product | null>(null)
const productReviews = ref<ProductReviewVO[]>([])
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

const fetchReviews = async () => {
  if (!appId.value) {
    productReviews.value = []
    return
  }
  reviewsLoading.value = true
  try {
    const res = await getProductReviews(appId.value)
    productReviews.value = res.data || []
  } catch {
    productReviews.value = []
    ElMessage.error('获取用户评价失败')
  } finally {
    reviewsLoading.value = false
  }
}

const openReplyDialog = async (review: ProductReviewVO) => {
  let result
  try {
    result = await ElMessageBox.prompt('请输入管理员回复内容', '回复评价', {
      confirmButtonText: '保存回复',
      cancelButtonText: '取消',
      inputType: 'textarea',
      inputValue: review.adminReply || '',
      inputValidator: (value) => {
        const text = String(value || '')
        if (!text.trim()) return '回复内容不能为空'
        if (text.length > 2000) return '回复不能超过 2000 字'
        return true
      },
    })
    await replyProductReview(review.id, String(result.value || '').trim())
    ElMessage.success('评价回复已保存')
    await fetchReviews()
  } catch (error: any) {
    if (error === 'cancel' || error === 'close') return
    ElMessage.error('保存评价回复失败')
  }
}

const formatReviewTime = (value?: string | null) => {
  if (!value) return '-'
  const dateValue = new Date(value)
  if (Number.isNaN(dateValue.getTime())) return value
  return dateValue.toLocaleString()
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
  await fetchReviews()
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
    await Promise.all([fetchMeter(), fetchDeviceOverview(), fetchReviews()])
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
.review-user,
.review-reply { display: grid; gap: 4px; }
.review-user span,
.review-reply span,
.muted { color: #909399; font-size: 12px; }
.review-comment,
.review-reply div {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  line-height: 1.5;
}
</style>
