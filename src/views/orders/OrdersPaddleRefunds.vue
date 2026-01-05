<template>
  <div class="paddle-refunds-page">
    <div class="page-header">
      <h2>Paddle 退款查询</h2>
    </div>

    <el-card class="search-card">
      <template #header>
        <div class="card-header">
          <span>查询条件</span>
        </div>
      </template>

      <div class="search-form">
        <el-input
          v-model="queryForm.id"
          placeholder="Adjustment ID"
          clearable
          style="width: 260px; margin-right: 12px;"
        />
        <el-input
          v-model="queryForm.transaction_id"
          placeholder="Transaction ID"
          clearable
          style="width: 320px; margin-right: 12px;"
        />
        <el-input
          v-model="queryForm.customer_id"
          placeholder="Customer ID"
          clearable
          style="width: 260px; margin-right: 12px;"
        />
        <el-button type="primary" :loading="loading" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>
    </el-card>

    <el-card class="result-card" style="margin-top: 16px;">
      <template #header>
        <div class="card-header">
          <span>调整记录（退款等）</span>
        </div>
      </template>

      <el-table :data="rows" v-loading="loading" style="width: 100%">
        <el-table-column prop="id" label="ID" width="220" />
        <el-table-column prop="type" label="类型" width="120" />
        <el-table-column prop="action" label="动作" width="120" />
        <el-table-column prop="transaction_id" label="交易ID" width="220" />
        <el-table-column prop="customer_id" label="客户ID" width="220" />
        <el-table-column prop="reason" label="原因" min-width="200">
          <template #default="{ row }">
            {{ row.reason || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="140">
          <template #default="{ row }">
            <el-tag size="small" :type="isRefunded(row) ? 'success' : 'info'">
              {{ isRefunded(row) ? '本地已退款' : (row.status || '-') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleDownloadCreditNote(row)">
              打印 PDF 凭证
            </el-button>
            <el-button type="danger" link size="small" :disabled="isRefunded(row)" @click="openRefundDialog(row)">
              发起退款
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-bar">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next, jumper"
          :current-page="page"
          :page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>

      <div v-if="!loading && rows.length === 0" class="empty">
        暂无记录
      </div>
    </el-card>

    <el-dialog v-model="refundDialogVisible" title="发起退款" width="520px">
      <el-form
        ref="refundFormRef"
        :model="refundForm"
        :rules="refundRules"
        label-width="100px"
        size="large"
      >
        <el-form-item label="交易ID" prop="transactionId">
          <el-input
            v-model="refundForm.transactionId"
            placeholder="请输入交易ID"
            clearable
          />
        </el-form-item>
        <el-form-item label="退款原因" prop="refundReason">
          <el-input
            v-model="refundForm.refundReason"
            type="textarea"
            :rows="4"
            placeholder="请输入退款原因（可选）"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="refundDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="refundSubmitting" @click="handleSubmitRefund">
          {{ refundSubmitting ? '处理中...' : '确认退款' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { listPaddleAdjustments, getPaddleCreditNotePdf, type PaddleAdjustmentQuery } from '@/api/paddle'
import { refundPurchase, type PurchaseRefundRequest } from '@/api/refund'

interface PaddleAdjustmentItem {
  id: string
  type?: string
  action?: string
  transaction_id?: string
  subscription_id?: string
  customer_id?: string
  reason?: string
  status?: string
  created_at?: string
}

interface LocalRefundRecord {
  id: number
  transactionId: string
  refundAmount?: string | number
  currencyCode?: string
  refundReason?: string
  adminUsername?: string
  refundStatus?: number
  createdAt?: string
  updatedAt?: string
}

const loading = ref(false)
const rows = ref<PaddleAdjustmentItem[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const refundRecordsByTxnId = ref<Record<string, LocalRefundRecord>>({})

const queryForm = reactive<PaddleAdjustmentQuery>({
  id: '',
  transaction_id: '',
  customer_id: '',
  page: 1,
  per_page: 20,
})

const refundDialogVisible = ref(false)
const refundSubmitting = ref(false)
const refundFormRef = ref<FormInstance>()
const refundForm = reactive<PurchaseRefundRequest>({
  transactionId: '',
  refundReason: ''
})

const refundRules: FormRules = {
  transactionId: [
    { required: true, message: '请输入交易ID', trigger: 'blur' },
    { min: 10, message: '交易ID长度不能少于10位', trigger: 'blur' }
  ]
}

const fetchData = async () => {
  loading.value = true
  try {
    const params: PaddleAdjustmentQuery = {
      id: queryForm.id || undefined,
      transaction_id: queryForm.transaction_id || undefined,
      customer_id: queryForm.customer_id || undefined,
      page: page.value,
      per_page: pageSize.value,
    }
    const res: any = await listPaddleAdjustments(params)
    const root = res?.data?.data ?? res?.data
    const adjustments = root?.adjustments
    const list: PaddleAdjustmentItem[] = Array.isArray(adjustments?.data)
      ? adjustments.data
      : (Array.isArray(adjustments) ? adjustments : [])
    rows.value = list

    refundRecordsByTxnId.value = root?.refundRecordsByTxnId || {}
    // Paddle 默认没有 total，这里简单用当前列表长度，后续可按 meta 调整
    total.value = list.length
  } catch (e: any) {
    ElMessage.error(e?.message || '获取 Paddle 调整记录失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  page.value = 1
  fetchData()
}

const handleReset = () => {
  queryForm.id = ''
  queryForm.transaction_id = ''
  queryForm.customer_id = ''
  page.value = 1
  pageSize.value = 20
  fetchData()
}

const handlePageChange = (p: number) => {
  page.value = p
  fetchData()
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  page.value = 1
  fetchData()
}

const formatDateTime = (value?: string) => {
  if (!value) return '-'
  return new Date(value).toLocaleString('zh-CN')
}

const isRefunded = (row: PaddleAdjustmentItem): boolean => {
  if (!row.transaction_id) return false
  const record = refundRecordsByTxnId.value[row.transaction_id]
  if (!record) return false
  return record.refundStatus === 1
}

const handleDownloadCreditNote = async (row: PaddleAdjustmentItem) => {
  if (!row.id) {
    ElMessage.error('缺少 adjustment ID')
    return
  }
  try {
    const res: any = await getPaddleCreditNotePdf(row.id)
    const data = res?.data?.data ?? res?.data
    const url = data?.data?.url || data?.url
    if (!url) {
      ElMessage.error('未获取到 PDF 链接')
      return
    }
    // 直接用浏览器打开 / 下载
    window.open(url, '_blank')
  } catch (e: any) {
    ElMessage.error(e?.message || '下载 PDF 凭证失败')
  }
}

const openRefundDialog = (row: PaddleAdjustmentItem) => {
  refundForm.transactionId = row.transaction_id || ''
  refundForm.refundReason = ''
  refundDialogVisible.value = true
}

const handleSubmitRefund = async () => {
  if (!refundFormRef.value) return

  try {
    const valid = await refundFormRef.value.validate()
    if (!valid) return
  } catch {
    return
  }

  try {
    await ElMessageBox.confirm(
      `确认对交易 "${refundForm.transactionId}" 发起退款吗？`,
      '确认退款',
      {
        type: 'warning',
        confirmButtonText: '确认退款',
        cancelButtonText: '取消'
      }
    )
  } catch {
    return
  }

  refundSubmitting.value = true
  try {
    const payload: PurchaseRefundRequest = {
      transactionId: refundForm.transactionId,
      refundReason: refundForm.refundReason || undefined
    }
    const res = await refundPurchase(payload)
    if ((res as any).code === 0) {
      ElMessage.success('退款申请提交成功')
      refundDialogVisible.value = false
    } else {
      ElMessage.error((res as any).msg || '退款申请失败')
    }
  } catch (e) {
    ElMessage.error('退款申请失败，请稍后重试')
  } finally {
    refundSubmitting.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.paddle-refunds-page {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.search-card,
.result-card {
  margin-bottom: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-form {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.pagination-bar {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.empty {
  text-align: center;
  color: #999;
  padding: 32px 0;
}
</style>
