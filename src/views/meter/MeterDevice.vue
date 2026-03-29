<template>
  <div class="meter-device-page">
    <div class="header">
      <h2>设备监控</h2>
      <div class="filters">
        <el-input v-model="appId" placeholder="输入 App ID" style="width: 220px" @keyup.enter="fetchOverview" />
        <el-button type="primary" :loading="loading" @click="fetchOverview">查询</el-button>
      </div>
    </div>

    <!-- 设备概览 -->
    <el-row v-if="overview" :gutter="16" class="overview-cards">
      <el-col :span="6">
        <el-statistic title="活跃设备" :value="overview.active">
          <template #suffix><span class="suffix-text">台</span></template>
        </el-statistic>
      </el-col>
      <el-col :span="6">
        <el-statistic title="流失设备" :value="overview.lost">
          <template #suffix><span class="suffix-text">台</span></template>
        </el-statistic>
      </el-col>
      <el-col :span="6">
        <el-statistic title="总设备" :value="overview.total">
          <template #suffix><span class="suffix-text">台</span></template>
        </el-statistic>
      </el-col>
      <el-col :span="6">
        <el-statistic title="平均生命周期" :value="Number((overview.avgLifecycleMinutes ?? 0).toFixed(2))">
          <template #suffix><span class="suffix-text">分钟</span></template>
        </el-statistic>
      </el-col>
    </el-row>

    <!-- 活跃设备列表 -->
    <el-card v-if="overview" class="section-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>活跃设备列表（最近 30 分钟）</span>
          <el-button type="primary" link :loading="activeLoading" @click="fetchActive">刷新</el-button>
        </div>
      </template>
      <el-table :data="activeDevices" v-loading="activeLoading" style="width: 100%" max-height="400">
        <el-table-column type="index" label="#" width="60" />
        <el-table-column prop="token" label="Device Token" min-width="300">
          <template #default="{ row }">
            <span class="mono">{{ row }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button type="primary" link @click="openDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 设备详情抽屉 -->
    <el-drawer v-model="detailVisible" title="设备详情" size="420px">
      <div v-if="detail" class="detail-content">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="App ID">{{ detail.appId }}</el-descriptions-item>
          <el-descriptions-item label="Token">
            <span class="mono">{{ detail.token }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="首次心跳">{{ formatTs(detail.firstTime) }}</el-descriptions-item>
          <el-descriptions-item label="最后心跳">{{ formatTs(detail.lastTime) }}</el-descriptions-item>
          <el-descriptions-item label="生命周期">{{ (detail.lifecycleMinutes ?? 0).toFixed(2) }} 分钟</el-descriptions-item>
        </el-descriptions>
      </div>
      <div v-else-if="detailLoading" v-loading="true" style="height: 200px" />
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getDeviceOverview, getActiveDevices, getDeviceDetail } from '@/api/meter'
import type { DeviceOverviewVO, DeviceDetailVO } from '@/types/meter'
import { formatDateTime } from '@/utils/date'

const appId = ref('')
const loading = ref(false)
const overview = ref<DeviceOverviewVO | null>(null)

const activeLoading = ref(false)
const activeDevices = ref<string[]>([])

const detailVisible = ref(false)
const detailLoading = ref(false)
const detail = ref<DeviceDetailVO | null>(null)

const formatTs = (ts: number) => {
  if (!ts) return '-'
  return formatDateTime(new Date(ts))
}

const fetchOverview = async () => {
  if (!appId.value.trim()) {
    ElMessage.warning('请输入 App ID')
    return
  }
  loading.value = true
  try {
    const res = await getDeviceOverview(appId.value.trim())
    overview.value = res.data || null
    await fetchActive()
  } catch {
    ElMessage.error('获取设备概览失败')
  } finally {
    loading.value = false
  }
}

const fetchActive = async () => {
  if (!appId.value.trim()) return
  activeLoading.value = true
  try {
    const res = await getActiveDevices(appId.value.trim())
    activeDevices.value = res.data || []
  } catch {
    activeDevices.value = []
  } finally {
    activeLoading.value = false
  }
}

const openDetail = async (token: string) => {
  detailVisible.value = true
  detailLoading.value = true
  detail.value = null
  try {
    const res = await getDeviceDetail(appId.value.trim(), token)
    detail.value = res.data || null
  } catch {
    ElMessage.error('获取设备详情失败')
  } finally {
    detailLoading.value = false
  }
}
</script>

<style scoped>
.meter-device-page { padding: 16px; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px; }
.filters { display: flex; gap: 12px; align-items: center; }
.overview-cards { margin-bottom: 24px; }
.overview-cards .el-statistic { background: var(--el-bg-color-page); border-radius: 8px; padding: 20px; }
.suffix-text { font-size: 14px; color: #909399; }
.section-card { margin-bottom: 16px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
.detail-content { padding: 8px; }
</style>
