<template>
  <div class="packaging-queue-container">
    <div class="header">
      <h2>打包队列</h2>
      <div style="display: flex; gap: 12px; align-items: center;">
        <el-button type="primary" @click="fetchQueue" :loading="loading">刷新</el-button>
      </div>
    </div>

    <el-table :data="queue" style="width: 100%" v-loading="loading">
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
import { getProductPackagingQueue, removeProductPackagingQueueItem, updateProductPackagingQueuePriority } from '@/api/products'
import { formatDateTime } from '@/utils/date'
import StatusTag from '@/components/StatusTag.vue'
import AppProductInfo from '@/components/common/AppProductInfo.vue'

const loading = ref(false)
const queue = ref<ProductPackagingLogVO[]>([])

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

const openPriorityDialog = (row: ProductPackagingLogVO) => {
  priorityTargetRow.value = row
  priorityValue.value = 5
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

onMounted(() => {
  fetchQueue()
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
</style>
