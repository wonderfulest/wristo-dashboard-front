<template>
  <div class="packaging-dead-queue-container">
    <div class="header">
      <h2>死信队列</h2>
      <div class="header-actions">
        <el-button
          type="primary"
          :disabled="selectedDeadQueue.length === 0"
          @click="openBatchRequeueDialog"
        >
          批量重提
        </el-button>
        <el-button
          type="warning"
          :disabled="deadQueue.length === 0"
          @click="openRequeueAllDialog"
        >
          一键重提
        </el-button>
        <el-button @click="fetchDeadQueue" :loading="loading">刷新</el-button>
      </div>
    </div>

    <el-alert
      class="queue-alert"
      type="warning"
      :closable="false"
      show-icon
      title="这里展示打包 worker 失败后写入 wf:pack:dead 的任务。重新提交会从死信队列移除，并加入正常打包任务队列。"
    />

    <div class="table-actions" v-if="selectedDeadQueue.length > 0">
      已选择 {{ selectedDeadQueue.length }} 条
    </div>

    <el-table
      :data="deadQueue"
      style="width: 100%"
      v-loading="loading"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="48" />
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column label="进入死信时间" width="180">
        <template #default="{ row }">
          {{ formatNullableDateTime(row.deadLetterAt) }}
        </template>
      </el-table-column>
      <el-table-column label="打包类型" width="100">
        <template #default="{ row }">
          {{ row.type || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="设备 ID" width="140">
        <template #default="{ row }">
          {{ row.deviceId || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="产品信息" min-width="320">
        <template #default="{ row }">
          <AppProductInfo :product="row.product" :thumb-size="56" />
        </template>
      </el-table-column>
      <el-table-column label="设计师" width="140">
        <template #default="{ row }">
          {{ row.product?.user?.username || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="打包状态" width="120">
        <template #default="{ row }">
          <StatusTag :status="row.packagingStatus" />
        </template>
      </el-table-column>
      <el-table-column label="错误信息" min-width="220">
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
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click="openRequeueDialog(row)">重新提交</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="requeueDialogVisible" title="重新提交死信任务" width="420px">
      <div v-if="requeueTargetRows.length > 0">
        <div class="dialog-tip">
          <template v-if="requeueTargetRows.length === 1">
            将重新提交打包记录 ID：<b>{{ requeueTargetRows[0].id }}</b>
            <span v-if="requeueTargetRows[0].product?.name">，产品：<b>{{ requeueTargetRows[0].product.name }}</b></span>
          </template>
          <template v-else>
            将重新提交 <b>{{ requeueTargetRows.length }}</b> 条死信任务。
          </template>
        </div>
        <el-form label-position="top">
          <el-form-item label="优先级（0-9，0 为最高优先级）" required>
            <el-input
              v-model.number="requeuePriority"
              type="number"
              min="0"
              max="9"
              placeholder="请输入 0-9 的整数"
              style="width: 200px;"
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="requeueDialogVisible = false" :disabled="submittingRequeue">取消</el-button>
          <el-button type="primary" @click="submitRequeue" :loading="submittingRequeue">确认重新提交</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getProductPackagingDeadQueue,
  requeueProductPackagingDeadQueueItem
} from '@/api/products'
import type { ProductPackagingLogVO } from '@/types/product'
import { formatDateTime } from '@/utils/date'
import StatusTag from '@/components/StatusTag.vue'
import AppProductInfo from '@/components/common/AppProductInfo.vue'

const loading = ref(false)
const deadQueue = ref<ProductPackagingLogVO[]>([])
const selectedDeadQueue = ref<ProductPackagingLogVO[]>([])

const requeueDialogVisible = ref(false)
const requeueTargetRows = ref<ProductPackagingLogVO[]>([])
const requeuePriority = ref<number | null>(5)
const submittingRequeue = ref(false)

const formatNullableDateTime = (value: string | number | Date | null | undefined) => {
  return value ? formatDateTime(value) : '-'
}

const fetchDeadQueue = async () => {
  loading.value = true
  try {
    const res = await getProductPackagingDeadQueue('*')
    if (res.code === 0) {
      deadQueue.value = res.data || []
      selectedDeadQueue.value = []
    } else {
      ElMessage.error(res.msg || '获取死信队列失败')
    }
  } catch (error) {
    console.error('获取死信队列失败:', error)
    ElMessage.error('获取死信队列失败')
  } finally {
    loading.value = false
  }
}

const handleSelectionChange = (rows: ProductPackagingLogVO[]) => {
  selectedDeadQueue.value = rows
}

const openRequeueDialog = (row: ProductPackagingLogVO) => {
  requeueTargetRows.value = [row]
  requeuePriority.value = 5
  requeueDialogVisible.value = true
}

const openBatchRequeueDialog = () => {
  if (selectedDeadQueue.value.length === 0) {
    ElMessage.warning('请先选择要重新提交的死信任务')
    return
  }
  requeueTargetRows.value = [...selectedDeadQueue.value]
  requeuePriority.value = 5
  requeueDialogVisible.value = true
}

const openRequeueAllDialog = () => {
  if (deadQueue.value.length === 0) {
    ElMessage.warning('当前没有可重新提交的死信任务')
    return
  }
  requeueTargetRows.value = [...deadQueue.value]
  requeuePriority.value = 5
  requeueDialogVisible.value = true
}

const submitRequeue = async () => {
  if (requeueTargetRows.value.length === 0) return

  const value = typeof requeuePriority.value === 'number' ? requeuePriority.value : 5
  if (!Number.isInteger(value) || value < 0 || value > 9) {
    ElMessage.error('优先级必须是 0-9 的整数，0 为最高优先级')
    return
  }

  try {
    submittingRequeue.value = true
    let successCount = 0
    let failedCount = 0

    for (const row of requeueTargetRows.value) {
      try {
        const res = await requeueProductPackagingDeadQueueItem(row.id, value)
        if (res.code === 0) {
          successCount += 1
        } else {
          failedCount += 1
        }
      } catch (error) {
        failedCount += 1
      }
    }

    if (successCount > 0 && failedCount === 0) {
      ElMessage.success(`已重新提交 ${successCount} 条死信任务到打包队列`)
      requeueDialogVisible.value = false
      fetchDeadQueue()
    } else if (successCount > 0) {
      ElMessage.warning(`已重新提交 ${successCount} 条，${failedCount} 条失败`)
      requeueDialogVisible.value = false
      fetchDeadQueue()
    } else {
      ElMessage.error('重新提交失败')
    }
  } catch (error) {
    // 错误由 axios 拦截器处理
  } finally {
    submittingRequeue.value = false
  }
}

onMounted(() => {
  fetchDeadQueue()
})
</script>

<style lang="scss" scoped>
.packaging-dead-queue-container {
  padding: 24px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;

  h2 {
    margin: 0;
    color: #333;
    font-size: 24px;
    font-weight: 600;
  }
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.queue-alert {
  margin-bottom: 16px;
}

.table-actions {
  margin-bottom: 12px;
  color: #606266;
  font-size: 13px;
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

.dialog-tip {
  margin-bottom: 12px;
  color: #606266;
}
</style>
