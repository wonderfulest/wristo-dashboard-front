<template>
  <section class="simulation" aria-labelledby="simulation-heading">
    <header><div><h3 id="simulation-heading">会员分佣测试</h3><p>国内网站 · 永久会员</p></div><strong>¥69.90</strong></header>
    <form class="field" @submit.prevent="create">
      <label for="simulation-email">顾客邮箱</label>
      <div><el-input id="simulation-email" v-model.trim="email" :disabled="busy" type="email" required @input="requestId = ''" />
        <el-button type="primary" native-type="submit" :disabled="busy || !email">创建网站结账授权</el-button></div>
    </form>
    <form class="field" @submit.prevent="lookup">
      <label for="simulation-order">查询测试单</label>
      <div><el-input id="simulation-order" v-model.trim="order" :disabled="busy" placeholder="SIM- 开头的订单号" @input="details = null" />
        <el-button native-type="submit" :disabled="busy || !validOrder">查看明细</el-button></div>
    </form>
    <div v-if="details" class="receipt">
      <h4>订单明细</h4>
      <dl>
        <dt>顾客</dt><dd>{{ details.buyerEmail }}</dd>
        <dt>模拟付款</dt><dd>¥{{ money(details.amountFen) }}</dd>
        <dt>网站订单</dt><dd>{{ websiteLabels[details.websiteStatus] || details.websiteStatus }}</dd>
        <dt>购买记录</dt><dd>{{ Number(details.purchaseRecorded) ? '已找到' : '未找到' }}</dd>
        <dt>测试会员权益</dt><dd>{{ details.revokedAt ? '已撤销' : details.commissionStatus === 'PENDING' ? '待付款' : '有效' }}</dd>
        <dt>推广上级</dt><dd>{{ details.partnerEmail }}</dd>
        <dt>测试佣金</dt><dd>¥{{ money(details.commissionFen) }} · {{ details.commissionStatus === 'TEST_EARNED' ? '不参与结算' : details.commissionStatus }}</dd>
      </dl>
      <a v-if="Number(details.websiteCheckout) && !details.revokedAt" class="checkout" :href="'https://wristo.cn/payment/bundle/107642?simulation=' + details.orderNo.slice(4)" target="_blank" rel="noopener">打开国内网站结账</a>
      <el-button v-if="!details.revokedAt" plain type="danger" :disabled="busy" @click="revoke">撤销此单权益和佣金</el-button>
    </div>
  </section>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import instance from '@/config/axios'
import type { ApiResponse } from '@/types/api'

const base = '/admin/promotion/membership-simulations'
const email = ref('')
const order = ref('')
const requestId = ref('')
const busy = ref(false)
interface Details {
  orderNo: string
  buyerEmail: string
  partnerEmail: string
  amountFen: number
  commissionFen: number
  websiteStatus: string
  websiteCheckout: number | boolean
  purchaseRecorded: number | boolean
  revokedAt: string | null
  commissionStatus: string
}
const websiteLabels: Record<string,string> = { TEST_PENDING: '已下单，待模拟付款', TEST_FULFILLED: '已完成模拟付款', NOT_CREATED: '尚未创建', UNAVAILABLE: '暂时无法查询' }
const details = ref<Details | null>(null)
const validOrder = computed(() => /^SIM-[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(order.value))
const money = (fen: number) => (fen / 100).toFixed(2)
async function readDetails() {
  const requested = order.value
  const result: ApiResponse<Details> = await instance.get(base + '/' + requested.slice(4))
  if (!result.data?.orderNo) throw new Error('未取得订单明细')
  if (order.value === requested) details.value = result.data
}
async function lookup() {
  if (busy.value || !validOrder.value) return
  busy.value = true
  details.value = null
  try { await readDetails() }
  catch (error) { ElMessage.error(error instanceof Error ? error.message : '查询失败') }
  finally { busy.value = false }
}
async function create() {
  if (busy.value) return
  busy.value = true
  try {
    requestId.value ||= crypto.randomUUID()
    const result: ApiResponse<{ orderNo: string }> = await instance.post(base + '/checkout', { email: email.value, requestId: requestId.value })
    if (!result.data?.orderNo) throw new Error('未取得订单号')
    order.value = result.data.orderNo
    details.value = null
    await readDetails()
    ElMessage.success('测试订单已生成')
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '创建失败')
  } finally { busy.value = false }
}
async function revoke() {
  if (busy.value) return
  busy.value = true
  try {
    await instance.post(base + '/' + encodeURIComponent(order.value.slice(4)) + '/revoke')
    requestId.value = ''
    details.value = null
    await readDetails()
    ElMessage.success('测试订单已撤销')
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '撤销失败')
  } finally { busy.value = false }
}
</script>

<style scoped>
.simulation { max-width: 760px; margin-bottom: 24px; padding: 24px; border: 1px solid var(--el-border-color-light); border-radius: 12px; background: var(--el-bg-color); }
header, .field > div { display: flex; align-items: center; gap: 12px; }
header { justify-content: space-between; margin-bottom: 20px; }
h3, h4, p, dd { margin: 0; }
header p, dt { color: var(--el-text-color-secondary); }
header p { margin-top: 4px; font-size: 14px; }
header strong { font-size: 22px; font-variant-numeric: tabular-nums; }
.field + .field { margin-top: 16px; }
label { display: block; font-size: 14px; margin-bottom: 6px; }
.checkout { display: inline-block; margin: 0 16px 10px 0; color: var(--el-color-primary); }
.receipt { border-top: 1px solid var(--el-border-color-light); margin-top: 20px; padding-top: 16px; }
dl { display: grid; grid-template-columns: auto 1fr; gap: 8px 20px; font-size: 14px; }
dd { overflow-wrap: anywhere; }
@media (max-width: 520px) { .field > div { align-items: stretch; flex-direction: column; } .simulation { padding: 16px; } }
</style>
