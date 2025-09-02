<template>
  <div class="merchant-refund-page">
    <div class="page-header">
      <h2>订单退款</h2>
    </div>

    <div class="refund-form-container">
      <el-card class="refund-card">
        <template #header>
          <div class="card-header">
            <span>发起退款</span>
          </div>
        </template>
        
        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-width="120px"
          size="large"
        >
          <el-form-item label="交易ID" prop="transactionId">
            <el-input
              v-model="form.transactionId"
              placeholder="请输入交易ID，如：txn_01k43m7mxx2ga3en9s54qf696m"
              clearable
              style="width: 100%"
            />
          </el-form-item>
          
          <el-form-item label="退款原因" prop="refundReason">
            <el-input
              v-model="form.refundReason"
              type="textarea"
              :rows="4"
              placeholder="请输入退款原因（可选）"
              maxlength="500"
              show-word-limit
              style="width: 100%"
            />
          </el-form-item>
          
          <el-form-item>
            <el-button
              type="primary"
              :loading="loading"
              @click="handleSubmit"
              size="large"
            >
              {{ loading ? '处理中...' : '确认退款' }}
            </el-button>
            <el-button @click="handleReset" size="large">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>

    <!-- 退款记录区域 -->
    <div class="refund-history">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>退款记录</span>
            <el-button type="text" @click="refreshHistory">刷新</el-button>
          </div>
        </template>
        
        <!-- 搜索过滤器 -->
        <div class="search-filters">
          <el-input
            v-model="searchForm.transactionId"
            placeholder="交易ID"
            clearable
            style="width: 200px; margin-right: 12px;"
          />
          <el-input
            v-model="searchForm.refundReason"
            placeholder="退款原因"
            clearable
            style="width: 200px; margin-right: 12px;"
          />
          <el-input
            v-model="searchForm.adminUsername"
            placeholder="操作人"
            clearable
            style="width: 150px; margin-right: 12px;"
          />
          <el-select
            v-model="searchForm.refundStatus"
            placeholder="退款状态"
            clearable
            style="width: 120px; margin-right: 12px;"
          >
            <el-option label="已退款" :value="1" />
          </el-select>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleResetSearch">重置</el-button>
        </div>
        
        <el-table :data="recentRefunds" style="width: 100%" v-loading="historyLoading">
          <el-table-column prop="transactionId" label="交易ID" width="200" />
          <el-table-column prop="refundReason" label="退款原因" min-width="200">
            <template #default="{ row }">
              {{ row.refundReason || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="adminUsername" label="操作人" width="120">
            <template #default="{ row }">
              {{ row.adminUsername || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="refundStatus" label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.refundStatus)">
                {{ getStatusText(row.refundStatus) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="申请时间" width="180">
            <template #default="{ row }">
              {{ formatDateTime(row.createdAt) }}
            </template>
          </el-table-column>
        </el-table>
        
        <div class="pagination-bar">
          <el-pagination
            background
            layout="total, sizes, prev, pager, next, jumper"
            :current-page="query.pageNum"
            :page-size="query.pageSize"
            :total="total"
            :page-sizes="[10, 20, 50, 100]"
            @current-change="handlePageChange"
            @size-change="handleSizeChange"
          />
        </div>
        
        <div v-if="!historyLoading && recentRefunds.length === 0" class="empty">
          暂无退款记录
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { refundPurchase, getRefundRecordsPage, type PurchaseRefundRequest, type RefundRecordPageQueryDTO, type RefundRecordVO } from '@/api/refund'

const formRef = ref<FormInstance>()
const loading = ref(false)
const historyLoading = ref(false)
const total = ref(0)

// 表单数据
const form = reactive<PurchaseRefundRequest>({
  transactionId: '',
  refundReason: ''
})

// 表单验证规则
const rules: FormRules = {
  transactionId: [
    { required: true, message: '请输入交易ID', trigger: 'blur' },
    { min: 10, message: '交易ID长度不能少于10位', trigger: 'blur' }
  ]
}

// 退款记录数据
const recentRefunds = ref<RefundRecordVO[]>([])

// 分页查询参数
const query = ref<RefundRecordPageQueryDTO>({
  pageNum: 1,
  pageSize: 10,
  orderBy: 'createdAt desc'
})

// 搜索表单
const searchForm = reactive({
  transactionId: '',
  refundReason: '',
  adminUsername: '',
  refundStatus: undefined as number | undefined
})

// 提交退款申请
const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    const valid = await formRef.value.validate()
    if (!valid) return
  } catch {
    return
  }

  try {
    await ElMessageBox.confirm(
      `确认对交易 "${form.transactionId}" 发起退款吗？`,
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

  loading.value = true
  try {
    const res = await refundPurchase(form)
    if (res.code === 0) {
      ElMessage.success('退款申请提交成功')
      handleReset()
      fetchRefundRecords()
    } else {
      ElMessage.error(res.msg || '退款申请失败')
    }
  } catch (error) {
    ElMessage.error('退款申请失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 重置表单
const handleReset = () => {
  form.transactionId = ''
  form.refundReason = ''
  formRef.value?.clearValidate()
}

// 获取退款记录
const fetchRefundRecords = async () => {
  historyLoading.value = true
  try {
    const res = await getRefundRecordsPage(query.value)
    if (res.code === 0 && res.data) {
      recentRefunds.value = res.data.list
      total.value = res.data.total
    } else {
      ElMessage.error(res.msg || '获取退款记录失败')
    }
  } catch (error) {
    ElMessage.error('获取退款记录失败')
  } finally {
    historyLoading.value = false
  }
}

// 刷新退款记录
const refreshHistory = () => {
  fetchRefundRecords()
}

// 获取状态类型
const getStatusType = (status: number) => {
  switch (status) {
    case 1:
      return 'success'
    default:
      return 'warning'
  }
}

// 获取状态文本
const getStatusText = (status: number) => {
  switch (status) {
    case 1:
      return '已退款'
    default:
      return '处理中'
  }
}

// 格式化日期时间
const formatDateTime = (date: string) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

// 搜索处理
const handleSearch = () => {
  // 将搜索条件合并到查询参数中
  Object.assign(query.value, {
    pageNum: 1,
    transactionId: searchForm.transactionId || undefined,
    refundReason: searchForm.refundReason || undefined,
    adminUsername: searchForm.adminUsername || undefined,
    refundStatus: searchForm.refundStatus
  })
  fetchRefundRecords()
}

const handleResetSearch = () => {
  // 重置搜索表单
  searchForm.transactionId = ''
  searchForm.refundReason = ''
  searchForm.adminUsername = ''
  searchForm.refundStatus = undefined
  
  // 重置查询参数
  query.value = {
    pageNum: 1,
    pageSize: query.value.pageSize,
    orderBy: 'createdAt desc'
  }
  fetchRefundRecords()
}

// 分页处理
const handlePageChange = (page: number) => {
  query.value.pageNum = page
  fetchRefundRecords()
}

const handleSizeChange = (size: number) => {
  query.value.pageSize = size
  query.value.pageNum = 1
  fetchRefundRecords()
}

onMounted(() => {
  fetchRefundRecords()
})
</script>

<style scoped>
.merchant-refund-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.pagination-bar {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.search-filters {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 8px;
}

.refund-form-container {
  flex-shrink: 0;
}

.refund-card {
  max-width: 600px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 500;
}

.refund-history {
  flex: 1;
  min-height: 0;
}

.empty {
  text-align: center;
  color: #999;
  padding: 40px 0;
  font-size: 14px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
}

:deep(.el-card__body) {
  padding: 24px;
}

:deep(.el-table) {
  font-size: 14px;
}

:deep(.el-button--large) {
  padding: 12px 24px;
  font-size: 14px;
}
</style>
