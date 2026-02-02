<template>
  <div class="product-keyword-scores-container">
    <div class="header">
      <h2>评分表</h2>

      <div class="filters">
        <el-input
          v-model="keyword"
          placeholder="关键词"
          clearable
          style="width: 220px"
          @keyup.enter.native="handleSearch"
        />

        <el-input
          v-model="statDate"
          placeholder="统计日期（YYYY-MM-DD）"
          clearable
          style="width: 220px"
          @keyup.enter.native="handleSearch"
        />

        <el-input
          v-model="minScore"
          placeholder="最低评分"
          clearable
          style="width: 160px"
          @keyup.enter.native="handleSearch"
        />

        <el-input
          v-model="suggestion"
          placeholder="建议（模糊匹配）"
          clearable
          style="width: 220px"
          @keyup.enter.native="handleSearch"
        />

        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>
    </div>

    <el-table :data="pageData.list" style="width: 100%" v-loading="loading">
      <el-table-column prop="id" label="ID" width="90" />
      <el-table-column prop="productKeyword" label="关键词" min-width="220" show-overflow-tooltip />
      <el-table-column prop="productScore" label="评分" width="100" />
      <el-table-column prop="searchTimes" label="搜索次数" width="100" />
      <el-table-column prop="userCnt" label="用户数" width="90" />
      <el-table-column prop="avgResults" label="平均结果" width="100" />
      <el-table-column prop="zeroResultTimes" label="零结果次数" width="110" />
      <el-table-column prop="statDate" label="统计日期" width="170">
        <template #default="{ row }">{{ fmtDate(row.statDate) }}</template>
      </el-table-column>
      <el-table-column prop="createdTime" label="创建时间" width="170">
        <template #default="{ row }">{{ fmtDate(row.createdTime) }}</template>
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

    <el-dialog v-model="detailVisible" title="评分详情" width="720px">
      <div v-loading="detailLoading">
        <el-descriptions v-if="detailData" :column="2" border>
          <el-descriptions-item label="ID">{{ detailData.id }}</el-descriptions-item>
          <el-descriptions-item label="关键词" :span="2">{{ detailData.productKeyword || '—' }}</el-descriptions-item>
          <el-descriptions-item label="评分">{{ detailData.productScore ?? '—' }}</el-descriptions-item>
          <el-descriptions-item label="搜索次数">{{ detailData.searchTimes ?? '—' }}</el-descriptions-item>
          <el-descriptions-item label="用户数">{{ detailData.userCnt ?? '—' }}</el-descriptions-item>
          <el-descriptions-item label="平均结果">{{ detailData.avgResults ?? '—' }}</el-descriptions-item>
          <el-descriptions-item label="零结果次数">{{ detailData.zeroResultTimes ?? '—' }}</el-descriptions-item>
          <el-descriptions-item label="统计日期">{{ fmtDate(detailData.statDate) }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ fmtDate(detailData.createdTime) }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { PageResponse } from '@/types/api'
import type { ProductKeywordScoreVO, ProductKeywordScorePageRequest } from '@/types/product-keyword-score'
import { fetchProductKeywordScorePage, getProductKeywordScoreById } from '@/api/product-keyword-score'

const loading = ref(false)

const keyword = ref('')
const statDate = ref('')
const minScore = ref('')
const suggestion = ref('')

const currentPage = ref(1)
const pageSize = ref(20)

const pageData = reactive<PageResponse<ProductKeywordScoreVO>>({
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

const buildDto = (pageNum: number): ProductKeywordScorePageRequest => {
  return {
    pageNum,
    pageSize: pageSize.value,
    keyword: keyword.value.trim() ? keyword.value.trim() : null,
    statDate: statDate.value.trim() ? statDate.value.trim() : null,
    minScore: parseNullableNumber(minScore.value),
    suggestion: suggestion.value.trim() ? suggestion.value.trim() : null,
  }
}

const load = async (pageNum = 1) => {
  try {
    loading.value = true
    const res = await fetchProductKeywordScorePage(buildDto(pageNum))
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
  statDate.value = ''
  minScore.value = ''
  suggestion.value = ''
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
const detailData = ref<ProductKeywordScoreVO | null>(null)

const openDetail = async (row: ProductKeywordScoreVO) => {
  try {
    detailVisible.value = true
    detailLoading.value = true
    detailData.value = null
    const res = await getProductKeywordScoreById(row.id)
    if (res.code === 0 && res.data) detailData.value = res.data
  } catch (e: any) {
    ElMessage.error(e?.msg || e?.message || '加载详情失败')
  } finally {
    detailLoading.value = false
  }
}

onMounted(() => load(1))
</script>

<style scoped lang="scss">
.product-keyword-scores-container {
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
