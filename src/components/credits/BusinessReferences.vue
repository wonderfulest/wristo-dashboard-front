<template>
  <div class="business-references">
    <template v-for="reference in references" :key="`${reference.kind}:${reference.id}`">
      <el-button v-if="canOpen(reference)" link type="primary" :title="reference.id" @click="open(reference)">{{ reference.label || kindLabels[reference.kind] }}</el-button>
      <span v-else class="reference-id" :title="reference.id">{{ reference.label || kindLabels[reference.kind] || '业务编号' }}：{{ reference.id }}</span>
    </template>
    <span v-if="!references.length" class="reference-id">—</span>
    <el-drawer v-model="visible" :title="detail?.title || '关联业务详情'" size="min(680px, 96vw)" append-to-body @closed="clear">
      <div class="business-detail" v-loading="loading">
        <div class="detail-context"><span>用户 {{ selected?.userId }}</span><span>业务编号 {{ selected?.reference.id }}</span></div>
        <el-alert v-if="error" :title="error" type="error" :closable="false" show-icon />
        <el-button v-if="error" :loading="loading" @click="load">重新查询</el-button>
        <template v-if="detail">
          <p class="detail-note">只读业务记录，时间按北京时间展示。未记录的用量与成本不计为零。</p>
          <el-descriptions :column="1" border>
            <el-descriptions-item v-for="field in detail.fields" :key="field.key" :label="field.label" label-width="150px">
              <router-link v-if="field.key === 'pricingVersion' && field.value" :to="{ path: '/ops/ai-prices', query: { version: field.value } }">{{ field.value }} ↗</router-link>
              <span v-else class="field-value">{{ display(field) }}</span>
            </el-descriptions-item>
          </el-descriptions>
          <div v-if="ledgerLink" class="detail-actions"><router-link :to="ledgerLink">查看对应流水 →</router-link></div>
        </template>
      </div>
    </el-drawer>
  </div>
</template>
<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { businessReferenceLedgerLink } from '@/utils/pointsBusinessReference'
import { getPointsBusinessReference, type BusinessReference, type BusinessReferenceDetail, type BusinessReferenceField, type BusinessDetailKind } from '@/api/pointsReferences'

const props = defineProps<{ references: BusinessReference[]; userId: string | number }>()
const kindLabels: Record<string, string> = { AI_CALL: 'AI 调用', CREDIT_PURCHASE: '点数购买', REDEMPTION: '积分兑换', SOCIAL_SHARE: '分享审核', APP: '应用' }
const detailKinds: readonly string[] = ['AI_CALL', 'CREDIT_PURCHASE', 'REDEMPTION', 'SOCIAL_SHARE']
const visible = ref(false), loading = ref(false), error = ref('')
const selected = ref<{ reference: BusinessReference; userId: string }>()
const detail = ref<BusinessReferenceDetail>()
let sequence = 0
const canOpen = (reference: BusinessReference) => detailKinds.includes(reference.kind) && !!reference.id && /^[1-9]\d*$/.test(String(props.userId))
function open(reference: BusinessReference) {
  selected.value = { reference: { ...reference }, userId: String(props.userId) }
  visible.value = true
  void load()
}
async function load() {
  if (!selected.value) return
  const current = selected.value, request = ++sequence
  loading.value = true; error.value = ''; detail.value = undefined
  try {
    const result = await getPointsBusinessReference(current.reference.kind as BusinessDetailKind, current.reference.id, current.userId)
    if (request !== sequence) return
    if (result.code !== 0 || !result.data) throw result
    if (result.data.userId !== current.userId || result.data.id !== current.reference.id || result.data.kind !== current.reference.kind) throw new Error('Reference mismatch')
    detail.value = result.data
  } catch (cause: unknown) {
    if (request !== sequence) return
    const failure = cause as { code?: number; response?: { status?: number; data?: { code?: number } } }
    const code = failure.response?.data?.code ?? failure.response?.status ?? failure.code
    error.value = code === 404 ? '未找到该用户对应的实际业务记录。请保留原始流水编号核对历史数据。' : '无法读取关联业务，请重新查询。'
  } finally { if (request === sequence) loading.value = false }
}
function clear() { sequence++; selected.value = undefined; detail.value = undefined; error.value = ''; loading.value = false }
watch(() => [props.userId, props.references] as const, () => { visible.value = false; clear() })
onUnmounted(clear)
const labels: Record<string, string> = {
  SUCCEEDED: '成功', FAILED: '失败', STARTED: '待完成', CREATING: '创建中', CREATE_FAILED: '创建失败',
  PENDING: '待处理', COMPLETED: '已完成', PAID: '已支付', CANCELED: '已取消', REFUNDED: '已退款', PARTIALLY_REFUNDED: '部分退款',
  APPROVED: '已通过', REJECTED: '已驳回', ESTIMATED: '已估算', UNPRICED: '缺少成本价格', UNKNOWN_USAGE: '缺少计费用量',
  WATCHFACE: '表盘', RESOURCE: '资源',
}
function display(field: BusinessReferenceField) {
  if (field.value == null || field.value === '') return '未记录'
  if (field.format === 'datetime') {
    const date = new Date(field.value)
    return Number.isFinite(date.getTime()) ? date.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false }) : field.value
  }
  return ['status', 'costStatus', 'redemptionKind'].includes(field.key) ? labels[field.value] || field.value : field.value
}
const ledgerLink = computed(() => businessReferenceLedgerLink(detail.value))
</script>
<style scoped>
.business-references { display: flex; gap: 6px 12px; flex-wrap: wrap; align-items: center; }
.business-references .el-button + .el-button { margin-left: 0; }.reference-id { font-size: 12px; color: var(--el-text-color-secondary); overflow-wrap: anywhere; }
.business-detail { display: grid; gap: 16px; }.detail-context { display: grid; gap: 6px; font-size: 12px; overflow-wrap: anywhere; color: var(--el-text-color-secondary); }
.detail-note { margin: 0; font-size: 12px; line-height: 1.6; color: var(--el-text-color-secondary); }.field-value { white-space: pre-wrap; overflow-wrap: anywhere; }
.business-detail :deep(.el-descriptions__table) { table-layout: fixed; }.business-detail :deep(.el-descriptions__content) { overflow-wrap: anywhere; }
a { color: var(--el-color-primary); text-decoration: none; font-size: 13px; }.detail-actions { display: flex; gap: 12px; }
@media(max-width:600px) { .business-detail :deep(.el-descriptions__label) { width: 110px !important; } }
</style>
