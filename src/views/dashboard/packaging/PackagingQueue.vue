<template>
  <div class="packaging-queue-container">
    <div class="header">
      <h2>打包任务队列</h2>
      <div style="display: flex; gap: 12px; align-items: center;">
        <el-button type="primary" @click="handleRefresh" :loading="loading || lockedLoading">
          刷新
        </el-button>
        <el-popconfirm
          title="确定要手动清理当前队列锁吗？如果仍有任务在执行，可能导致状态不一致。"
          confirm-button-text="确定"
          cancel-button-text="取消"
          @confirm="handleClearQueueLock"
        >
          <template #reference>
            <el-button type="danger" :loading="clearingLock">清理队列锁</el-button>
          </template>
        </el-popconfirm>
        <el-switch
          v-model="queuePaused"
          :loading="pausingQueue"
          active-text="已暂停"
          inactive-text="运行中"
          @change="handleToggleQueuePause"
        />
      </div>
    </div>
    <div class="locked-task-card">
      <h3>当前正在打包的任务</h3>
      <div v-if="lockedLoading" class="locked-task-empty">加载中...</div>
      <div v-else-if="!lockedTask" class="locked-task-empty">当前没有正在打包中的任务</div>
      <div v-else class="locked-task-content">
        <div class="locked-task-main">
          <div class="locked-task-info">
            <div class="locked-task-row">
              <span class="label">记录 ID：</span>
              <span>{{ lockedTask.id }}</span>
            </div>
            <div class="locked-task-row">
              <span class="label">打包类型：</span>
              <span>{{ lockedTask.type || '-' }}</span>
            </div>
            <div class="locked-task-row">
              <span class="label">设备 ID：</span>
              <span>{{ lockedTask.deviceId || '-' }}</span>
            </div>
            <div class="locked-task-row">
              <span class="label">打包状态：</span>
              <StatusTag :status="lockedTask.packagingStatus" />
            </div>
            <div class="locked-task-row">
              <span class="label">错误信息：</span>
              <el-tooltip v-if="lockedTask.errorMessage" :content="lockedTask.errorMessage" placement="top">
                <span class="error-message">{{ lockedTask.errorMessage }}</span>
              </el-tooltip>
              <span v-else class="no-error">-</span>
            </div>
            <div class="locked-task-row">
              <span class="label">创建时间：</span>
              <span>{{ formatDateTime(lockedTask.createdAt) }}</span>
            </div>
            <div class="locked-task-row">
              <span class="label">更新时间：</span>
              <span>{{ formatDateTime(lockedTask.updatedAt) }}</span>
            </div>
          </div>
          <div class="locked-task-product">
            <AppProductInfo :product="lockedTask.product" :thumb-size="72" />
          </div>
        </div>
      </div>
    </div>

    <el-table :data="queue" style="width: 100%" v-loading="loading">
      <el-table-column prop="id" label="ID" width="80" />
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
      <el-table-column label="队列优先级" width="120">
        <template #default="{ row }">
          <span v-if="row.priority !== null && row.priority !== undefined">{{ row.priority }}</span>
          <span v-else class="no-error">未在队列中</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="260" fixed="right">
        <template #default="{ row }">
          <div style="display: flex; gap: 8px;">
            <el-button type="primary" link @click="openPriorityDialog(row)">调整优先级</el-button>
            <el-popconfirm
              title="确定要将该任务从队列中移除吗？"
              confirm-button-text="确定"
              cancel-button-text="取消"
              @confirm="removeFromQueue(row)"
            >
              <template #reference>
                <el-button type="danger" link>移除</el-button>
              </template>
            </el-popconfirm>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <!-- 调整优先级对话框 -->
    <el-dialog
      v-model="priorityDialogVisible"
      title="调整队列优先级"
      width="420px"
    >
      <div v-if="priorityTargetRow">
        <div style="margin-bottom: 12px; color: #606266;">
          调整产品：<b>{{ priorityTargetRow.product.name }}</b>
          （设计ID：{{ priorityTargetRow.product.designId }}，打包记录ID：{{ priorityTargetRow.id }}）
        </div>
        <el-form label-position="top">
          <el-form-item label="优先级（0-9，0 为最高优先级）" required>
            <el-input
              v-model.number="priorityValue"
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
          <el-button @click="priorityDialogVisible = false" :disabled="updatingPriority">取消</el-button>
          <el-button type="primary" @click="submitPriority" :loading="updatingPriority">确认</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import type { ProductPackagingLogVO } from '@/types/product'
import {
  getProductPackagingQueue,
  removeProductPackagingQueueItem,
  updateProductPackagingQueuePriority,
  getLockedProductPackagingTask,
  clearProductPackagingQueueLock,
  setProductPackagingQueuePause
} from '@/api/products'
import { formatDateTime } from '@/utils/date'
import StatusTag from '@/components/StatusTag.vue'
import AppProductInfo from '@/components/common/AppProductInfo.vue'

