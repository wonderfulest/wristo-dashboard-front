<template>
  <div class="recent-online-container">
    <div class="header">
      <h2>最近上线</h2>
      <div class="filters">
        <el-select v-model="rangePreset" class="range-select" @change="handleRangePresetChange">
          <el-option label="近 7 天" value="last7" />
          <el-option label="近 30 天" value="last30" />
          <el-option label="近 90 天" value="last90" />
          <el-option label="全部上线记录" value="all" />
        </el-select>
        <el-input
          v-model="searchName"
          placeholder="按应用名称搜索"
          clearable
          class="name-input"
          @keyup.enter="handleSearch"
        />
        <el-select v-model="sortOrder" class="sort-select" @change="handleSearch">
          <el-option label="上线时间倒序" value="last_go_live:desc" />
          <el-option label="上线时间升序" value="last_go_live:asc" />
          <el-option label="下载量倒序" value="download:desc" />
          <el-option label="创建时间倒序" value="created_at:desc" />
        </el-select>
        <el-button type="primary" :loading="loading" @click="handleSearch">查询</el-button>
        <el-button :loading="loading" @click="fetchProducts">刷新</el-button>
      </div>
    </div>

    <el-alert
      class="tip"
      type="info"
      show-icon
      :closable="false"
      title="默认展示最近 30 天已上线应用。打开 Garmin 商店后可下载到设备或账号里检查最新功能。"
    />

    <ResponsiveTableShell mobile-mode="cards">
      <template #table>
        <el-table :data="products" v-loading="loading" style="width: 100%">
          <el-table-column prop="appId" label="App ID" width="90" />
          <el-table-column label="应用" min-width="320">
            <template #default="{ row }">
              <AppProductInfo
                :app-id="row.appId"
                :title="row.name"
                :design-id="row.designId"
                :image-url="row.garminImageUrl || row.heroFile?.url || ''"
                :store-url="row.garminStoreUrl"
                :thumb-size="52"
              />
            </template>
          </el-table-column>
          <el-table-column label="作者" width="120">
            <template #default="{ row }">{{ row.user?.username || '-' }}</template>
          </el-table-column>
          <el-table-column label="上线时间" width="170">
            <template #default="{ row }">{{ row.lastGoLive ? formatDateTime(row.lastGoLive) : '-' }}</template>
          </el-table-column>
          <el-table-column prop="download" label="下载量" width="100" />
          <el-table-column prop="purchase" label="购买量" width="100">
            <template #default="{ row }">{{ row.purchase ?? '-' }}</template>
          </el-table-column>
          <el-table-column prop="price" label="价格" width="90">
            <template #default="{ row }">${{ row.price }}</template>
          </el-table-column>
          <el-table-column label="检查入口" width="260" fixed="right">
            <template #default="{ row }">
              <div class="row-actions">
                <el-button type="primary" link :disabled="!row.garminStoreUrl" @click="openStore(row)">
                  打开商店
                </el-button>
                <el-button type="primary" link :disabled="!row.garminStoreUrl" @click="copyStoreUrl(row)">
                  复制链接
                </el-button>
                <el-button type="primary" link @click="copyAppMeta(row)">复制信息</el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </template>
      <template #mobile>
        <MobileRecordList :items="products" row-key="appId" :loading="loading" empty-text="暂无最近上线应用">
          <template #default="{ item: row }">
            <div class="product-mobile-card">
              <AppProductInfo
                :app-id="row.appId"
                :title="row.name"
                :design-id="row.designId"
                :image-url="row.garminImageUrl || row.heroFile?.url || ''"
                :store-url="row.garminStoreUrl"
                :thumb-size="52"
              />
              <div class="mobile-field-grid">
                <div class="mobile-field">
                  <div class="mobile-field-label">App ID</div>
                  <div class="mobile-field-value">{{ row.appId }}</div>
                </div>
                <div class="mobile-field">
                  <div class="mobile-field-label">上线时间</div>
                  <div class="mobile-field-value">{{ row.lastGoLive ? formatDateTime(row.lastGoLive) : '-' }}</div>
                </div>
                <div class="mobile-field">
                  <div class="mobile-field-label">下载 / 购买</div>
                  <div class="mobile-field-value">{{ row.download ?? 0 }} / {{ row.purchase ?? '-' }}</div>
                </div>
                <div class="mobile-field">
                  <div class="mobile-field-label">作者</div>
                  <div class="mobile-field-value">{{ row.user?.username || '-' }}</div>
                </div>
              </div>
            </div>
          </template>
          <template #actions="{ item: row }">
            <el-button size="small" type="primary" :disabled="!row.garminStoreUrl" @click="openStore(row)">
              商店
            </el-button>
            <el-button size="small" :disabled="!row.garminStoreUrl" @click="copyStoreUrl(row)">复制链接</el-button>
            <el-button size="small" @click="copyAppMeta(row)">复制信息</el-button>
          </template>
        </MobileRecordList>
      </template>
    </ResponsiveTableShell>

    <div class="pagination">
      <el-pagination
        v-model:current-page="pageNum"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchProductPage } from '@/api/products'
