<template>
  <div class="packaging-logs-container">
    <div class="header">
      <h2>打包记录管理</h2>
      <div style="display: flex; gap: 12px; align-items: center;">
        <el-input
          v-model="searchProductId"
          placeholder="按产品ID搜索"
          clearable
          style="width: 200px"
          @keyup.enter.native="handleSearch"
        />
        <el-select v-model="searchStatus" placeholder="选择打包状态（可多选）" style="width: 200px" multiple clearable collapse-tags>
          <el-option 
            v-for="option in getPackagingStatusOptions()" 
            :key="option.value" 
            :label="option.label" 
            :value="option.value" 
          />
        </el-select>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>
    </div>

    <el-table :data="packagingLogs" style="width: 100%" v-loading="loading">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column label="产品信息" min-width="200">
        <template #default="{ row }">
          <div class="product-info">
            <div class="product-name">{{ row.product.name }}</div>
            <div class="product-details">
              <span>ID: {{ row.product.appId }}</span>
              <span>设计ID: {{ row.product.designId }}</span>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="打包状态" width="120">
        <template #default="{ row }">
          <StatusTag :status="row.packagingStatus" />
        </template>
      </el-table-column>
      <el-table-column label="错误信息" min-width="200">
        <template #default="{ row }">
          <el-tooltip v-if="row.errorMessage" :content="row.errorMessage" placement="top">
            <span class="error-message">{{ row.errorMessage }}</span>
          </el-tooltip>
          <span v-else class="no-error">-</span>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" width="180">
        <template #default="{ row }">
          {{ formatDateTime(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="更新时间" width="180">
        <template #default="{ row }">
          {{ formatDateTime(row.updatedAt) }}
        </template>
      </el-table-column>
      <el-table-column label="版本" width="80">
        <template #default="{ row }">
          {{ row.version }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <div style="display: flex; gap: 8px;">
            <el-button type="primary" link @click="handleViewDetails(row)">查看详情</el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
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

    <!-- 详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="打包记录详情"
      width="600px"
    >
      <div v-if="selectedLog" class="detail-content">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="记录ID">{{ selectedLog.id }}</el-descriptions-item>
          <el-descriptions-item label="打包状态">
            <StatusTag :status="selectedLog.packagingStatus" />
          </el-descriptions-item>
          <el-descriptions-item label="产品名称">{{ selectedLog.product.name }}</el-descriptions-item>
          <el-descriptions-item label="产品ID">{{ selectedLog.product.appId }}</el-descriptions-item>
          <el-descriptions-item label="设计ID">{{ selectedLog.product.designId }}</el-descriptions-item>
          <el-descriptions-item label="价格">${{ selectedLog.product.price }}</el-descriptions-item>
          <el-descriptions-item label="创建时间" :span="2">{{ formatDateTime(selectedLog.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="更新时间" :span="2">{{ formatDateTime(selectedLog.updatedAt) }}</el-descriptions-item>
          <el-descriptions-item label="版本">{{ selectedLog.version }}</el-descriptions-item>
          <el-descriptions-item label="是否删除">{{ selectedLog.isDeleted === 1 ? '是' : '否' }}</el-descriptions-item>
          <el-descriptions-item label="是否激活">{{ selectedLog.isActive === 1 ? '是' : '否' }}</el-descriptions-item>
          <el-descriptions-item label="错误信息" :span="2">
            <span v-if="selectedLog.errorMessage" class="error-message">{{ selectedLog.errorMessage }}</span>
            <span v-else class="no-error">无错误信息</span>
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getProductPackagingLogsPage } from '@/api/products'
import type { ProductPackagingLogVO } from '@/types/product'

import { getPackagingStatusOptions, formatPackagingStatusArray } from '@/utils/status'
import { PACKAGING_STATUS } from '@/types/product'
import { formatDateTime } from '@/utils/date'
import StatusTag from '@/components/StatusTag.vue'

// 响应式数据
const loading = ref(false)
const packagingLogs = ref<ProductPackagingLogVO[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 搜索条件
const searchProductId = ref('')
const searchStatus = ref<string[]>([
  PACKAGING_STATUS.INIT,
  PACKAGING_STATUS.PENDING,
  PACKAGING_STATUS.FAILED
])

// 详情对话框
const detailDialogVisible = ref(false)
const selectedLog = ref<ProductPackagingLogVO | null>(null)

// 获取打包记录列表
const fetchPackagingLogs = async () => {
  loading.value = true
  try {
    const params = {
      pageNum: currentPage.value,
      pageSize: pageSize.value,
      productId: searchProductId.value ? parseInt(searchProductId.value) : null,
      packagingStatus: searchStatus.value.length > 0 ? formatPackagingStatusArray(searchStatus.value) : null
    }
    
    const response = await getProductPackagingLogsPage(params)
    if (response.code === 0) {
      packagingLogs.value = response.data!.list
      total.value = response.data!.total
    } else {
      ElMessage.error(response.msg || '获取打包记录失败')
    }
  } catch (error) {
    console.error('获取打包记录失败:', error)
    ElMessage.error('获取打包记录失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
  fetchPackagingLogs()
}

// 重置
const handleReset = () => {
  searchProductId.value = ''
  searchStatus.value = []
  currentPage.value = 1
  fetchPackagingLogs()
}

// 分页处理
const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  fetchPackagingLogs()
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
  fetchPackagingLogs()
}

// 查看详情
const handleViewDetails = (row: ProductPackagingLogVO) => {
  selectedLog.value = row
  detailDialogVisible.value = true
}

// 初始化
onMounted(() => {
  fetchPackagingLogs()
})
</script>

<style lang="scss" scoped>
.packaging-logs-container {
  padding: 24px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  
  h2 {
    margin: 0;
    color: #333;
    font-size: 24px;
    font-weight: 600;
  }
}

.product-info {
  .product-name {
    font-weight: 600;
    color: #333;
    margin-bottom: 4px;
  }
  
  .product-details {
    display: flex;
    gap: 12px;
    font-size: 12px;
    color: #666;
    
    span {
      background: #f5f5f5;
      padding: 2px 6px;
      border-radius: 4px;
    }
  }
}

.error-message {
  color: #f56c6c;
  font-size: 12px;
  word-break: break-all;
}

.no-error {
  color: #909399;
  font-style: italic;
}

.pagination {
  margin-top: 24px;
  display: flex;
  justify-content: center;
}

.detail-content {
  .error-message {
    color: #f56c6c;
    word-break: break-all;
  }
  
  .no-error {
    color: #909399;
    font-style: italic;
  }
}
</style> 