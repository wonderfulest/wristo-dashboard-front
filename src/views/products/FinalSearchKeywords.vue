<template>
  <div class="final-search-keywords-container">
    <div class="header">
      <h2>结果词</h2>

      <div class="filters">
        <el-input
          v-model="keyword"
          placeholder="关键词"
          clearable
          style="width: 220px"
          @keyup.enter.native="handleSearch"
        />

        <el-select v-model="isFinalKeyword" placeholder="是否最终词" clearable style="width: 160px" @change="handleSearch">
          <el-option label="是" :value="1" />
          <el-option label="否" :value="0" />
        </el-select>

        <el-input
          v-model="userId"
          placeholder="用户ID"
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
      <el-table-column prop="normalizedKeyword" label="规范化关键词" min-width="180" show-overflow-tooltip />
      <el-table-column prop="isFinalKeyword" label="最终词" width="90">
        <template #default="{ row }">
          <el-tag :type="row.isFinalKeyword === 1 ? 'success' : 'info'">
            {{ row.isFinalKeyword === 1 ? '是' : '否' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="resultCount" label="结果数" width="90" />
      <el-table-column prop="userId" label="用户ID" width="110" />
      <el-table-column prop="ip" label="IP" width="140" />
      <el-table-column prop="searchRecordId" label="SearchRecordID" width="130" />
      <el-table-column prop="createdAt" label="createdAt" width="170">
        <template #default="{ row }">{{ fmtDate(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column prop="createdTime" label="createdTime" width="170">
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

    <el-dialog v-model="detailVisible" title="结果词详情" width="720px">
      <div v-loading="detailLoading">
        <el-descriptions v-if="detailData" :column="2" border>
          <el-descriptions-item label="ID">{{ detailData.id }}</el-descriptions-item>
          <el-descriptions-item label="SearchRecordID">{{ detailData.searchRecordId ?? '—' }}</el-descriptions-item>
          <el-descriptions-item label="用户ID">{{ detailData.userId ?? '—' }}</el-descriptions-item>
          <el-descriptions-item label="IP">{{ detailData.ip || '—' }}</el-descriptions-item>
          <el-descriptions-item label="规范化关键词" :span="2">{{ detailData.normalizedKeyword || '—' }}</el-descriptions-item>
          <el-descriptions-item label="结果数">{{ detailData.resultCount ?? '—' }}</el-descriptions-item>
          <el-descriptions-item label="最终词">{{ detailData.isFinalKeyword === 1 ? '是' : '否' }}</el-descriptions-item>
          <el-descriptions-item label="createdAt">{{ fmtDate(detailData.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="createdTime">{{ fmtDate(detailData.createdTime) }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { PageResponse } from '@/types/api'
import type { FinalSearchKeywordVO, FinalSearchKeywordPageRequest } from '@/types/final-search-keyword'
import { fetchFinalSearchKeywordPage, getFinalSearchKeywordById } from '@/api/final-search-keyword'

const loading = ref(false)

const keyword = ref('')
const isFinalKeyword = ref<number | undefined>(undefined)
const userId = ref('')
const ip = ref('')

const currentPage = ref(1)
const pageSize = ref(20)

const pageData = reactive<PageResponse<FinalSearchKeywordVO>>({
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

const buildDto = (pageNum: number): FinalSearchKeywordPageRequest => {
  const uid = parseNullableNumber(userId.value)
  return {
    pageNum,
    pageSize: pageSize.value,
    keyword: keyword.value.trim() ? keyword.value.trim() : null,
    isFinalKeyword: typeof isFinalKeyword.value === 'number' ? isFinalKeyword.value : null,
    userId: uid,
    ip: ip.value.trim() ? ip.value.trim() : null,
  }
}

const load = async (pageNum = 1) => {
  try {
    loading.value = true
    const dto: FinalSearchKeywordPageRequest = buildDto(pageNum)
    const res = await fetchFinalSearchKeywordPage(dto)
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
  isFinalKeyword.value = undefined
  userId.value = ''
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
const detailData = ref<FinalSearchKeywordVO | null>(null)

const openDetail = async (row: FinalSearchKeywordVO) => {
  try {
    detailVisible.value = true
    detailLoading.value = true
    detailData.value = null
    const res = await getFinalSearchKeywordById(row.id)
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
.final-search-keywords-container {
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

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
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
