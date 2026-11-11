<template>
  <section class="custom-orders">
    <div class="page-heading"><div><h1>定制订单</h1><p>查看客户需求和素材，跟进付款与交付。</p></div><el-button :loading="loading" @click="load">刷新</el-button></div>
    <div class="plans"><span><b>$9.90</b> 安装包交付 · 指定型号，不上架</span><span><b>$19.90</b> 包上架交付 · Garmin Connect IQ 商店</span></div>
    <div class="filters"><el-input v-model="search" clearable placeholder="搜索订单号、邮箱或型号" @keyup.enter="searchOrders" @clear="searchOrders" />
      <el-select v-model="paymentStatus" clearable placeholder="付款状态" @change="searchOrders"><el-option v-for="(label, value) in paymentLabels" :key="value" :label="label" :value="value" /></el-select>
      <el-select v-model="workStatus" clearable placeholder="制作状态" @change="searchOrders"><el-option v-for="(label, value) in workLabels" :key="value" :label="label" :value="value" /></el-select><el-button type="primary" @click="searchOrders">查询</el-button>
    </div>
    <el-alert v-if="loadError" type="error" title="订单加载失败，请点击刷新重试。" :closable="false" />
    <el-table v-loading="loading" :data="rows" stripe empty-text="暂无定制订单" @row-dblclick="openDetail">
      <el-table-column label="订单 / 时间" min-width="210"><template #default="{ row }"><div class="order-id">{{ row.id }}</div><small>{{ row.createdAt }}</small></template></el-table-column>
      <el-table-column prop="email" label="客户邮箱" min-width="200" show-overflow-tooltip />
      <el-table-column label="交付方案" min-width="145"><template #default="{ row }">{{ planName(row.planCode) }}<div class="price">${{ (row.priceCents / 100).toFixed(2) }} {{ row.currency }}</div></template></el-table-column>
      <el-table-column prop="deviceModel" label="手表型号" min-width="150" show-overflow-tooltip />
      <el-table-column label="付款状态" width="125"><template #default="{ row }"><el-tag :type="row.paymentStatus === 'PAID' ? 'success' : row.paymentStatus === 'PAYMENT_REVIEW' ? 'danger' : 'info'">{{ paymentLabels[row.paymentStatus] || row.paymentStatus }}</el-tag></template></el-table-column>
      <el-table-column label="制作状态" width="115"><template #default="{ row }">{{ workLabels[row.workStatus] || row.workStatus }}</template></el-table-column>
      <el-table-column label="操作" width="110" fixed="right"><template #default="{ row }"><el-button link type="primary" @click="openDetail(row)">查看订单</el-button></template></el-table-column>
    </el-table>
    <el-pagination v-model:current-page="pageNum" class="pagination" :page-size="20" :total="total" layout="total, prev, pager, next" @current-change="load" />
    <el-drawer v-model="drawer" title="定制订单详情" size="min(680px, 100vw)" @closed="clearPreview">
      <template v-if="selected"><div class="detail-title"><el-tag>{{ planName(selected.planCode) }}</el-tag><strong>${{ (selected.priceCents / 100).toFixed(2) }} USD</strong></div>
        <el-descriptions :column="1" border><el-descriptions-item label="订单号">{{ selected.id }}</el-descriptions-item><el-descriptions-item label="用户 ID">{{ selected.userId }}</el-descriptions-item><el-descriptions-item label="联系邮箱">{{ selected.email }}</el-descriptions-item><el-descriptions-item label="指定型号">{{ selected.deviceModel }}</el-descriptions-item><el-descriptions-item label="付款状态">{{ paymentLabels[selected.paymentStatus] || selected.paymentStatus }}</el-descriptions-item><el-descriptions-item label="支付交易">{{ selected.transactionId || '尚未创建' }}</el-descriptions-item><el-descriptions-item label="提交时间">{{ selected.createdAt }}</el-descriptions-item></el-descriptions>
        <h3>需求说明</h3><p class="requirements">{{ selected.requirements }}</p>
        <h3>客户素材</h3><div class="attachments"><el-button :loading="downloading" @click="download('assets')">下载素材包 · {{ selected.assetName }}</el-button><el-button v-if="selected.previewName" :loading="downloading" @click="download('preview')">下载预览图</el-button></div>
        <div v-if="selected.previewName" class="preview"><p v-if="previewLoading">正在加载预览图…</p><img v-else-if="previewUrl" :src="previewUrl" alt="客户提供的表盘预览图" /><el-button v-else @click="loadPreview">重试加载预览图</el-button></div><p v-else class="muted">客户未提供预览图</p>
        <h3>订单处理</h3><el-alert v-if="selected.paymentStatus !== 'PAID'" type="warning" title="付款未确认或需要核查，暂不能开始制作。" :closable="false" />
        <el-form label-position="top" class="edit-form"><el-form-item label="制作状态"><el-select v-model="editStatus" :disabled="selected.paymentStatus !== 'PAID'"><el-option label="待处理" value="PENDING" /><el-option label="制作中" value="IN_PROGRESS" /><el-option label="已完成" value="COMPLETED" /></el-select></el-form-item><el-form-item label="内部备注（客户不可见）"><el-input v-model="note" type="textarea" :rows="4" maxlength="5000" show-word-limit :disabled="selected.paymentStatus !== 'PAID'" /></el-form-item></el-form>
        <div class="actions"><el-button type="primary" :loading="saving" :disabled="selected.paymentStatus !== 'PAID'" @click="save">保存处理状态</el-button><el-button :loading="syncing" :disabled="!selected.transactionId" @click="sync">核验付款</el-button></div>
      </template>
    </el-drawer>
  </section>
