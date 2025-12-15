<template>
  <div class="images-container">
    <div class="header">
      <h2>图片素材</h2>
      <div class="tools">
        <el-select v-model="usageType" placeholder="使用类型" clearable style="width: 180px" @change="handleSearch">
          <el-option label="全部" :value="undefined" />
          <el-option label="background" value="background" />
          <el-option label="app_daily" value="app_daily" />
          <el-option label="product" value="product" />
          <el-option label="other" value="other" />
        </el-select>
        <el-select v-model="sortOrder" placeholder="排序" style="width: 200px" @change="handleSearch">
          <el-option label="创建时间倒序" value="created_at desc" />
          <el-option label="创建时间升序" value="created_at asc" />
          <el-option label="大小倒序" value="size desc" />
          <el-option label="大小升序" value="size asc" />
        </el-select>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="fetchPage">刷新</el-button>
      </div>
    </div>

    <el-table :data="images" style="width: 100%" v-loading="loading">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column label="预览" width="120">
        <template #default="{ row }">
          <el-image v-if="row.url" :src="row.url" fit="cover" style="width: 80px; height: 80px" />
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="name" label="名称" min-width="160" />
      <el-table-column label="尺寸" width="140">
        <template #default="{ row }">
          <span v-if="row.width && row.height">{{ row.width }} × {{ row.height }}</span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="size" label="大小(MB)" width="120">
        <template #default="{ row }">
          <span v-if="row.size">{{ Number(row.size).toFixed(2) }}</span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="usageType" label="使用类型" width="140" />
      <el-table-column prop="createdAt" label="创建时间" min-width="180" />
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <div class="ops">
            <el-button size="small" @click="openUrl(row.url)" :disabled="!row.url">打开</el-button>
            <el-button size="small" @click="copyUrl(row.url)" :disabled="!row.url">复制链接</el-button>
          </div>
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
import type { ImageVO } from '@/types/image'
import { pageImages } from '@/api/image'

const images = ref<ImageVO[]>([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

const usageType = ref<string | undefined>(undefined)
const sortOrder = ref('created_at desc')

const fetchPage = async () => {
  loading.value = true
  try {
    const resp = (await pageImages({
      pageNum: currentPage.value,
      pageSize: pageSize.value,
      orderBy: sortOrder.value,
      usageType: usageType.value
    })) as unknown as ApiResponse<PageResponse<ImageVO>>
    images.value = resp.data?.list || []
    total.value = resp.data?.total || 0
  } catch (e) {
    ElMessage.error('获取图片列表失败')
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

const openUrl = (url?: string) => {
  if (!url) return
  window.open(url, '_blank')
}
const copyUrl = async (url?: string) => {
  if (!url) return
  try {
    await navigator.clipboard.writeText(url)
    ElMessage.success('已复制图片链接')
  } catch (e) {
    ElMessage.error('复制失败')
  }
}

onMounted(() => {
  fetchPage()
})
</script>

<style scoped>
.images-container { padding: 20px; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.tools { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
.ops { display: flex; gap: 8px; }
.pagination { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
