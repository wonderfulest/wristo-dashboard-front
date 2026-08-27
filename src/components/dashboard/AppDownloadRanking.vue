<template>
  <div class="dashboard-content">
    <div class="section-heading">
      <h3 class="section-title">应用下载量 Top 排序</h3>
      <DashboardSectionFilter
        v-model="filter"
        :loading="loading"
        :show-app="false"
        @update:model-value="handleFilterChange"
      />
    </div>

    <div v-if="error" class="error-message">
      <p>获取应用下载量排行失败：{{ error }}</p>
    </div>

    <div class="table-scroll" role="region" aria-label="应用下载量排行榜，可横向滚动" tabindex="0">
      <el-table v-loading="loading" :data="items" border style="width: 100%" empty-text="No data">
        <el-table-column label="排名" width="90" align="center">
          <template #default="{ $index }">
            {{ (pageNum - 1) * pageSize + $index + 1 }}
          </template>
        </el-table-column>
        <el-table-column label="应用" min-width="240">
          <template #default="{ row }">
            <div class="app-cell">
              <img v-if="row.app?.garminImageUrl" :src="row.app.garminImageUrl" alt="" class="app-thumb" />
              <div class="app-info">
                <div class="app-name">{{ row.app?.name || 'App #' + row.appId }}</div>
                <div class="app-sub">ID: {{ row.appId }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="下载量" width="140" align="right">
          <template #default="{ row }">{{ Number(row.downloadCount || 0).toLocaleString() }}</template>
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
import { onMounted, ref } from 'vue'
import { getAppDownloadSummaryPage } from '@/api/purchase'
import type { AppDownloadSummaryVO, AppSalesSummaryPageQueryDTO } from '@/types/api'
import DashboardSectionFilter from './DashboardSectionFilter.vue'
import { buildDashboardRange } from './dashboardOverview.mjs'
import type { DashboardFilter } from './dashboardTypes'

const initialRange = buildDashboardRange('30d')
const filter = ref<DashboardFilter>({
  rangeType: '30d',
  startDate: initialRange.startDate,
  endDate: initialRange.endDate,
  appId: null,
})
const items = ref<AppDownloadSummaryVO[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)

const fetchPage = async () => {
  try {
    loading.value = true
    error.value = null
    const dto: AppSalesSummaryPageQueryDTO = {
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      startDate: filter.value.startDate,
      endDate: filter.value.endDate,
    }
    const res = await getAppDownloadSummaryPage(dto)
    if (res.code === 0 && res.data) {
      items.value = res.data.list || []
      total.value = res.data.total || 0
    } else {
      error.value = res.msg || 'Failed to fetch app download ranking'
    }
  } catch (e) {
    error.value = 'Network error occurred'
    console.error('Error fetching app download ranking:', e)
  } finally {
    loading.value = false
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

onMounted(fetchPage)
</script>

<style scoped>
.dashboard-content { margin-top: 32px; }
.section-heading { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.section-title { font-size: 18px; font-weight: 700; color: #212529; margin: 16px 0; text-align: left; }
.app-cell { display: flex; align-items: center; gap: 12px; }
.app-thumb { width: 40px; height: 40px; border-radius: 6px; object-fit: cover; border: 1px solid #e9ecef; }
.app-info { display: flex; flex-direction: column; }
.app-name { font-weight: 600; color: #212529; }
.app-sub { font-size: 12px; color: #6c757d; }
.table-footer { display: flex; justify-content: flex-end; padding: 12px 0; }
.error-message { background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 16px; margin: 24px 0; color: #721c24; }
@media (max-width: 768px) { .section-heading { align-items: stretch; flex-direction: column; } }
</style>