</template>
<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { pageCustomOrders, updateCustomOrder, syncCustomOrder, customOrderAttachment, type CustomOrder } from '@/api/custom-orders'
const paymentLabels: Record<string, string> = { UNPAID: '未付款', CREATING: '付款准备中', CREATE_FAILED: '付款创建失败', PENDING: '待付款', PAID: '已付款', CANCELED: '付款已取消', PAYMENT_REVIEW: '付款待核查' }
const workLabels: Record<string, string> = { AWAITING_PAYMENT: '等待付款', PENDING: '待处理', IN_PROGRESS: '制作中', COMPLETED: '已完成' }
const planName = (code: string) => code === 'PACKAGE' ? '安装包交付' : '包上架交付'
const rows = ref<CustomOrder[]>([]), total = ref(0), pageNum = ref(1), search = ref(''), paymentStatus = ref(''), workStatus = ref('')
const loading = ref(false), loadError = ref(false), drawer = ref(false), selected = ref<CustomOrder | null>(null), editStatus = ref('PENDING'), note = ref('')
const saving = ref(false), syncing = ref(false), downloading = ref(false), previewLoading = ref(false), previewUrl = ref('')
let previewGeneration = 0
let loadGeneration = 0
async function load() {
  const generation = ++loadGeneration
  loading.value = true; loadError.value = false
  try {
    const result = await pageCustomOrders({ pageNum: pageNum.value, pageSize: 20, search: search.value, paymentStatus: paymentStatus.value, workStatus: workStatus.value })
    if (!result.data) throw new Error('Missing order data')
    if (generation === loadGeneration) { rows.value = result.data.list; total.value = result.data.total }
  } catch { if (generation === loadGeneration) loadError.value = true } finally { if (generation === loadGeneration) loading.value = false }
}
function searchOrders() { pageNum.value = 1; void load() }
function clearPreview() { previewGeneration++; if (previewUrl.value) URL.revokeObjectURL(previewUrl.value); previewUrl.value = ''; previewLoading.value = false }
function openDetail(order: CustomOrder) {
  clearPreview(); selected.value = order; editStatus.value = order.workStatus === 'AWAITING_PAYMENT' ? 'PENDING' : order.workStatus; note.value = order.adminNote || ''; drawer.value = true
  if (order.previewName) void loadPreview()
}
async function loadPreview() {
  if (!selected.value) return
  const generation = ++previewGeneration; const order = selected.value; previewLoading.value = true
  try {
    const blob = await customOrderAttachment(order.id, 'preview')
    if (generation !== previewGeneration) return
    const extension = order.previewName?.split('.').pop()?.toLowerCase()
    const type = extension === 'png' ? 'image/png' : extension === 'webp' ? 'image/webp' : 'image/jpeg'
    previewUrl.value = URL.createObjectURL(new Blob([blob], { type }))
  } catch { if (generation === previewGeneration) ElMessage.error('预览图加载失败') } finally { if (generation === previewGeneration) previewLoading.value = false }
}
async function download(kind: 'assets' | 'preview') {
  if (!selected.value || downloading.value) return
  const order = selected.value; downloading.value = true
  try { const blob = await customOrderAttachment(order.id, kind); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = (kind === 'assets' ? order.assetName : order.previewName) || 'attachment'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000) } catch { ElMessage.error('下载失败，请重试') } finally { downloading.value = false }
}
async function save() {
  if (!selected.value) return
  saving.value = true
  try { const result = await updateCustomOrder(selected.value.id, { workStatus: editStatus.value, adminNote: note.value }); if (!result.data) throw new Error('Missing order data'); selected.value = result.data; ElMessage.success('处理状态已保存'); await load() } catch { /* API interceptor displays the error. */ } finally { saving.value = false }
}
async function sync() {
  if (!selected.value) return
  syncing.value = true
  try { const result = await syncCustomOrder(selected.value.id); if (!result.data) throw new Error('Missing order data'); selected.value = result.data; editStatus.value = result.data.workStatus === 'AWAITING_PAYMENT' ? 'PENDING' : result.data.workStatus; await load(); ElMessage.success('付款状态已核验') } catch { /* API interceptor displays the error. */ } finally { syncing.value = false }
}
onMounted(load)
onBeforeUnmount(clearPreview)
</script>
<style scoped>
.custom-orders { padding: 24px; }.page-heading { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }h1 { margin: 0 0 8px; font-size: 24px; }.page-heading p,.muted { margin: 0; color: #7b8490; font-size: 13px; }.plans { display: flex; flex-wrap: wrap; gap: 16px; padding: 16px 20px; background: #f4f6f8; border-radius: 8px; margin-bottom: 20px; font-size: 13px; }.plans b { margin-right: 8px; color: #1e4634; }.filters { display: flex; gap: 12px; margin-bottom: 18px; }.filters .el-input { max-width: 320px; }.filters .el-select { width: 160px; }small { color: #909399; }.order-id { font-size: 11px; margin-bottom: 5px; }.price { margin-top: 5px; font-size: 12px; color: #909399; }.pagination { margin-top: 20px; justify-content: flex-end; }.detail-title { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }.detail-title strong { font-size: 24px; }h3 { margin: 28px 0 14px; font-size: 15px; }.requirements { white-space: pre-wrap; overflow-wrap: anywhere; line-height: 1.8; background: #f7f8fa; padding: 16px; border-radius: 8px; }.attachments { display: flex; flex-wrap: wrap; gap: 10px; }.attachments .el-button { margin: 0; max-width: 100%; height: auto; min-height: 32px; white-space: normal; }.preview { margin-top: 16px; }.preview img { max-width: 100%; max-height: 360px; object-fit: contain; }.edit-form { margin-top: 20px; }.actions { display: flex; gap: 12px; }.muted { margin-top: 14px; }@media(max-width: 700px) { .custom-orders { padding: 16px; }.filters { flex-wrap: wrap; }.filters .el-input { max-width: none; }.plans { flex-direction: column; } }
</style>