import type { Product } from '@/types/product'
import { formatDateTime } from '@/utils/date'
import AppProductInfo from '@/components/common/AppProductInfo.vue'
import MobileRecordList from '@/components/common/MobileRecordList.vue'
import ResponsiveTableShell from '@/components/common/ResponsiveTableShell.vue'

type RangePreset = 'last7' | 'last30' | 'last90' | 'all'

const products = ref<Product[]>([])
const loading = ref(false)
const pageNum = ref(1)
const pageSize = ref(20)
const total = ref(0)
const rangePreset = ref<RangePreset>('last30')
const searchName = ref('')
const sortOrder = ref('last_go_live:desc')

const formatDateForQuery = (date: Date) => {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

const buildLastGoLiveStart = () => {
  if (rangePreset.value === 'all') return undefined
  const days = rangePreset.value === 'last7' ? 7 : rangePreset.value === 'last90' ? 90 : 30
  const start = new Date()
  start.setDate(start.getDate() - days + 1)
  return `${formatDateForQuery(start)} 00:00:00`
}

const fetchProducts = async () => {
  loading.value = true
  try {
    const res = await fetchProductPage({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      orderBy: sortOrder.value,
      name: searchName.value || undefined,
      status: 1,
      populate: '*',
      lastGoLiveStart: buildLastGoLiveStart(),
      lastGoLiveEnd: rangePreset.value === 'all' ? undefined : `${formatDateForQuery(new Date())} 23:59:59`,
    })
    if (res.code === 0) {
      products.value = res.data?.list || []
      total.value = res.data?.total || 0
    } else {
      ElMessage.error(res.msg || '获取最近上线列表失败')
    }
  } catch {
    ElMessage.error('获取最近上线列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pageNum.value = 1
  fetchProducts()
}

const handleRangePresetChange = () => {
  handleSearch()
}

const handleSizeChange = (value: number) => {
  pageSize.value = value
  pageNum.value = 1
  fetchProducts()
}

const handleCurrentChange = (value: number) => {
  pageNum.value = value
  fetchProducts()
}

const copyText = async (text: string, successMessage: string) => {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success(successMessage)
  } catch {
    ElMessage.error('复制失败')
  }
}

const openStore = (row: Product) => {
  if (!row.garminStoreUrl) return
  window.open(row.garminStoreUrl, '_blank')
}

const copyStoreUrl = (row: Product) => {
  if (!row.garminStoreUrl) return
  copyText(row.garminStoreUrl, '已复制商店链接')
}

const copyAppMeta = (row: Product) => {
  const lines = [
    `Name: ${row.name || '-'}`,
    `App ID: ${row.appId}`,
    `Design ID: ${row.designId || '-'}`,
    `Last go live: ${row.lastGoLive ? formatDateTime(row.lastGoLive) : '-'}`,
    `Store URL: ${row.garminStoreUrl || '-'}`,
  ]
  copyText(lines.join('\n'), '已复制应用信息')
}

onMounted(fetchProducts)
</script>

<style scoped>
.recent-online-container {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
}

.header h2 {
  margin: 0;
  line-height: 32px;
  white-space: nowrap;
}

.filters {
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.range-select {
  width: 132px;
}

.name-input {
  width: 180px;
}

.sort-select {
  width: 140px;
}

.tip {
  margin-bottom: 16px;
}

.row-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.product-mobile-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

@media (max-width: 900px) {
  .header {
    flex-direction: column;
  }

  .filters {
    justify-content: flex-start;
    width: 100%;
  }
}

@media (max-width: 768px) {
  .recent-online-container {
    padding: 0;
  }
}
</style>
