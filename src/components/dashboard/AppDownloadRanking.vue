<template>
  <div class="dashboard-content">
    <div class="section-heading">
      <h3 class="section-title">应用下载排行</h3>

    </div>

    <div v-if="error" class="error-message">
      <p>获取应用下载量排行失败：{{ error }}</p>
    </div>

    <div class="table-scroll" role="region" aria-label="应用下载量排行榜，可横向滚动" tabindex="0">
      <el-table v-loading="loading" :data="items" border style="width: 100%" empty-text="暂无下载数据">
        <el-table-column label="排名" width="72" align="center">
          <template #default="{ $index }">
            {{ (pageNum - 1) * pageSize + $index + 1 }}
          </template>
        </el-table-column>
        <el-table-column label="应用" width="320">
          <template #default="{ row }">
            <div class="app-cell">
              <a class="app-link" :href="row.app?.garminStoreUrl" target="_blank" rel="noopener noreferrer">
              <img
                v-if="row.app?.garminImageUrl"
                :src="row.app.garminImageUrl"
                :alt="row.app?.name || `App #${row.appId}`"
                class="app-thumb"
              />
              </a>
              <div class="app-info">
                <el-button link type="primary" class="app-name" @click="emit('view-records', row.appId)">{{ row.app?.name || 'App #' + row.appId }}</el-button>
                <div class="app-sub">ID: {{ row.appId }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="全部上报" width="140" align="right">
          <template #default="{ row }">{{ Number(row.downloadCount || 0).toLocaleString() }}</template>
        </el-table-column>
        <el-table-column label="首次下载" width="140" align="right"><template #default="{ row }"><el-button link type="primary" @click="emit('view-records', row.appId, 'FIRST')">{{ Number(row.firstDownloadCount || 0).toLocaleString() }}</el-button></template></el-table-column>
        <el-table-column label="历史重新上报" width="150" align="right"><template #default="{ row }"><el-button link type="primary" @click="emit('view-records', row.appId, 'RETURNING')">{{ Number(row.repeatDownloadCount || 0).toLocaleString() }}</el-button></template></el-table-column>
        <el-table-column label="回流占比" width="110" align="right"><template #default="{ row }">{{ row.downloadCount ? (row.repeatDownloadCount / row.downloadCount * 100).toFixed(1) + '%' : '—' }}</template></el-table-column>
        <el-table-column label="操作" width="120" align="center">
          <template #default="{ row }"><el-button link type="primary" @click="emit('view-records', row.appId)">查看明细</el-button></template>
        </el-table-column>
      </el-table>
    </div>

    <div class="table-footer">
      <el-pagination
        background
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        :page-size="pageSize"
        :current-page="pageNum"
        :page-sizes="[10, 20, 50]"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { getAppDownloadSummaryPage } from '@/api/purchase'
import type { AppDownloadSummaryVO, AppSalesSummaryPageQueryDTO } from '@/types/api'
import type { DashboardFilter } from './dashboardTypes'

const props = defineProps<{ filter: DashboardFilter; revision: number }>()
const emit = defineEmits<{ (event: 'view-records', appId: number, type?: 'FIRST' | 'RETURNING'): void }>()
let requestId = 0
const items = ref<AppDownloadSummaryVO[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)

const fetchPage = async () => {
  const id = ++requestId
  try {
    loading.value = true
    error.value = null
    const dto: AppSalesSummaryPageQueryDTO = {
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      startDate: props.filter.startDate,
      endDate: props.filter.endDate,
    }
    const res = await getAppDownloadSummaryPage(dto)
    if (id !== requestId) return
    if (res.code === 0 && res.data) {
      if ((res.data.list || []).some(row => row.firstDownloadCount == null || row.repeatDownloadCount == null)) throw new Error('下载分类接口尚未就绪')
      items.value = res.data.list || []
      total.value = res.data.total || 0
    } else {
      items.value = []; total.value = 0
      error.value = res.msg || 'Failed to fetch app download ranking'
    }
  } catch (e) {
    if (id !== requestId) return
    items.value = []; total.value = 0
    error.value = e instanceof Error ? e.message : '网络请求失败，请重试'
    console.error('Error fetching app download ranking:', e)
  } finally {
    if (id === requestId) loading.value = false
  }
}

const handleFilterChange = () => {
  pageNum.value = 1
  fetchPage()
}
const handlePageChange = (page: number) => {
  pageNum.value = page
  fetchPage()
}
const handleSizeChange = (size: number) => {
  pageSize.value = size
  pageNum.value = 1
  fetchPage()
}

watch(() => [props.filter.startDate, props.filter.endDate, props.revision], handleFilterChange, { immediate: true })
</script>

<style scoped>
.dashboard-content { margin-top: 32px; }
.section-heading { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.section-title { font-size: 18px; font-weight: 700; color: #212529; margin: 16px 0; text-align: left; }
.app-cell { display: flex; align-items: center; gap: 12px; }
.app-link { color: inherit; text-decoration: none; }
.app-thumb { width: 40px; height: 40px; border-radius: 6px; object-fit: cover; border: 1px solid #e9ecef; transition: transform 0.2s ease, box-shadow 0.2s ease; transform-origin: center; }
.app-link:hover .app-thumb { transform: scale(1.35); box-shadow: 0 6px 18px rgba(0, 0, 0, 0.2); }
.app-link:hover .app-name { color: var(--el-color-primary); }
.app-info { display: flex; flex-direction: column; }
.app-name { font-weight: 600; color: #212529; }
.app-sub { font-size: 12px; color: #6c757d; }
.table-footer { display: flex; justify-content: flex-end; padding: 12px 0; }
.error-message { background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 16px; margin: 24px 0; color: #721c24; }
@media (max-width: 768px) { .section-heading { align-items: stretch; flex-direction: column; } }
</style>
