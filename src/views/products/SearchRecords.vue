<template>
  <div class="search-records-container">
    <div class="header">
      <h2>用户搜索记录</h2>
      <div class="filters">
        <el-input
          v-model="keyword"
          placeholder="关键词"
          clearable
          style="width: 220px"
          @keyup.enter.native="handleSearch"
        />
        <el-input
          v-model="userId"
          placeholder="用户ID"
          clearable
          style="width: 160px"
          @keyup.enter.native="handleSearch"
        />
        <el-input
          v-model="deviceId"
          placeholder="设备ID"
          clearable
          style="width: 160px"
          @keyup.enter.native="handleSearch"
        />
        <el-input
          v-model="ip"
          placeholder="IP"
          clearable
          style="width: 180px"
          @keyup.enter.native="handleSearch"
        />
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>
    </div>

    <el-table :data="pageData.list" style="width: 100%" v-loading="loading">
      <el-table-column prop="id" label="ID" width="90" />
      <el-table-column prop="keyword" label="关键词" min-width="180" show-overflow-tooltip />
      <el-table-column prop="userId" label="用户ID" width="110" />
      <el-table-column prop="deviceId" label="设备ID" width="110" />
      <el-table-column prop="ip" label="IP" width="140" />
      <el-table-column prop="resultCount" label="结果数" width="90" />
      <el-table-column prop="userAgent" label="UA" min-width="220" show-overflow-tooltip />
      <el-table-column prop="createdAt" label="时间" width="170">
        <template #default="{ row }">
          {{ fmtDate(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click="openDetail(row)">详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="pageData.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <el-dialog v-model="detailVisible" title="搜索记录详情" width="720px">
      <div v-loading="detailLoading">
        <el-descriptions v-if="detailData" :column="2" border>
          <el-descriptions-item label="ID">{{ detailData.id }}</el-descriptions-item>
          <el-descriptions-item label="关键词">{{ detailData.keyword || '—' }}</el-descriptions-item>
          <el-descriptions-item label="用户ID">{{ detailData.userId ?? '—' }}</el-descriptions-item>
          <el-descriptions-item label="设备ID">{{ detailData.deviceId ?? '—' }}</el-descriptions-item>
          <el-descriptions-item label="IP">{{ detailData.ip || '—' }}</el-descriptions-item>
          <el-descriptions-item label="结果数">{{ detailData.resultCount ?? '—' }}</el-descriptions-item>
          <el-descriptions-item label="时间">{{ fmtDate(detailData.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="UA" :span="2">{{ detailData.userAgent || '—' }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import type { PageResponse } from '@/types/api'
import type { SearchRecordVO, SearchRecordPageRequest } from '@/types/search-record'
import { fetchSearchRecordPage, getSearchRecordById } from '@/api/search-record'

const loading = ref(false)

const keyword = ref('')
const userId = ref('')
const deviceId = ref('')
const ip = ref('')

const currentPage = ref(1)
const pageSize = ref(20)

const pageData = reactive<PageResponse<SearchRecordVO>>({
  pageNum: 1,
  pageSize: 20,
  total: 0,
  pages: 0,
  list: []
})

const fmtDate = (v?: string | null) => {
  if (!v) return '—'
  const d = new Date(v)
  return isNaN(d.getTime()) ? '—' : d.toLocaleString('zh-CN')
}

const parseNullableNumber = (v: string): number | null => {
  const s = v.trim()
  if (!s) return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

const buildDto = (pageNum: number): SearchRecordPageRequest => {
  const uid = parseNullableNumber(userId.value)
  const did = parseNullableNumber(deviceId.value)
  return {
    pageNum,
    pageSize: pageSize.value,
    keyword: keyword.value.trim() ? keyword.value.trim() : null,
    userId: uid,
    deviceId: did,
    ip: ip.value.trim() ? ip.value.trim() : null
  }
}

const load = async (pageNum = 1) => {
  try {
    loading.value = true
    const dto = buildDto(pageNum)
    const res = await fetchSearchRecordPage(dto)
    if (res.code === 0 && res.data) {
      pageData.pageNum = res.data.pageNum
      pageData.pageSize = res.data.pageSize
      pageData.total = res.data.total
      pageData.pages = res.data.pages
      pageData.list = res.data.list
      currentPage.value = res.data.pageNum
      pageSize.value = res.data.pageSize
    } else {
      pageData.list = []
      pageData.total = 0
      pageData.pages = 0
    }
  } catch {
    pageData.list = []
    pageData.total = 0
    pageData.pages = 0
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  load(1)
}

const handleReset = () => {
  keyword.value = ''
  userId.value = ''
  deviceId.value = ''
  ip.value = ''
  currentPage.value = 1
  load(1)
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  load(1)
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
  load(page)
}

const detailVisible = ref(false)
const detailLoading = ref(false)
const detailData = ref<SearchRecordVO | null>(null)

const openDetail = async (row: SearchRecordVO) => {
  try {
    detailVisible.value = true
    detailLoading.value = true
    detailData.value = null
    const res = await getSearchRecordById(row.id)
    if (res.code === 0 && res.data) {
      detailData.value = res.data
    }
  } catch (e: any) {
    ElMessage.error(e?.msg || e?.message || '加载详情失败')
  } finally {
    detailLoading.value = false
  }
}

onMounted(() => load(1))
</script>

<style scoped lang="scss">
.search-records-container {
  padding: 24px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.header {
  margin-bottom: 16px;

  h2 {
    margin: 0 0 10px;
    font-size: 20px;
    font-weight: 600;
  }
}

.filters {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
