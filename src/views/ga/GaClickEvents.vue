<template>
  <div class="ga-click-events-page">
    <div class="page-header">
      <h2>GA 点击事件</h2>
    </div>

    <div class="filters">
      <el-input
        v-model="filters.shortCode"
        placeholder="短链编码 shortCode"
        clearable
        style="width: 200px; margin-right: 12px;"
        @keyup.enter.native="handleSearch"
      />
      <el-input
        v-model="filters.country"
        placeholder="国家 (country)"
        clearable
        style="width: 160px; margin-right: 12px;"
        @keyup.enter.native="handleSearch"
      />
      <el-select
        v-model="filters.deviceType"
        clearable
        placeholder="设备类型"
        style="width: 160px; margin-right: 12px;"
      >
        <el-option label="Desktop" value="DESKTOP" />
        <el-option label="Mobile" value="MOBILE" />
        <el-option label="Tablet" value="TABLET" />
        <el-option label="Other" value="OTHER" />
      </el-select>
      <el-input
        v-model="filters.utmSource"
        placeholder="utm_source"
        clearable
        style="width: 160px; margin-right: 12px;"
        @keyup.enter.native="handleSearch"
      />
      <el-input
        v-model="filters.utmCampaign"
        placeholder="utm_campaign"
        clearable
        style="width: 160px; margin-right: 12px;"
        @keyup.enter.native="handleSearch"
      />
      <el-date-picker
        v-model="clickedAtRange"
        type="datetimerange"
        range-separator="至"
        start-placeholder="点击时间起"
        end-placeholder="点击时间止"
        value-format="YYYY-MM-DD HH:mm:ss"
        style="margin-right: 12px;"
      />
      <el-button type="primary" @click="handleSearch">查询</el-button>
      <el-button @click="handleReset">重置</el-button>
    </div>

    <el-table :data="list" style="width: 100%" v-loading="loading">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="shortCode" label="短链编码" width="140" />
      <el-table-column prop="clickedAt" label="点击时间" min-width="180">
        <template #default="{ row }">{{ formatDateTime(row.clickedAt) }}</template>
      </el-table-column>
      <el-table-column prop="deviceType" label="设备" width="110" />
      <el-table-column prop="os" label="OS" width="120" />
      <el-table-column prop="browser" label="浏览器" width="140" />
      <el-table-column prop="country" label="国家" width="100" />
      <el-table-column prop="city" label="城市" width="120" />
      <el-table-column label="UTM" min-width="220">
        <template #default="{ row }">
          <div>source: {{ row.utmSource || '-' }}</div>
          <div>medium: {{ row.utmMedium || '-' }}</div>
          <div>campaign: {{ row.utmCampaign || '-' }}</div>
        </template>
      </el-table-column>
      <el-table-column label="关联短链" min-width="260">
        <template #default="{ row }">
          <div v-if="row.shortLink">
            <div>名称：{{ row.shortLink.name }}</div>
            <div class="long-url" :title="row.shortLink.longUrl">{{ row.shortLink.longUrl }}</div>
          </div>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="openDetail(row.id)">详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-bar">
      <el-pagination
        background
        layout="total, sizes, prev, pager, next, jumper"
        :current-page="query.pageNum"
        :page-size="query.pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </div>

    <el-drawer v-model="detail.visible" title="点击事件详情" size="50%" :with-header="true">
      <div v-loading="detail.loading">
        <el-descriptions v-if="detail.data" :column="2" border>
          <el-descriptions-item label="ID">{{ detail.data.id }}</el-descriptions-item>
          <el-descriptions-item label="短链编码">{{ detail.data.shortCode }}</el-descriptions-item>
          <el-descriptions-item label="点击时间">{{ formatDateTime(detail.data.clickedAt) }}</el-descriptions-item>
          <el-descriptions-item label="设备类型">{{ detail.data.deviceType }}</el-descriptions-item>
          <el-descriptions-item label="OS">{{ detail.data.os }}</el-descriptions-item>
          <el-descriptions-item label="浏览器">{{ detail.data.browser }}</el-descriptions-item>
          <el-descriptions-item label="IP">{{ detail.data.ip }}</el-descriptions-item>
          <el-descriptions-item label="国家/地区">{{ detail.data.country }} {{ detail.data.region }}</el-descriptions-item>
          <el-descriptions-item label="城市">{{ detail.data.city }}</el-descriptions-item>
          <el-descriptions-item label="Referer" :span="2">{{ detail.data.referer }}</el-descriptions-item>
          <el-descriptions-item label="User-Agent" :span="2">{{ detail.data.userAgent }}</el-descriptions-item>
          <el-descriptions-item label="UTM" :span="2">
            source={{ detail.data.utmSource || '-' }},
            medium={{ detail.data.utmMedium || '-' }},
            campaign={{ detail.data.utmCampaign || '-' }},
            content={{ detail.data.utmContent || '-' }},
            term={{ detail.data.utmTerm || '-' }}
          </el-descriptions-item>
        </el-descriptions>

        <template v-if="detail.data?.shortLink">
          <h3 style="margin-top: 16px;">关联短链</h3>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="ID">{{ detail.data.shortLink.id }}</el-descriptions-item>
            <el-descriptions-item label="名称">{{ detail.data.shortLink.name }}</el-descriptions-item>
            <el-descriptions-item label="短链编码">{{ detail.data.shortLink.shortCode }}</el-descriptions-item>
            <el-descriptions-item label="目标链接" :span="2">
              <span class="long-url" :title="detail.data.shortLink.longUrl">{{ detail.data.shortLink.longUrl }}</span>
            </el-descriptions-item>
          </el-descriptions>
        </template>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { pageGaClickEvents, getGaClickEventDetail, type GaClickEventVO } from '@/api/gaClickEvent'
