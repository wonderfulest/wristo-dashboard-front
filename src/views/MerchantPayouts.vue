<template>
  <div class="merchant-payouts-page">
    <div class="page-header">
      <h2>结算管理</h2>
      <div class="actions">
        <el-button :loading="loading" @click="fetchData">刷新</el-button>
      </div>
    </div>

    <div class="filters">
      <el-input
        v-model="query.username"
        clearable
        placeholder="按用户名搜索"
        style="width: 220px; margin-right: 12px;"
      />
      <el-select v-model="sortField" placeholder="排序字段" style="width: 200px; margin-right: 12px;">
        <el-option label="累计收入($)" value="total_income_to_date" />
        <el-option label="当前可提现($)" value="current_balance" />
      </el-select>
      <el-select v-model="sortOrder" placeholder="排序" style="width: 140px; margin-right: 12px;">
        <el-option label="降序" value="desc" />
        <el-option label="升序" value="asc" />
      </el-select>
      <el-button type="primary" @click="handleSearch">查询</el-button>
      <el-button @click="handleReset">重置</el-button>
    </div>

    <el-table :data="rows" style="width: 100%" :loading="loading">
      <el-table-column prop="id" label="ID" width="80" >
        <template #default="{ row }">
          {{ row.user?.id ?? row.id }}
        </template>
      </el-table-column>
      <!-- <el-table-column label="头像" width="80">
        <template #default="{ row }">
          <el-avatar v-if="row.user?.avatar" :src="row.user?.avatar" :size="24" />
        </template>
      </el-table-column> -->
      <el-table-column label="用户名" min-width="100">
        <template #default="{ row }">
          <span class="username">{{ row.user?.username || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="累计收入($)" min-width="120" header-align="right" align="right">
        <template #default="{ row }">
          {{ formatMoney(row.totalIncomeToDate) }}
        </template>
      </el-table-column>
      <el-table-column label="当前可提现($)" min-width="120" header-align="right" align="right">
        <template #default="{ row }">
          {{ formatMoney(row.currentBalance) }}
        </template>
      </el-table-column>
      <el-table-column label="下次应结($)" min-width="120" header-align="right" align="right">
        <template #default="{ row }">
          {{ formatMoney(row.nextPayoutAmount) }}
        </template>
      </el-table-column>
      <el-table-column label="打款方式" min-width="120">
        <template #default="{ row }">
          {{ row.payoutMethod }}
        </template>
      </el-table-column>
      <el-table-column label="打款账号" min-width="120">
        <template #default="{ row }">
          {{ row.payoutAccount }}
        </template>
      </el-table-column>
      <el-table-column prop="nextPayDay" label="下个结算日" width="100" />
      <el-table-column label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="statusType(row.payoutStatus)">{{ row.payoutStatusDesc || row.payoutStatus }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="updatedAt" label="更新时间" width="180" >
        <template #default="{ row }">
          {{ formatDateTime(row.updatedAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" fixed="right" width="200">
        <template #default="{ row }">
          <el-button
            size="small"
            type="success"
            :disabled="!canPay(row) || payLoadingId === row.userId"
            :loading="payLoadingId === row.userId"
            @click="handlePay(row)"
            style="margin-left: 8px;"
          >支付</el-button>
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

    <div v-if="!loading && rows.length === 0" class="empty">
      暂无结算数据
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { pagePayouts, handlePayoutPaid, type PayoutPageQueryDTO } from '@/api/payout'
import type { PayoutVO } from '@/types/payout'

const loading = ref(false)
const rows = ref<PayoutVO[]>([])
const total = ref(0)

const query = ref<PayoutPageQueryDTO>({
  pageNum: 1,
  pageSize: 20,
  orderBy: 'total_income_to_date desc',
})

const sortField = ref<'total_income_to_date' | 'current_balance'>('total_income_to_date')
const sortOrder = ref<'asc' | 'desc'>('desc')

const updateOrderBy = () => {
  query.value.orderBy = `${sortField.value} ${sortOrder.value}`
}

const fetchData = async () => {
  loading.value = true
  try {
    const res = await pagePayouts(query.value)
    if (res.code === 0 && res.data) {
      rows.value = res.data.list
      total.value = res.data.total
    } else {
      ElMessage.error(res.msg || '获取结算列表失败')
    }
  } catch (e) {
    ElMessage.error('获取结算列表失败')
  } finally {
    loading.value = false
  }
}

const statusType = (status?: string) => {
  switch ((status || '').toLowerCase()) {
    case 'paid':
      return 'success'
    case 'pending':
      return 'warning'
    case 'failed':
      return 'danger'
    default:
      return ''
  }
}

const formatMoney = (val?: number) => {
  if (val == null) return '-'

    return `${val.toFixed(2)}`
}

const formatDateTime = (date?: string) => {
  if (!date) return '-'
  return new Date(date).toLocaleString()
}

onMounted(fetchData)

const handlePageChange = (page: number) => {
  query.value.pageNum = page
  fetchData()
}

const handleSizeChange = (size: number) => {
  query.value.pageSize = size
  query.value.pageNum = 1
  fetchData()
}

const handleSearch = () => {
  updateOrderBy()
  query.value.pageNum = 1
  fetchData()
}

const handleReset = () => {
  sortField.value = 'total_income_to_date'
  sortOrder.value = 'desc'
  query.value = {
    pageNum: 1,
    pageSize: query.value.pageSize,
    orderBy: 'total_income_to_date desc',
    username: undefined,
  }
  fetchData()
}

// 支付按钮可用性：仅当状态为 settled（兼容后端可能的拼写 'setteld'）
const canPay = (row: PayoutVO) => {
  const s = (row.payoutStatus || '').toLowerCase()
  return s === 'settled' || s === 'setteld'
}

// 当前支付中的 userId（用于行内 loading/disable）
const payLoadingId = ref<number | null>(null)

const handlePay = async (row: PayoutVO) => {
  if (!canPay(row)) return
  try {
    await ElMessageBox.confirm(
      `确认为用户 “${row.user?.username ?? row.userId}” 进行打款吗？`,
      '确认支付',
      { type: 'warning', confirmButtonText: '确认', cancelButtonText: '取消' }
    )
  } catch {
    return
  }

  payLoadingId.value = row.userId
  try {
    const res = await handlePayoutPaid(row.userId)
    if (res.code === 0 && res.data) {
      ElMessage.success('打款成功')
      fetchData()
    }
  } catch (e) {
    // axios 拦截器已提示错误
  } finally {
    payLoadingId.value = null
  }
}
</script>

<style scoped>
.merchant-payouts-page {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.user-cell {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.username {
  font-weight: 500;
}

.empty {
  text-align: center;
  color: #999;
  padding: 24px 0;
}

.filters {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.pagination-bar {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}
</style>
