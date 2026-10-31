<template>
  <div class="download-records">
    <h2>应用下载记录</h2>
    <p class="description">按设备上报记录逐条展示，与下载排行口径一致（状态 ≥ 1）。记录时间为首次上报时间，不代表每次商店下载；不含已清理归档的历史记录。邮箱仅在已上报时显示。应用下载量、购买量为当前累计值。</p>
    <el-card>
      <el-form inline @submit.prevent="search">
        <el-form-item label="应用 ID"><el-input v-model="form.appId" placeholder="应用 ID" clearable /></el-form-item>
        <el-form-item label="设备"><el-input v-model="form.device" placeholder="完整设备标识" clearable /></el-form-item>
        <el-form-item label="邮箱"><el-input v-model="form.email" placeholder="完整邮箱" clearable /></el-form-item>
        <el-form-item label="记录日期"><el-date-picker v-model="dates" type="daterange" value-format="YYYY-MM-DD" start-placeholder="开始日期" end-placeholder="结束日期" /></el-form-item>
        <el-form-item><el-button type="primary" native-type="submit" :loading="loading">查询</el-button><el-button @click="reset">重置</el-button></el-form-item>
      </el-form>
      <el-alert v-if="error" :title="error" type="error" show-icon :closable="false" />
      <el-table v-loading="loading" :data="rows" row-key="id" empty-text="暂无下载记录" style="width: 100%">
        <el-table-column prop="id" label="记录 ID" width="100" />
        <el-table-column label="记录时间" width="200"><template #default="{ row }">{{ formatTime(row.createdAt) }}</template></el-table-column>
        <el-table-column label="应用" min-width="410">
          <template #default="{ row }">
            <div class="app-cell">
              <el-image v-if="row.appImageUrl" class="app-image" :src="row.appImageUrl" :alt="row.appName || `应用 ${row.appId}`" fit="contain" lazy :preview-src-list="[row.appImageUrl]" preview-teleported>
                <template #error><span class="image-placeholder">加载失败</span></template>
              </el-image>
              <span v-else class="app-image image-placeholder">暂无图片</span>
              <div class="app-details">
                <div class="app-heading">
                  <span class="app-name">{{ row.appName || '未知应用' }}</span>
                  <span class="app-id">#{{ row.appId }}</span>
                </div>
                <div class="app-stats">
                  <span>下载 <strong>{{ formatCount(row.appDownloadCount) }}</strong></span>
                  <span>购买 <strong>{{ formatCount(row.appPurchaseCount) }}</strong></span>
                </div>
                <div class="app-date"><span>创建</span> {{ formatTime(row.appCreatedAt) }}</div>
                <div class="app-date"><span>更新</span> {{ formatTime(row.appUpdatedAt) }}</div>
                <el-button v-if="storeUrl(row.garminStoreUrl)" tag="a" :href="storeUrl(row.garminStoreUrl)" target="_blank" rel="noopener noreferrer" type="primary" plain size="small">Connect IQ Store ↗</el-button>
                <span v-else class="description">暂无商店地址</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="设备型号" min-width="180"><template #default="{ row }"><span :title="row.device || undefined">{{ row.deviceDisplayName || '未知设备' }}</span></template></el-table-column>
        <el-table-column label="平台" width="110"><template #default="{ row }">{{ row.platform || '—' }}</template></el-table-column>
        <el-table-column label="邮箱" min-width="220"><template #default="{ row }">{{ row.email || '未上报' }}</template></el-table-column>
        <el-table-column label="当前状态" width="140"><template #default="{ row }">{{ statusLabels[row.status] || `状态 ${row.status}` }}</template></el-table-column>
        <el-table-column label="测试" width="80"><template #default="{ row }">{{ row.isTest ? '是' : '否' }}</template></el-table-column>
      </el-table>
      <el-pagination class="pagination" background layout="total, sizes, prev, pager, next" :total="total" :current-page="pageNum" :page-size="pageSize" :page-sizes="[20, 50, 100]" @current-change="changePage" @size-change="changeSize" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getDownloadRecords, type DownloadRecord, type DownloadRecordQuery } from '@/api/downloadRecords'