import { formatDateTime } from '@/utils/date'

const loading = ref(false)
const list = ref<GaClickEventVO[]>([])
const total = ref(0)

const query = reactive({
  pageNum: 1,
  pageSize: 20
})

const filters = reactive({
  shortCode: '',
  country: '',
  deviceType: '',
  utmSource: '',
  utmCampaign: ''
})

const clickedAtRange = ref<[string, string] | null>(null)

const detail = reactive<{
  visible: boolean
  loading: boolean
  data: GaClickEventVO | null
}>({
  visible: false,
  loading: false,
  data: null
})

const fetchPage = async () => {
  loading.value = true
  try {
    const payload: any = {
      pageNum: query.pageNum,
      pageSize: query.pageSize,
      shortCode: filters.shortCode?.trim() || undefined,
      country: filters.country?.trim() || undefined,
      deviceType: filters.deviceType || undefined,
      utmSource: filters.utmSource?.trim() || undefined,
      utmCampaign: filters.utmCampaign?.trim() || undefined
    }
    if (clickedAtRange.value && clickedAtRange.value.length === 2) {
      payload.clickedAtStart = clickedAtRange.value[0]
      payload.clickedAtEnd = clickedAtRange.value[1]
    }
    const res = await pageGaClickEvents(payload, 'shortLink')
    if (res.code === 0 && res.data) {
      list.value = res.data.list
      total.value = res.data.total
    } else {
      ElMessage.error(res.msg || '获取点击事件失败')
    }
  } catch (e) {
    ElMessage.error('获取点击事件失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  query.pageNum = 1
  fetchPage()
}

const handleReset = () => {
  filters.shortCode = ''
  filters.country = ''
  filters.deviceType = ''
  filters.utmSource = ''
  filters.utmCampaign = ''
  clickedAtRange.value = null
  query.pageNum = 1
  fetchPage()
}

const handlePageChange = (page: number) => {
  query.pageNum = page
  fetchPage()
}

const handleSizeChange = (size: number) => {
  query.pageSize = size
  query.pageNum = 1
  fetchPage()
}

const openDetail = async (id: number) => {
  detail.visible = true
  detail.loading = true
  detail.data = null
  try {
    const res = await getGaClickEventDetail(id, 'shortLink')
    if (res.code === 0 && res.data) {
      detail.data = res.data
    } else {
      ElMessage.error(res.msg || '获取详情失败')
    }
  } catch (e) {
    ElMessage.error('获取详情失败')
  } finally {
    detail.loading = false
  }
}

onMounted(() => {
  fetchPage()
})
</script>

<style scoped>
.ga-click-events-page {
  padding: 16px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.filters {
  margin-bottom: 16px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.pagination-bar {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}

.long-url {
  display: inline-block;
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