const loading = ref(false)
const queue = ref<ProductPackagingLogVO[]>([])

// 当前锁定的正在打包任务
const lockedTask = ref<ProductPackagingLogVO | null>(null)
const lockedLoading = ref(false)
const clearingLock = ref(false)

// 队列暂停状态（前端本地状态）
const queuePaused = ref(false)
const pausingQueue = ref(false)

const priorityDialogVisible = ref(false)
const priorityTargetRow = ref<ProductPackagingLogVO | null>(null)
const priorityValue = ref<number | null>(5)
const updatingPriority = ref(false)

const fetchQueue = async () => {
  loading.value = true
  try {
    const res = await getProductPackagingQueue('*')
    if (res.code === 0) {
      queue.value = res.data || []
    } else {
      ElMessage.error(res.msg || '获取打包队列失败')
    }
  } catch (error) {
    console.error('获取打包队列失败:', error)
    ElMessage.error('获取打包队列失败')
  } finally {
    loading.value = false
  }
}

const fetchLockedTask = async () => {
  lockedLoading.value = true
  try {
    const res = await getLockedProductPackagingTask('*')
    if (res.code === 0) {
      // 明确处理 undefined，避免类型 "ProductPackagingLogVO | null | undefined" 报错
      lockedTask.value = res.data ?? null
    } else {
      ElMessage.error(res.msg || '获取正在打包任务失败')
    }
  } catch (error) {
    console.error('获取正在打包任务失败:', error)
    ElMessage.error('获取正在打包任务失败')
  } finally {
    lockedLoading.value = false
  }
}

const openPriorityDialog = (row: ProductPackagingLogVO) => {
  priorityTargetRow.value = row
  priorityValue.value = (row.priority ?? 5) as number
  priorityDialogVisible.value = true
}

const submitPriority = async () => {
  if (!priorityTargetRow.value) return

  let value = typeof priorityValue.value === 'number' ? priorityValue.value : 5
  if (!Number.isInteger(value) || value < 0 || value > 9) {
    ElMessage.error('优先级必须是 0-9 的整数，0 为最高优先级')
    return
  }

  try {
    updatingPriority.value = true
    const res = await updateProductPackagingQueuePriority(priorityTargetRow.value.id, value)
    if (res.code === 0) {
      ElMessage.success('已更新队列优先级')
      priorityDialogVisible.value = false
      fetchQueue()
    }
  } catch (error) {
    // 错误由 axios 拦截器处理
  } finally {
    updatingPriority.value = false
  }
}

const removeFromQueue = async (row: ProductPackagingLogVO) => {
  try {
    const res = await removeProductPackagingQueueItem(row.id)
    if (res.code === 0) {
      ElMessage.success('已从队列中移除')
      fetchQueue()
    }
  } catch (error) {
    // 错误由 axios 拦截器处理
  }
}

const handleRefresh = () => {
  fetchQueue()
  fetchLockedTask()
}

const handleClearQueueLock = async () => {
  try {
    clearingLock.value = true
    const res = await clearProductPackagingQueueLock()
    if (res.code === 0) {
      ElMessage.success('已清理队列锁')
      lockedTask.value = null
      fetchQueue()
    }
  } catch (error) {
    // 错误由 axios 拦截器处理
  } finally {
    clearingLock.value = false
  }
}

const handleToggleQueuePause = async (value: boolean) => {
  try {
    pausingQueue.value = true
    const res = await setProductPackagingQueuePause(value)
    if (res.code === 0) {
      queuePaused.value = value
      ElMessage.success(value ? '已暂停打包队列' : '已恢复打包队列')
    }
  } catch (error) {
    // 错误由 axios 拦截器处理
    // 失败时回滚开关状态
    queuePaused.value = !value
  } finally {
    pausingQueue.value = false
  }
}

onMounted(() => {
  fetchQueue()
  fetchLockedTask()
})
</script>

<style lang="scss" scoped>
.packaging-queue-container {
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

.error-message {
  color: #f56c6c;
  font-size: 12px;
  word-break: break-all;
}

.no-error {
  color: #909399;
  font-style: italic;
}

.locked-task-card {
  margin-bottom: 24px;
  padding: 16px 20px;
  border-radius: 6px;
  background-color: #f5f7fa;
  border: 1px solid #e4e7ed;

  h3 {
    margin: 0 0 12px;
    font-size: 16px;
    font-weight: 600;
    color: #303133;
  }
}

.locked-task-empty {
  color: #909399;
  font-size: 13px;
}

.locked-task-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.locked-task-main {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
}

.locked-task-info {
  flex: 1;
}

.locked-task-product {
  flex-shrink: 0;
}

.locked-task-row {
  display: flex;
  align-items: center;
  margin-bottom: 6px;

  .label {
    width: 88px;
    color: #909399;
    font-size: 13px;
  }

  span {
    font-size: 13px;
  }
}
</style>
