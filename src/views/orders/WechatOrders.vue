<template>
  <div class="wechat-orders">
    <OrderTabs />
    <h2>微信订单</h2>
    <p class="hint">包含已有订单 · 早期订单可切换来源查看 · 金额为人民币 · 时间为北京时间</p>
    <el-form :inline="true" @submit.prevent="search">
      <el-form-item label="订单来源"><el-select v-model="source" style="width: 200px" @change="search">
        <el-option label="国内微信订单（含历史）" value="DOMESTIC" />
        <el-option label="早期微信订单" value="LEGACY" />
      </el-select></el-form-item>
      <el-form-item label="订单号"><el-input v-model="orderNo" placeholder="完整订单号" clearable maxlength="32" /></el-form-item>
      <el-form-item label="用户 ID"><el-input v-model="userId" placeholder="用户 ID" clearable /></el-form-item>
      <el-form-item label="状态"><el-select v-model="status" placeholder="全部状态" clearable style="width: 180px">
        <el-option v-for="(label, value) in statuses" :key="value" :label="label" :value="value" />
      </el-select></el-form-item>
      <el-form-item label="下单日期"><el-date-picker v-model="dates" type="daterange" value-format="YYYY-MM-DD" start-placeholder="开始日期" end-placeholder="结束日期" /></el-form-item>
      <el-form-item><el-button type="primary" native-type="submit" :loading="loading">查询</el-button><el-button @click="reset">重置</el-button></el-form-item>
    </el-form>
    <el-alert v-if="error" :title="error" type="error" :closable="false" show-icon />
    <el-table v-loading="loading" :data="records" empty-text="暂无微信订单" style="width: 100%">
      <el-table-column prop="orderNo" label="订单号" min-width="260" />
      <el-table-column prop="userId" label="用户 ID" width="110" />
      <el-table-column prop="name" label="会员套餐" min-width="160" />
      <el-table-column label="金额" width="110"><template #default="{ row }">{{ money(row.amountFen) }}</template></el-table-column>
      <el-table-column label="状态" width="160"><template #default="{ row }"><el-tag :type="row.status === 'PAID' ? 'success' : row.status === 'PAID_PENDING_GRANT' ? 'warning' : 'info'">{{ statuses[row.status] || row.status }}</el-tag></template></el-table-column>
      <el-table-column label="下单时间" width="180"><template #default="{ row }">{{ time(row.createdAt) }}</template></el-table-column>
      <el-table-column label="支付时间" width="180"><template #default="{ row }">{{ time(row.paidAt) }}</template></el-table-column>
      <el-table-column label="操作" width="85" fixed="right"><template #default="{ row }"><el-button link type="primary" @click="selected = row">详情</el-button></template></el-table-column>
    </el-table>
    <el-pagination :current-page="page" :page-size="20" :total="total" layout="total, prev, pager, next" @current-change="load" />
    <el-dialog :model-value="!!selected" title="微信订单详情" width="min(640px, 94vw)" @close="selected = null">
      <el-descriptions v-if="selected" :column="1" border>
        <el-descriptions-item label="订单号">{{ selected.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="用户 ID">{{ selected.userId }}</el-descriptions-item>
        <el-descriptions-item label="会员套餐">{{ selected.name }}（{{ selected.planCode }}）</el-descriptions-item>
        <el-descriptions-item label="会员时长">{{ selected.durationDays === -1 ? '永久' : selected.durationDays + ' 天' }}</el-descriptions-item>
        <el-descriptions-item label="支付金额">{{ money(selected.amountFen) }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ statuses[selected.status] || selected.status }}</el-descriptions-item>
        <el-descriptions-item label="微信交易号">{{ selected.transactionId || '—' }}</el-descriptions-item>
        <el-descriptions-item label="会员订阅 ID">{{ selected.subscriptionId ?? '—' }}</el-descriptions-item>
        <el-descriptions-item label="下单时间">{{ time(selected.createdAt) }}</el-descriptions-item>
        <el-descriptions-item label="支付时间">{{ time(selected.paidAt) }}</el-descriptions-item>
        <el-descriptions-item label="支付截止时间">{{ time(selected.expiresAt) }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getWechatOrders, type WechatOrder, type WechatOrderQuery } from '@/api/wechatOrders'
import OrderTabs from './OrderTabs.vue'
const statuses: Record<string, string> = { PENDING: '待支付', PAID_PENDING_GRANT: '已支付待开通', PAID: '已完成', CLOSED: '已关闭' }
const source = ref<'DOMESTIC' | 'LEGACY'>('DOMESTIC')
let activeSource: 'DOMESTIC' | 'LEGACY' = 'DOMESTIC'
const orderNo = ref(''), userId = ref(''), status = ref('')
const dates = ref<string[] | null>(null)
const records = ref<WechatOrder[]>([]), selected = ref<WechatOrder | null>(null)
const loading = ref(false), error = ref(''), page = ref(1), total = ref(0)
let epoch = 0
let filters: Omit<WechatOrderQuery, 'pageNum' | 'pageSize'> = {}
const money = (fen: number) => new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(fen / 100)
const time = (value: string | null) => {
  if (!value) return '—'
  const normalized = /(?:Z|[+-]\d{2}:?\d{2})$/.test(value) ? value : value + 'Z'
  return new Date(normalized).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false })
}
async function load(next = 1) {
  const request = ++epoch
  loading.value = true; error.value = ''; selected.value = null
  try {
    const result = await getWechatOrders({ ...filters, pageNum: next, pageSize: 20 }, activeSource)
    if (request !== epoch) return
    if (!result.data) throw new Error('订单响应为空')
    records.value = result.data.records; total.value = result.data.total; page.value = next
  } catch {
    if (request !== epoch) return
    records.value = []; total.value = 0; error.value = '微信订单加载失败，请重新查询。'
  } finally { if (request === epoch) loading.value = false }
}
function search() {
  if (userId.value && (!/^[1-9]\d*$/.test(userId.value) || !Number.isSafeInteger(Number(userId.value)))) {
    error.value = '请输入有效的用户 ID'; return
  }
  activeSource = source.value
  filters = { orderNo: orderNo.value.trim() || undefined, userId: userId.value ? Number(userId.value) : undefined, status: status.value || undefined }
  if (dates.value?.length === 2) {
    // Date filters are Beijing calendar days; database timestamps are UTC, with an exclusive end.
    filters.createdFrom = new Date(dates.value[0] + 'T00:00:00+08:00').toISOString().slice(0, 19)
    filters.createdTo = new Date(Date.parse(dates.value[1] + 'T00:00:00+08:00') + 86400000).toISOString().slice(0, 19)
  }
  void load(1)
}
function reset() { orderNo.value = ''; userId.value = ''; status.value = ''; dates.value = null; search() }
onMounted(() => load())
</script>
<style scoped>
.wechat-orders { padding: 24px; min-width: 0; }
.hint { color: #606266; margin-bottom: 20px; }
.el-pagination { margin-top: 20px; }
.el-alert { margin-bottom: 16px; }
</style>
