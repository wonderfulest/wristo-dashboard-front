<template>
  <div class="font-glyph-review-container">
    <div class="header">
      <h2>字体资源审核</h2>
      <div class="tools">
        <el-input
          v-model="keyword"
          placeholder="按 glyphCode / 样式 关键词搜索"
          clearable
          style="width: 240px"
          @keyup.enter.native="handleSearch"
        />
        <el-select v-model="fontType" placeholder="字体类型" clearable style="width: 180px">
          <el-option label="全部" :value="undefined" />
          <el-option label="系统字体" value="system" />
          <el-option label="自定义字体" value="custom" />
        </el-select>
        <el-select v-model="active" placeholder="启用状态" clearable style="width: 160px">
          <el-option label="全部" :value="undefined" />
          <el-option label="启用" :value="1" />
          <el-option label="禁用" :value="0" />
        </el-select>
        <el-select v-model="isDefault" placeholder="默认字形" clearable style="width: 160px">
          <el-option label="全部" :value="undefined" />
          <el-option label="是" :value="1" />
          <el-option label="否" :value="0" />
        </el-select>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="fetchPage">刷新</el-button>
      </div>
    </div>

    <el-table :data="rows" v-loading="loading" border style="width: 100%">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="glyphCode" label="glyphCode" min-width="180" />
      <el-table-column prop="user.username" label="作者" min-width="140">
        <template #default="{ row }">
          {{ row.user?.nickname || row.user?.username || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="fontType" label="字体类型" width="120" />
      <el-table-column prop="version" label="版本" width="100" />
      <el-table-column prop="isDefault" label="默认" width="100">
        <template #default="{ row }">
          <el-tag size="small" :type="row.isDefault === 1 ? 'success' : 'info'">{{ row.isDefault === 1 ? '是' : '否' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="isActive" label="启用" width="100">
        <template #default="{ row }">
          <el-tag size="small" :type="row.isActive === 1 ? 'success' : 'info'">{{ row.isActive === 1 ? '是' : '否' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="120">
        <template #default="{ row }">
          <el-tag size="small" :type="statusTagType(row.status)">{{ row.status || '-' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="140" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" size="small" @click="handleDownloadMaterial(row)">下载素材</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination">
      <el-pagination
        v-model:current-page="currentPage"
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
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import type { ApiResponse, PageResponse } from '@/types/api'
import type { FontGlyphVO, FontGlyphPageQueryDTO } from '@/types/font-glyph'
import { pageFontGlyph } from '@/api/font-glyph'

const rows = ref<FontGlyphVO[]>([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

const keyword = ref<string | undefined>(undefined)
const fontType = ref<string | undefined>(undefined)
const active = ref<number | undefined>(undefined)
const isDefault = ref<number | undefined>(undefined)

const statusTagType = (status?: string) => {
  if (!status) return 'info'
  const s = status.toLowerCase()
  if (s.includes('approve')) return 'success'
  if (s.includes('reject')) return 'danger'
  if (s.includes('pending') || s.includes('submit')) return 'warning'
  return 'info'
}

const fetchPage = async () => {
  loading.value = true
  try {
    const dto: FontGlyphPageQueryDTO = {
      pageNum: currentPage.value,
      pageSize: pageSize.value,
      keyword: keyword.value,
      fontType: fontType.value,
      active: active.value,
      isDefault: isDefault.value
    }
    const resp = (await pageFontGlyph(dto)) as unknown as ApiResponse<PageResponse<FontGlyphVO>>
    rows.value = resp.data?.list || []
    total.value = resp.data?.total || 0
  } catch (e) {
    ElMessage.error('获取字体资源列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  fetchPage()
}

const handleSizeChange = (val: number) => {
  pageSize.value = val
  fetchPage()
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
  fetchPage()
}

const handleDownloadMaterial = (row: FontGlyphVO) => {
  const url = row.fontFile?.url
  if (!url) {
    ElMessage.warning('暂无素材文件')
    return
  }
  const link = document.createElement('a')
  link.href = url
  link.target = '_blank'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

onMounted(() => {
  fetchPage()
})
</script>

<style scoped>
.font-glyph-review-container { padding: 20px; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.tools { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
.pagination { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