const form = reactive({ appId: '', device: '', email: '' })
const dates = ref<[string, string] | null>(null)
const rows = ref<DownloadRecord[]>([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(20)
const loading = ref(false)
const error = ref('')
let requestId = 0
let filters: Omit<DownloadRecordQuery, 'pageNum' | 'pageSize'> = {}
const statusLabels: Record<number, string> = { 1: '开始试用', 2: '显示激活码', 3: '输入激活码', 10: '开始购买', 40: '已购买应用', 50: '已购买套餐', 60: '已订阅' }
const storeUrl = (value?: string | null): string | undefined => {
  if (!value) return undefined
  try {
    const url = new URL(value)
    return ['https:', 'http:'].includes(url.protocol) ? url.href : undefined
  } catch {
    return undefined
  }
}
const formatCount = (value?: number | null) => value == null ? '—' : value.toLocaleString('zh-CN')
const formatTime = (value?: string | null) => value ? new Date(value).toLocaleString('zh-CN') : '—'

async function fetchRecords() {
  const id = ++requestId
  loading.value = true
  error.value = ''
  try {
    const res = await getDownloadRecords({ ...filters, pageNum: pageNum.value, pageSize: pageSize.value })
    if (id !== requestId) return
    if (!res.data) throw new Error('下载记录接口未返回数据')
    rows.value = res.data.list
    total.value = res.data.total
  } catch (e: any) {
    if (id !== requestId) return
    rows.value = []
    total.value = 0
    error.value = e?.message || '获取下载记录失败，请重试'
  } finally {
    if (id === requestId) loading.value = false
  }
}
function search() {
  const appId = form.appId.trim()
  if (appId && (!/^\d+$/.test(appId) || !Number.isSafeInteger(Number(appId)) || Number(appId) <= 0)) {
    ElMessage.warning('请输入有效的应用 ID')
    return
  }
  filters = { appId: appId ? Number(appId) : undefined, device: form.device.trim() || undefined, email: form.email.trim() || undefined, startDate: dates.value?.[0], endDate: dates.value?.[1] }
  pageNum.value = 1
  void fetchRecords()
}
function reset() {
  Object.assign(form, { appId: '', device: '', email: '' })
  dates.value = null
  search()
}
function changePage(page: number) { pageNum.value = page; void fetchRecords() }
function changeSize(size: number) { pageSize.value = size; pageNum.value = 1; void fetchRecords() }
onMounted(fetchRecords)
</script>

<style scoped>
.download-records { padding: 16px; }
h2 { margin-top: 0; }
.description { color: var(--el-text-color-secondary); font-size: 13px; line-height: 1.7; }
.app-cell { display: flex; align-items: flex-start; gap: 16px; padding: 10px 0; }
.app-details { min-width: 0; flex: 1; }
.app-heading { display: flex; align-items: baseline; flex-wrap: wrap; gap: 8px; }
.app-name { color: var(--el-text-color-primary); font-size: 14px; font-weight: 600; overflow-wrap: anywhere; }
.app-id { color: var(--el-text-color-secondary); font-size: 12px; }
.app-stats { display: flex; flex-wrap: wrap; gap: 8px; margin: 8px 0; }
.app-stats > span { padding: 2px 8px; border-radius: 5px; background: var(--el-fill-color-light); color: var(--el-text-color-secondary); font-size: 12px; }
.app-stats strong { margin-left: 6px; color: var(--el-text-color-primary); font-variant-numeric: tabular-nums; }
.app-date { color: var(--el-text-color-regular); font-size: 12px; line-height: 1.8; font-variant-numeric: tabular-nums; }
.app-date > span { color: var(--el-text-color-secondary); margin-right: 8px; }
.app-details .el-button { margin-top: 8px; }
.app-image { width: 76px; height: 76px; flex-shrink: 0; border-radius: 12px; border: 1px solid var(--el-border-color-lighter); }
.image-placeholder { display: flex; align-items: center; justify-content: center; height: 76px; background: var(--el-fill-color-light); color: var(--el-text-color-secondary); font-size: 12px; }
.pagination { margin-top: 20px; overflow-x: auto; }
</style>
