<template>
  <div class="download-records">
    <p class="description">按设备与表盘的上报记录展示，包含已保留的归档历史。“首次下载”指现存历史中首次出现，不代表首次安装或新增用户。邮箱仅在已上报时显示。应用下载量、购买量为当前累计值。</p>
    <el-card>
      <el-form inline @submit.prevent="search">
        <el-form-item label="下载类型"><el-select v-model="downloadType" style="width: 180px"><el-option label="全部上报" value="" /><el-option label="首次下载" value="FIRST" /><el-option label="历史设备重新上报" value="RETURNING" /></el-select></el-form-item>
        <el-form-item label="应用 ID"><el-input v-model="form.appId" placeholder="应用 ID" clearable /></el-form-item>
        <el-form-item label="设备"><el-input v-model="form.device" placeholder="完整设备标识" clearable /></el-form-item>
        <el-form-item label="邮箱"><el-input v-model="form.email" placeholder="完整邮箱" clearable /></el-form-item>
        <el-form-item><el-button type="primary" native-type="submit" :loading="loading">查询</el-button><el-button @click="reset">重置</el-button></el-form-item>
      </el-form>
      <el-alert v-if="error" :title="error" type="error" show-icon :closable="false" />
      <el-table v-loading="loading" :data="rows" row-key="id" empty-text="暂无下载记录" style="width: 100%">
        <el-table-column label="下载类型" width="170"><template #default="{ row }"><el-tag :type="row.downloadType === 'FIRST' ? 'success' : 'info'">{{ row.downloadType === 'FIRST' ? '首次下载' : '历史设备重新上报' }}</el-tag></template></el-table-column>
        <el-table-column label="最早记录时间" width="200"><template #default="{ row }">{{ formatTime(row.firstSeenAt) }}</template></el-table-column>
        <el-table-column prop="id" label="记录 ID" width="100" />
        <el-table-column label="记录时间" width="200"><template #default="{ row }">{{ formatTime(row.createdAt) }}</template></el-table-column>
        <el-table-column label="应用" min-width="600">
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
                  <el-button v-if="storeUrl(row.garminStoreUrl)" tag="a" :href="storeUrl(row.garminStoreUrl)" target="_blank" rel="noopener noreferrer" text size="small" class="store-button">商店 ↗</el-button>
                  <span v-else class="store-empty">暂无商店地址</span>
                </div>
                <div class="app-meta">
                  <span class="app-author" :title="row.appAuthorName || '未知作者'">作者：{{ row.appAuthorName || '未知作者' }}</span>
                  <span>下载 <strong>{{ formatCount(row.appDownloadCount) }}</strong></span>
                  <span>购买 <strong>{{ formatCount(row.appPurchaseCount) }}</strong></span>
                </div>
                <div class="app-dates">
                  <span>创建 {{ formatTime(row.appCreatedAt) }}</span>
                  <span>更新 {{ formatTime(row.appUpdatedAt) }}</span>
                </div>
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
import { reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { getDownloadRecords, type DownloadRecord, type DownloadRecordQuery } from '@/api/downloadRecords'

const props = defineProps<{ startDate: string; endDate: string; revision: number; appId: number | null; initialType?: 'FIRST' | 'RETURNING' | '' }>()
const downloadType = ref<'FIRST' | 'RETURNING' | ''>(props.initialType || '')
const form = reactive({ appId: props.appId ? String(props.appId) : '', device: '', email: '' })
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
  filters = { downloadType: downloadType.value || undefined, appId: appId ? Number(appId) : undefined, device: form.device.trim() || undefined, email: form.email.trim() || undefined, startDate: props.startDate, endDate: props.endDate }
  pageNum.value = 1
  void fetchRecords()
}
function reset() {
  downloadType.value = ''
  Object.assign(form, { appId: '', device: '', email: '' })
  search()
}
function changePage(page: number) { pageNum.value = page; void fetchRecords() }
function changeSize(size: number) { pageSize.value = size; pageNum.value = 1; void fetchRecords() }
watch(() => props.initialType, value => { downloadType.value = value || ''; search() })
watch(() => props.appId, value => { form.appId = value ? String(value) : ''; search() })
watch(() => [props.startDate, props.endDate, props.revision], search, { immediate: true })
</script>

<style scoped>
.download-records { min-width: 0; }
h2 { margin-top: 0; }
.description { color: var(--el-text-color-secondary); font-size: 13px; line-height: 1.7; }
.app-cell { display: flex; align-items: center; gap: 12px; padding: 2px 0; }
.app-details { min-width: 0; flex: 1; }
.app-heading { display: flex; align-items: center; gap: 8px; line-height: 22px; }
.app-name { color: var(--el-text-color-primary); font-size: 14px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.app-id { color: var(--el-text-color-secondary); font-size: 12px; flex-shrink: 0; }
.app-meta { display: flex; align-items: center; gap: 14px; font-size: 12px; line-height: 22px; color: var(--el-text-color-regular); }
.app-author { max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.app-meta strong { margin-left: 4px; color: var(--el-text-color-primary); font-variant-numeric: tabular-nums; }
.app-dates { display: flex; flex-wrap: wrap; gap: 0 14px; color: var(--el-text-color-secondary); font-size: 12px; line-height: 20px; font-variant-numeric: tabular-nums; }
.app-dates > span { white-space: nowrap; }
.store-button, .store-empty { flex-shrink: 0; }
.store-button { height: 20px; padding: 0 4px; font-size: 12px; color: var(--el-text-color-secondary); background: transparent; }
.store-button:hover, .store-button:focus-visible { color: var(--el-color-primary); background: var(--el-fill-color-light); }
.store-empty { color: var(--el-text-color-secondary); font-size: 12px; }
.app-image { width: 56px; height: 56px; flex-shrink: 0; border-radius: 8px; border: 1px solid var(--el-border-color-lighter); }
.image-placeholder { display: flex; align-items: center; justify-content: center; height: 56px; background: var(--el-fill-color-light); color: var(--el-text-color-secondary); font-size: 11px; }
.pagination { margin-top: 20px; overflow-x: auto; }
</style>
