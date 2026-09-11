<template>
  <div class="packaging-queue-container">
    <div class="header">
      <h2>打包任务队列</h2>
      <div class="queue-controls">
        <span class="refresh-time">最后更新：{{ lastUpdated ? formatDateTime(lastUpdated) : '尚未加载' }}</span>
        <el-switch v-model="autoRefresh" active-text="每 10 秒刷新" />
        <el-button type="primary" @click="handleRefresh" :loading="loading"
          :disabled="updatingPriority || pausingQueue || !!deletingChannel || clearingOfflineChannels || priorityDialogVisible">刷新</el-button>
      </div>
    </div>
    <el-alert v-if="refreshError" :title="refreshError" type="warning" :closable="false" show-icon />
    <div class="queue-summary">
      <div><span>等待领取</span><strong>{{ loaded ? queue.length : '—' }}</strong></div>
      <div><span>执行中</span><strong>{{ loaded ? runningTasks.length : '—' }}</strong></div>
      <router-link to="/packaging/packaging-dead-queue"><span>死信任务</span><strong>{{ loaded ? deadCount : '—' }}</strong></router-link>
    </div>
    <div class="queue-toolbar">
      <el-switch :model-value="!queuePaused" :loading="pausingQueue"
        :disabled="!loaded || loading || !!pausingChannel || !!deletingChannel || clearingOfflineChannels" aria-label="全局允许领取新任务"
        :active-text="!loaded ? '状态待确认' : queuePaused ? '全局已暂停领取' : '全局允许领取新任务'"
        @change="handleToggleQueuePause" />
      <span>暂停仅停止领取新任务，已领取任务继续执行。</span>
    </div>
    <details v-if="legacyWorkerActive" class="legacy-maintenance">
      <summary>旧版消费者维护：检测到全局队列锁</summary>
      <p>旧版锁会阻止分布式消费者领取任务。仅在确认旧版消费者已停止后清理；此操作不会释放分布式任务租约。</p>
      <el-popconfirm title="确认旧版消费者已停止并清理旧版全局锁？" @confirm="handleClearQueueLock">
        <template #reference><el-button type="danger" :loading="clearingLock">清理旧版全局锁</el-button></template>
      </el-popconfirm>
    </details>
    <div class="channel-header">
      <h3>执行队列（{{ channels.length }}）</h3>
      <el-button type="danger" plain :loading="clearingOfflineChannels"
        :disabled="!loaded || !offlineIdleChannelCount || loading || pausingQueue || !!pausingChannel || !!deletingChannel || clearingOfflineChannels || updatingPriority || priorityDialogVisible"
        @click="handleClearOfflineChannels">一键清理离线队列</el-button>
    </div>
    <p class="refresh-time">编号格式：环境-pack-节点-通道，例如 prod-pack-n01-01。全局与队列开关均允许时，才会领取新任务。</p>
    <el-table :data="channels" row-key="queueId" :empty-text="loaded ? '尚无已登记队列，请为 worker 配置编号并启动' : '尚未获取队列状态'">
      <el-table-column prop="queueId" label="队列编号" min-width="220" />
      <el-table-column label="在线状态" width="110"><template #default="{ row }">
        <el-tag :type="row.online ? 'success' : 'info'">{{ row.online ? '在线' : '离线' }}</el-tag>
      </template></el-table-column>
      <el-table-column label="允许领取" width="130"><template #default="{ row }">
        <el-switch :model-value="!row.paused" :aria-label="`${row.queueId} 允许领取`"
          :loading="pausingChannel === row.queueId" :disabled="!loaded || loading || pausingQueue || !!pausingChannel || !!deletingChannel || clearingOfflineChannels"
          @change="(value: boolean | string | number) => handleToggleChannel(row, value)" />
      </template></el-table-column>
      <el-table-column label="领取状态" min-width="160"><template #default="{ row }">
        {{ queuePaused ? '全局暂停' : row.paused ? '队列暂停' : !row.online ? '离线' : row.taskId ? '执行中' : '等待任务' }}
      </template></el-table-column>
      <el-table-column label="当前任务" width="120"><template #default="{ row }">{{ row.taskId || '—' }}</template></el-table-column>
      <el-table-column label="最近心跳" min-width="180"><template #default="{ row }">{{ formatDateTime(row.lastSeenAt) }}</template></el-table-column>
      <el-table-column label="操作" width="100" fixed="right"><template #default="{ row }">
        <el-button type="danger" link :aria-label="`删除队列 ${row.queueId}`"
          :title="row.online ? '仅离线队列可删除' : '删除队列'"
          :loading="deletingChannel === row.queueId"
          :disabled="row.online || !loaded || loading || pausingQueue || !!pausingChannel || !!deletingChannel || clearingOfflineChannels"
          @click="handleDeleteChannel(row)">删除</el-button>
      </template></el-table-column>
    </el-table>
    <h3>执行中（{{ loaded ? runningTasks.length : '—' }}）</h3>
    <el-table :data="sortedRunningTasks" row-key="id" v-loading="loading" :empty-text="loaded ? '当前没有执行中的任务' : '尚未获取执行中任务'">
      <el-table-column prop="id" label="任务 ID" width="95" />
      <el-table-column label="队列编号" min-width="190"><template #default="{ row }">{{ row.queueId || '未编号（旧 worker）' }}</template></el-table-column>
      <el-table-column label="产品信息" min-width="280"><template #default="{ row }"><AppProductInfo :product="row.product" :thumb-size="56" /></template></el-table-column>
      <el-table-column prop="type" label="类型" width="80" />
      <el-table-column label="设备" min-width="160"><template #default="{ row }">{{ row.deviceId || '全部适用设备' }}</template></el-table-column>
      <el-table-column label="构建状态" width="120"><template #default="{ row }"><StatusTag :status="row.packagingStatus" /></template></el-table-column>
      <el-table-column label="开始时间" width="180"><template #default="{ row }">{{ row.processingStartedAt ? formatDateTime(row.processingStartedAt) : '待上报' }}</template></el-table-column>
      <el-table-column label="执行耗时" width="120"><template #default="{ row }">{{ runningDuration(row) }}</template></el-table-column>
      <el-table-column label="日志" width="100"><template #default="{ row }"><el-link v-if="row.lastBuildLogPath" :href="row.lastBuildLogPath" target="_blank" rel="noopener noreferrer" type="primary">最近日志</el-link><span v-else class="no-error">待上传</span></template></el-table-column>
    </el-table>
    <h3>等待队列</h3>
    <div class="queue-toolbar">
      <el-select
        v-model="designerId"
        placeholder="全部设计师"
        clearable
        filterable
        :disabled="updatingPriority"
        style="width: 220px"
        @change="clearSelection"
      >
        <el-option v-for="designer in designers" :key="designer.id"
          :label="designer.username" :value="designer.id" />
      </el-select>
      <span>共 {{ filteredQueue.length }} 条，已选 {{ selectedRows.length }} 条</span>
      <span v-if="selectedRows.length" class="refresh-time">选择任务期间暂停自动刷新</span>
      <el-button type="primary" :disabled="!selectedRows.length || loading || updatingPriority"
        @click="openBatchPriorityDialog">批量调整优先级</el-button>
      <el-button :disabled="!selectedRows.length || updatingPriority" @click="clearSelection">清空选择</el-button>
    </div>
    <el-table ref="queueTable" :data="filteredQueue" row-key="id" style="width: 100%"
      v-loading="loading || updatingPriority" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="48" :selectable="isSelectable" />
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
          {{ row.product?.user?.username || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="调度状态" width="120">
        <template #default>
          <el-tag>等待领取</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="上次错误" min-width="200">
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
      :title="batchPriorityMode ? '批量调整队列优先级' : '调整队列优先级'"
      :close-on-click-modal="!updatingPriority"
      :close-on-press-escape="!updatingPriority"
      :show-close="!updatingPriority"
      width="420px"
    >
      <div v-if="priorityTargetRow || batchPriorityMode">
        <div v-if="batchPriorityMode" style="margin-bottom: 12px;">
          将为选中的 <b>{{ priorityTargetRows.length }}</b> 条任务设置统一优先级。
          <div v-if="updatingPriority">已处理 {{ processedCount }} / {{ priorityTargetRows.length }} 条</div>
          <el-alert v-if="batchFailureSummary" :title="batchFailureSummary" type="warning" :closable="false" />
        </div>
        <div v-if="priorityTargetRow" style="margin-bottom: 12px; color: #606266;">
          调整产品：<b>{{ priorityTargetRow.product?.name || '-' }}</b>
          （设计ID：{{ priorityTargetRow.product?.designId || '-' }}，打包记录ID：{{ priorityTargetRow.id }}）
        </div>
        <el-form label-position="top">
          <el-form-item label="优先级（0-9，0 为手动插队）" required>
            <el-input
              v-model.number="priorityValue"
              :disabled="updatingPriority"
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
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox, type TableInstance } from 'element-plus'
import type { ProductPackagingLogVO } from '@/types/product'
import {
  getProductPackagingQueue,
  getPackagingChannels,
  setPackagingChannelPause,
  deletePackagingChannel,
  clearOfflinePackagingChannels,
  type PackagingChannel,
  removeProductPackagingQueueItem,
  updateProductPackagingQueuePriority,
  getRunningProductPackagingTasks,
  getProductPackagingQueuePause,
  getProductPackagingQueueProtocol,
  getProductPackagingDeadQueue,
  clearProductPackagingQueueLock,
  setProductPackagingQueuePause
} from '@/api/products'
import { formatDateTime } from '@/utils/date'
import StatusTag from '@/components/StatusTag.vue'
import AppProductInfo from '@/components/common/AppProductInfo.vue'

const loading = ref(false)
const queue = ref<ProductPackagingLogVO[]>([])
const queueTable = ref<TableInstance>()
const designerId = ref<number | ''>('')
const selectedRows = ref<ProductPackagingLogVO[]>([])
const designers = computed(() => {
  const users = new Map<number, { id: number; username: string }>()
  for (const row of queue.value) {
    const user = row.product?.user
    if (user) users.set(user.id, user)
  }
  return [...users.values()].sort((a, b) => a.username.localeCompare(b.username))
})
const filteredQueue = computed(() => queue.value.filter(row =>
  !designerId.value || row.product?.user?.id === designerId.value
))
const clearSelection = () => {
  queueTable.value?.clearSelection()
  selectedRows.value = []
}
const handleSelectionChange = (rows: ProductPackagingLogVO[]) => { selectedRows.value = rows }
const isSelectable = (row: ProductPackagingLogVO) => !runningTasks.value.some(task => task.id === row.id)


const runningTasks = ref<ProductPackagingLogVO[]>([])
// 开始越早，执行耗时越长；未上报或无效的开始时间排在末尾。
const sortedRunningTasks = computed(() => {
  const startTime = (row: ProductPackagingLogVO) => {
    const value = row.processingStartedAt ? new Date(row.processingStartedAt).getTime() : NaN
    return Number.isFinite(value) ? value : Infinity
  }
  return [...runningTasks.value].sort((a, b) => startTime(a) - startTime(b))
})
const deadCount = ref(0)
const loaded = ref(false)
const lastUpdated = ref<number | null>(null)
const refreshError = ref('')
const autoRefresh = ref(true)
const legacyWorkerActive = ref(false)
const clearingLock = ref(false)
const channels = ref<PackagingChannel[]>([])
const pausingChannel = ref('')
const deletingChannel = ref('')
const clearingOfflineChannels = ref(false)
const offlineIdleChannelCount = computed(() => channels.value.filter(row => !row.online && !row.taskId).length)
const queuePaused = ref(false)
const pausingQueue = ref(false)
let refreshTimer: ReturnType<typeof setInterval> | undefined

const runningDuration = (row: ProductPackagingLogVO) => {
  if (!row.processingStartedAt || !lastUpdated.value) return '待上报'
  const started = new Date(row.processingStartedAt).getTime()
  if (!Number.isFinite(started)) return '待上报'
  const seconds = Math.max(0, Math.floor((lastUpdated.value - started) / 1000))
  return `${Math.floor(seconds / 60)} 分 ${seconds % 60} 秒`
}

const priorityDialogVisible = ref(false)
const priorityTargetRow = ref<ProductPackagingLogVO | null>(null)
const priorityValue = ref<number | null>(5)
const updatingPriority = ref(false)
const batchPriorityMode = ref(false)
const priorityTargetRows = ref<ProductPackagingLogVO[]>([])
const processedCount = ref(0)
const batchFailureSummary = ref('')

const openBatchPriorityDialog = () => {
  priorityTargetRows.value = selectedRows.value.filter(isSelectable)
  if (!priorityTargetRows.value.length) return
  batchPriorityMode.value = true
  priorityTargetRow.value = null
  priorityValue.value = 5
  processedCount.value = 0
  batchFailureSummary.value = ''
  priorityDialogVisible.value = true
}

const fetchQueue = async () => {
  loading.value = true
  try {
    const res = await getProductPackagingQueue('*')
    if (res.code === 0) {
      clearSelection()
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
  batchPriorityMode.value = false
  priorityTargetRow.value = row
  priorityValue.value = (row.priority ?? 5) as number
  priorityDialogVisible.value = true
}

const submitPriority = async () => {
  if (updatingPriority.value) return
  if (!batchPriorityMode.value && !priorityTargetRow.value) return

  const value = priorityValue.value
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value > 9) {
    ElMessage.error('优先级必须是 0-9 的整数，0 为手动插队')
    return
  }

  try {
    updatingPriority.value = true
    if (batchPriorityMode.value) {
      const targets = [...priorityTargetRows.value]
      const failed: ProductPackagingLogVO[] = []
      processedCount.value = 0
      batchFailureSummary.value = ''
      for (const row of targets) {
        try {
          const result = await updateProductPackagingQueuePriority(row.id, value)
          if (result.code !== 0) failed.push(row)
        } catch {
          failed.push(row)
        }
        processedCount.value++
      }
      const summary = `成功 ${targets.length - failed.length} 条，失败 ${failed.length} 条`
      if (failed.length) {
        batchFailureSummary.value = `${summary}。可再次确认，仅重试失败任务。`
        priorityTargetRows.value = failed
        processedCount.value = 0
        ElMessage.warning(summary)
      } else {
        ElMessage.success(summary)
        priorityDialogVisible.value = false
      }
      await fetchQueue()
      return
    }
    const res = await updateProductPackagingQueuePriority(priorityTargetRow.value!.id, value)
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

const handleRefresh = async () => {
  if (loading.value || updatingPriority.value || pausingQueue.value || pausingChannel.value || deletingChannel.value || clearingOfflineChannels.value || priorityDialogVisible.value) return
  loading.value = true
  try {
    const results = await Promise.all([
      getProductPackagingQueue('*'), getRunningProductPackagingTasks('*'),
      getProductPackagingQueuePause(), getProductPackagingDeadQueue(''), getProductPackagingQueueProtocol(), getPackagingChannels()
    ])
    if (results.some(result => result.code !== 0)) throw new Error('refresh failed')
    const [waiting, running, paused, dead, protocol, channelResult] = results
    channels.value = channelResult.data || []
    queue.value = waiting.data || []
    runningTasks.value = running.data || []
    queuePaused.value = paused.data === true
    deadCount.value = dead.data?.length || 0
    legacyWorkerActive.value = protocol.data?.legacyWorkerActive === true
    selectedRows.value = selectedRows.value.filter(row => queue.value.some(task => task.id === row.id) && isSelectable(row))
    lastUpdated.value = Date.now()
    loaded.value = true
    refreshError.value = ''
  } catch {
    refreshError.value = '刷新失败，当前数据可能已过期，请重试。'
  } finally {
    loading.value = false
  }
}

const handleClearQueueLock = async () => {
  try {
    clearingLock.value = true
    const res = await clearProductPackagingQueueLock()
    if (res.code === 0) {
      ElMessage.success('已清理旧版全局锁')
      await handleRefresh()
    } else {
      ElMessage.error(res.msg || '清理旧版全局锁失败')
    }
  } catch {
    ElMessage.error('清理旧版全局锁失败，请刷新确认实际状态')
  } finally {
    clearingLock.value = false
  }
}

const handleToggleQueuePause = async (value: boolean | string | number) => {
  if (typeof value !== 'boolean') return
  pausingQueue.value = true
  try {
    const res = await setProductPackagingQueuePause(!value)
    if (res.code !== 0) throw new Error('pause failed')
    queuePaused.value = !value
    ElMessage.success(value ? '已恢复领取新任务' : '已暂停领取新任务，执行中任务继续运行')
  } catch {
    ElMessage.error('更新暂停状态失败，请刷新确认实际状态')
  } finally {
    pausingQueue.value = false
    await handleRefresh()
  }
}

const handleToggleChannel = async (row: PackagingChannel, allowed: boolean | string | number) => {
  if (typeof allowed !== 'boolean' || loading.value || pausingChannel.value || deletingChannel.value || clearingOfflineChannels.value) return
  pausingChannel.value = row.queueId
  try {
    const res = await setPackagingChannelPause(row.queueId, !allowed)
    if (res.code !== 0) throw new Error('channel pause failed')
    row.paused = !allowed
    ElMessage.success(allowed ? `${row.queueId} 已允许领取` : `${row.queueId} 已暂停领取，当前任务继续执行`)
  } catch {
    ElMessage.error('更新队列状态失败，请刷新确认实际状态')
  } finally {
    pausingChannel.value = ''
    await handleRefresh()
  }
}

const handleClearOfflineChannels = async () => {
  if (!loaded.value || !offlineIdleChannelCount.value || loading.value || pausingQueue.value || pausingChannel.value || deletingChannel.value || clearingOfflineChannels.value || updatingPriority.value || priorityDialogVisible.value) return
  clearingOfflineChannels.value = true
  try {
    await ElMessageBox.confirm(`确定清理离线且无执行任务的队列？当前可清理 ${offlineIdleChannelCount.value} 个，实际数量以清理时状态为准。打包任务和历史记录会保留。`, '清理离线队列', {
      confirmButtonText: '清理', cancelButtonText: '取消', type: 'warning'
    })
    const res = await clearOfflinePackagingChannels()
    if (res.code !== 0) {
      ElMessage.error(res.msg || '清理离线队列失败')
    } else {
      ElMessage.success(`已清理 ${res.data} 个离线队列`)
    }
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      ElMessage.error('清理离线队列失败，请刷新确认实际状态')
    }
  } finally {
    clearingOfflineChannels.value = false
    await handleRefresh()
  }
}

const handleDeleteChannel = async (row: PackagingChannel) => {
  if (row.online || !loaded.value || loading.value || pausingQueue.value || pausingChannel.value || deletingChannel.value || clearingOfflineChannels.value) return
  deletingChannel.value = row.queueId
  try {
    await ElMessageBox.confirm(`确定删除离线队列 ${row.queueId}？打包任务和历史记录会保留；该队列重新连接后会再次登记。`, '删除队列', {
      confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning'
    })
    const res = await deletePackagingChannel(row.queueId)
    if (res.code !== 0) {
      ElMessage.error(res.msg || '删除队列失败，请刷新确认队列是否仍离线')
    } else {
      ElMessage.success('队列已删除')
    }
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      ElMessage.error('删除队列失败，请刷新确认队列是否仍离线')
    }
  } finally {
    deletingChannel.value = ''
    await handleRefresh()
  }
}

onMounted(() => {
  handleRefresh()
  refreshTimer = setInterval(() => {
    if (autoRefresh.value && !document.hidden && !selectedRows.value.length) handleRefresh()
  }, 10000)
})
onUnmounted(() => { if (refreshTimer) clearInterval(refreshTimer) })
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

.queue-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  color: #606266;
  font-size: 14px;
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

.channel-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
.queue-controls { display: flex; align-items: center; flex-wrap: wrap; gap: 16px; }
.refresh-time { color: #909399; font-size: 13px; }
.queue-summary { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; margin: 20px 0; }
.queue-summary > div, .queue-summary > a { display: flex; flex-direction: column; gap: 8px; padding: 20px; border: 1px solid #e4e7ed; border-radius: 8px; color: #606266; text-decoration: none; }
.queue-summary strong { font-size: 28px; color: #303133; }
.legacy-maintenance { padding: 16px; background: #fdf6ec; margin-bottom: 20px; color: #8a601b; }
@media (max-width: 768px) { .header { align-items: flex-start; flex-direction: column; gap: 16px; } .queue-summary { gap: 8px; } .queue-summary > div, .queue-summary > a { padding: 12px; } }
</style>
