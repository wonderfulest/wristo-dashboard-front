<template>
    <div class="header">
      <h2>打包记录</h2>
      <div style="display: flex; gap: 12px; align-items: center;">
        <el-input
          v-model="searchProductId"
          placeholder="按产品ID搜索"
          clearable
          style="width: 200px"
          @keyup.enter.native="handleSearch"
        />
        <UserSelect
          v-model="searchUserId"
          :role-authorities="['ROLE_DESIGNER']"
          placeholder="按设计师搜索"
          @change="handleSearch"
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
      <el-table-column label="产品信息" min-width="320">
        <template #default="{ row }">
          <AppProductInfo :product="row.product" :thumb-size="56" />
        </template>
      </el-table-column>
      <el-table-column label="设计师" width="140">
        <template #default="{ row }">
          {{ row.product.user?.username || '-' }}
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
            <el-button type="danger" link @click="openRejectDialog(row)">拒绝</el-button>
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

    <!-- 拒绝对话框（必须填写原因） -->
    <el-dialog
      v-model="rejectDialogVisible"
      title="拒绝审核"
      width="520px"
    >
      <div v-if="rejectTargetRow">
        <div style="margin-bottom: 12px; color: #606266;">
          将拒绝产品：<b>{{ rejectTargetRow.product.name }}</b>
          （设计ID：{{ rejectTargetRow.product.designId }}）
        </div>
        <el-form label-position="top">
          <el-form-item label="拒绝原因" required>
            <el-input
              v-model="rejectReason"
              type="textarea"
              :rows="4"
              maxlength="300"
              show-word-limit
              placeholder="请填写拒绝原因，必填"
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="rejectDialogVisible = false" :disabled="submittingReject">取消</el-button>
          <el-button type="danger" @click="submitReject" :loading="submittingReject">确认拒绝</el-button>
        </span>
      </template>
    </el-dialog>
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
import { rejectDesignWithComment } from '@/api/design-review'
import UserSelect from '@/components/users/UserSelect.vue'
import AppProductInfo from '@/components/common/AppProductInfo.vue'

// 响应式数据
const loading = ref(false)
const packagingLogs = ref<ProductPackagingLogVO[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 搜索条件
const searchProductId = ref('')
const searchUserId = ref<number | undefined>(undefined)
const searchStatus = ref<string[]>([
  PACKAGING_STATUS.INIT,
  PACKAGING_STATUS.PENDING,
  PACKAGING_STATUS.FAILED
])

// 详情对话框
const detailDialogVisible = ref(false)
const selectedLog = ref<ProductPackagingLogVO | null>(null)

// 拒绝对话框状态
const rejectDialogVisible = ref(false)
const rejectReason = ref('')
const submittingReject = ref(false)
const rejectTargetRow = ref<ProductPackagingLogVO | null>(null)

// 获取打包记录列表
const fetchPackagingLogs = async () => {
  loading.value = true
  try {
    const params = {
      pageNum: currentPage.value,
      pageSize: pageSize.value,
      productId: searchProductId.value ? parseInt(searchProductId.value) : null,
      userId: typeof searchUserId.value === 'number' ? searchUserId.value : null,
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
  searchUserId.value = undefined
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

// 打开拒绝对话框
const openRejectDialog = (row: ProductPackagingLogVO) => {
  rejectTargetRow.value = row
  rejectReason.value = ''
  rejectDialogVisible.value = true
}

// 提交拒绝（必须填写原因）
const submitReject = async () => {
  if (!rejectTargetRow.value) return
  if (!rejectReason.value || rejectReason.value.trim().length === 0) {
    ElMessage.error('必须填写拒绝原因')
    return
  }
  try {
    submittingReject.value = true
    const dto = {
      designUid: rejectTargetRow.value.product.designId,
      reviewComment: rejectReason.value.trim()
    }
    const res = await rejectDesignWithComment(dto)
    if (res.code === 0 && res.data === true) {
      ElMessage.success('已拒绝')
      rejectDialogVisible.value = false
      rejectReason.value = ''
      // 刷新列表
      fetchPackagingLogs()
    }
  } catch (e) {
    // 错误消息在 axios 拦截器里已处理
  } finally {
    submittingReject.value = false
  }
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
  display: flex;
  align-items: center;
  gap: 12px;
  .product-thumb {
    width: 56px;
    height: 56px;
    object-fit: cover;
    border-radius: 6px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    flex: 0 0 56px;
  }
  .product-meta { min-width: 0; }
  .product-name {
    font-weight: 600;
    color: #333;
    margin-bottom: 4px;
    a { color: #409EFF; text-decoration: none; }
    a:hover { text-decoration: underline; }
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