<template>
  <el-card class="app-management" shadow="never">
    <template #header><strong>应用管理</strong></template>
    <div class="operations">
      <div class="operation">
        <h3>国外同步国内</h3>
        <p>按应用创建时间，将所选时间段内新创建的应用提交到 Wristo CN，更新应用资料、分类及展示数据。</p>
        <div class="sync-controls">
          <el-select v-model="syncRange" aria-label="同步时间范围" :disabled="busy" style="width: 120px">
            <el-option v-for="option in syncRanges" :key="option.value" :label="option.label" :value="option.value" />
          </el-select>
          <el-button type="primary" :loading="active === 'sync'" :disabled="busy || !syncReady" @click="syncAll">
            国外同步国内
          </el-button>
        </div>
        <span v-if="syncMessage" class="result" role="status">{{ syncMessage }}</span>
      </div>
      <div class="operation">
        <h3>下载量</h3>
        <p>根据下载记录和历史统计，重新计算全部应用的累计下载量。</p>
        <el-button :loading="active === 'downloads'" :disabled="busy" @click="refreshMetric('downloads')">刷新下载量</el-button>
        <span v-if="downloadMessage" class="result" role="status">{{ downloadMessage }}</span>
      </div>
      <div class="operation">
        <h3>购买量</h3>
        <p>根据成功购买记录，重新计算全部应用的购买量，包含 Bundle 购买。</p>
        <el-button :loading="active === 'purchases'" :disabled="busy" @click="refreshMetric('purchases')">刷新购买量</el-button>
        <span v-if="purchaseMessage" class="result" role="status">{{ purchaseMessage }}</span>
      </div>
    </div>
    <div class="sync-status">
      <span>CN 同步状态</span>
      <el-tag v-if="status" :type="syncReady ? 'success' : 'warning'">{{ syncReady ? '已启用' : '未启用或配置不完整' }}</el-tag>
      <template v-if="status">
        <span>待同步 {{ status.pending }}</span>
        <span>失败重试 {{ status.retrying }}</span>
        <span>最近同步：{{ status.lastDeliveredAt || '暂无' }}</span>
      </template>
      <el-button link :loading="statusLoading" @click="loadStatus">刷新状态</el-button>
    </div>
    <el-alert v-if="statusError" :title="statusError" type="error" :closable="false" show-icon />
    <el-alert v-else-if="status && !syncReady" title="请在国外 API 启用 CN 同步，并配置国内 API 地址及两端一致的共享密钥。" type="warning" :closable="false" show-icon />
  </el-card>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getCnCatalogStatus, submitCnCatalogPage, refreshDownloads, refreshPurchases } from '@/api/app-management'
import type { CnCatalogStatus, CnSyncRange } from '@/api/app-management'
import { backfillAllCnCatalog } from '@/utils/cnCatalogBackfill'

const syncRanges: { value: CnSyncRange; label: string }[] = [
  { value: 'DAYS_3', label: '3天' },
  { value: 'DAYS_7', label: '7天' },
  { value: 'MONTH_1', label: '1个月' },
  { value: 'MONTHS_3', label: '3个月' },
  { value: 'MONTHS_6', label: '半年' },
  { value: 'YEAR_1', label: '一年' },
  { value: 'ALL', label: '所有' },
]
const syncRange = ref<CnSyncRange>('DAYS_3')

const active = ref<'sync' | 'downloads' | 'purchases' | null>(null)
const busy = computed(() => active.value !== null)
const status = ref<CnCatalogStatus | null>(null)
const syncReady = computed(() => status.value?.enabled && status.value?.configured && !statusError.value)
const statusLoading = ref(false)
const statusError = ref('')
const syncMessage = ref('')
const downloadMessage = ref('')
const purchaseMessage = ref('')
let disposed = false
let poll: ReturnType<typeof setInterval> | undefined

async function loadStatus() {
  if (statusLoading.value || disposed) return
  statusLoading.value = true
  try {
    const res = await getCnCatalogStatus()
    if (disposed) return
    if (!res.data) throw new Error("同步状态为空")
    if (typeof res.data.enabled !== "boolean" || typeof res.data.configured !== "boolean") {
      throw new Error("同步状态接口尚未更新，请重启国外 API 后重试。")
    }
    status.value = res.data
    statusError.value = ''
    if (status.value.pending > 0 && !poll) poll = setInterval(() => { void loadStatus() }, 5000)
    if (status.value.pending === 0 && poll) { clearInterval(poll); poll = undefined }
  } catch (error) {
    statusError.value = error instanceof Error ? error.message : '无法获取 CN 同步状态，请刷新状态重试。'
    if (poll) { clearInterval(poll); poll = undefined }
  } finally {
    statusLoading.value = false
  }
}

async function syncAll() {
  if (busy.value || !syncReady.value) return
  const range = syncRange.value
  const until = new Date().toISOString()
  const label = syncRanges.find(option => option.value === range)!.label
  active.value = 'sync'
  let queued = 0
  syncMessage.value = `正在提交（${label}）应用…`
  try {
    await backfillAllCnCatalog(async after => {
      const res = await submitCnCatalogPage(after, range, until)
      if (!res.data) throw new Error("同步分页为空")
      return res.data
    }, count => {
      queued = count
      syncMessage.value = `（${label}）已提交 ${count} 个应用，正在提交后续应用…`
    }, () => disposed)
    syncMessage.value = `（${label}）已提交 ${queued} 个应用，后台同步中，请查看待同步及失败重试数量。`
    ElMessage.success('应用已提交同步队列')
    if (!disposed && !poll) poll = setInterval(() => { void loadStatus() }, 5000)
  } catch {
    syncMessage.value = `（${label}）提交未全部完成，已确认入队 ${queued} 个应用；可按所选范围重试。`
  } finally {
    active.value = null
    await loadStatus()
  }
}

async function refreshMetric(metric: 'downloads' | 'purchases') {
  if (busy.value) return
  active.value = metric
  const message = metric === 'downloads' ? downloadMessage : purchaseMessage
  const label = metric === 'downloads' ? '下载量' : '购买量'
  message.value = `正在刷新全部应用${label}…`
  try {
    const res = await (metric === 'downloads' ? refreshDownloads() : refreshPurchases())
    if (!res.data) throw new Error('未完成')
    message.value = `${label}刷新完成`
    ElMessage.success(message.value)
  } catch {
    message.value = `${label}刷新未确认完成，部分应用可能已更新；请求中断时后台任务可能仍在运行，请稍后重试。`
  } finally {
    active.value = null
  }
}

onMounted(() => { void loadStatus() })
onUnmounted(() => {
  disposed = true
  if (poll) clearInterval(poll)
})
</script>

<style scoped>
.app-management { margin: 12px 0; }
.operations { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 24px; }
.operation h3 { margin: 0 0 8px; font-size: 15px; }
.operation p { margin: 0 0 16px; color: var(--el-text-color-secondary); line-height: 1.6; min-height: 48px; }
.sync-controls { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }
.result { display: block; margin-top: 12px; font-size: 13px; line-height: 1.6; overflow-wrap: anywhere; }
.sync-status { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin: 20px 0 12px; font-size: 13px; color: var(--el-text-color-secondary); }
@media (max-width: 768px) {
  .operations { grid-template-columns: 1fr; gap: 20px; }
  .operation p { min-height: auto; }
}
</style>
