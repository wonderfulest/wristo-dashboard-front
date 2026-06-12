<template>
  <div class="packaging-dead-queue-container">
    <div class="header">
      <h2>死信队列</h2>
      <el-button type="primary" @click="fetchDeadQueue" :loading="loading">刷新</el-button>
    </div>

    <el-alert
      class="queue-alert"
      type="warning"
      :closable="false"
      show-icon
      title="这里展示打包 worker 失败后写入 wf:pack:dead 的任务。重新提交会从死信队列移除，并加入正常打包任务队列。"
    />

    <el-table :data="deadQueue" style="width: 100%" v-loading="loading">
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
      <div v-if="requeueTargetRow">
        <div class="dialog-tip">
          将重新提交打包记录 ID：<b>{{ requeueTargetRow.id }}</b>
          <span v-if="requeueTargetRow.product?.name">，产品：<b>{{ requeueTargetRow.product.name }}</b></span>
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

const requeueDialogVisible = ref(false)
const requeueTargetRow = ref<ProductPackagingLogVO | null>(null)
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

const openRequeueDialog = (row: ProductPackagingLogVO) => {
  requeueTargetRow.value = row
  requeuePriority.value = 5
  requeueDialogVisible.value = true
}

const submitRequeue = async () => {
  if (!requeueTargetRow.value) return

  const value = typeof requeuePriority.value === 'number' ? requeuePriority.value : 5
  if (!Number.isInteger(value) || value < 0 || value > 9) {
    ElMessage.error('优先级必须是 0-9 的整数，0 为最高优先级')
    return
  }

  try {
    submittingRequeue.value = true
    const res = await requeueProductPackagingDeadQueueItem(requeueTargetRow.value.id, value)
    if (res.code === 0) {
      ElMessage.success('已重新提交到打包任务队列')
      requeueDialogVisible.value = false
      fetchDeadQueue()
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

.queue-alert {
  margin-bottom: 16px;
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
