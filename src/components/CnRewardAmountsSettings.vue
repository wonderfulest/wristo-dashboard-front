<template>
  <el-card shadow="never" v-loading="loading">
    <template #header><div class="header"><strong>国内站积分任务与兑换</strong><el-button :disabled="saving" @click="load">刷新</el-button></div></template>
    <p>适用于国内站推荐试点接口。资格与活动开放范围保持原设置；数量由此统一配置，保存后影响新奖励和新兑换。</p>
    <el-alert title="首次启用前，请核对并录入原国内站奖励和兑换额度后保存。未保存时暂停国内站试点积分扣发，避免默认值覆盖原有额度。" type="info" :closable="false" />
    <el-alert v-if="error" :title="error" type="error" :closable="false" />
    <el-form v-if="settings" label-position="top" :disabled="saving || loading">
      <div class="fields">
        <el-form-item v-for="field in fields" :key="field.key" :label="field.label"><el-input-number v-model="settings[field.key]" :min="1" :max="1000000" :precision="0" /></el-form-item>
      </div>
      <p>试用上限按每日获得积分计算，推荐上限按每月获得积分计算。已创建的推荐订单和兑换记录保留原数量。</p>
      <h4>表盘兑换积分覆盖</h4>
      <p>仅影响已获准参与国内试点兑换的表盘。未单独设置的表盘使用上方默认兑换积分；删除覆盖后恢复默认值。</p>
      <div v-for="(product, index) in products" :key="product.id" class="product-row">
        <el-input v-model="product.appId" aria-label="表盘 ID" placeholder="表盘 ID" inputmode="numeric" />
        <el-input-number v-model="product.points" aria-label="兑换积分" :min="1" :max="1000000" :precision="0" />
        <el-button type="danger" plain @click="products.splice(index, 1)">删除覆盖</el-button>
      </div>
      <el-button :disabled="products.length >= 1000" @click="addProduct">添加表盘覆盖</el-button>
      <div class="actions"><el-button type="primary" :loading="saving" @click="save">保存国内积分配置</el-button></div>
    </el-form>
  </el-card>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getCnRewardAmounts, saveCnRewardAmounts, type CnRewardAmounts } from '@/api/cnRewardAmounts'
const settings = ref<CnRewardAmounts>()
const loading = ref(false), saving = ref(false), error = ref('')
const products = ref<{ id: number; appId: string; points: number }[]>([])
let nextId = 0
const fields: { key: Exclude<keyof CnRewardAmounts, 'productPoints'>; label: string }[] = [
  { key: 'checkInPoints', label: '每日签到奖励积分' }, { key: 'trialPoints', label: '每次试用奖励积分' },
  { key: 'trialDailyLimit', label: '每日试用奖励积分上限' }, { key: 'referralPoints', label: '推荐有效首单奖励积分' },
  { key: 'monthlyCap', label: '每月推荐奖励积分上限' }, { key: 'defaultRedemptionPoints', label: '默认表盘兑换积分' },
]
function apply(value: CnRewardAmounts) {
  settings.value = { ...value, productPoints: { ...value.productPoints } }
  products.value = Object.entries(value.productPoints).map(([appId, points]) => ({ id: nextId++, appId, points }))
}
function addProduct() { products.value.push({ id: nextId++, appId: '', points: settings.value!.defaultRedemptionPoints }) }
async function load() {
  loading.value = true; error.value = ''; settings.value = undefined; products.value = []
  try { const response = await getCnRewardAmounts(); if (response.code !== 0 || !response.data) throw new Error(); apply(response.data) }
  catch { error.value = '无法读取国内积分配置，请刷新重试。' }
  finally { loading.value = false }
}
async function save() {
  if (!settings.value || saving.value || loading.value) return
  const s = settings.value
  const valid = (n: number) => Number.isInteger(n) && n >= 1 && n <= 1000000
  if (fields.some(field => !valid(s[field.key])) || s.trialPoints > s.trialDailyLimit || s.referralPoints > s.monthlyCap) {
    ElMessage.warning('积分须为 1 至 1000000 的整数，上限不能低于单次奖励'); return
  }
  const overrides: Record<string, number> = {}
  for (const product of products.value) {
    const id = product.appId.trim()
    if (!/^[1-9][0-9]{0,18}$/.test(id) || BigInt(id) > 9223372036854775807n || id in overrides || !valid(product.points)) {
      ElMessage.warning('请填写有效、不重复的表盘 ID 和兑换积分'); return
    }
    overrides[id] = product.points
  }
  saving.value = true; error.value = ''
  try {
    const response = await saveCnRewardAmounts({ ...s, productPoints: overrides })
    if (response.code !== 0 || !response.data) throw new Error()
    apply(response.data); ElMessage.success('国内积分配置已保存')
  } catch { error.value = '未能确认保存结果，请刷新核对配置后重试。' }
  finally { saving.value = false }
}
onMounted(load)
</script>
<style scoped>
.header,.product-row,.actions { display: flex; align-items: center; gap: 12px; }
.header { justify-content: space-between; }.fields { display: grid; grid-template-columns: repeat(auto-fit,minmax(220px,1fr)); gap: 0 20px; }
p { color: var(--el-text-color-secondary); line-height: 1.6; font-size: 13px; }.product-row { margin-bottom: 12px; }.product-row .el-input { max-width: 240px; }.actions { margin-top: 20px; }
@media(max-width:600px) { .product-row { flex-wrap: wrap; } }
</style>
