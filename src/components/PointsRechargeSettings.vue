<template>
  <el-card shadow="never" v-loading="loading">
    <template #header>积分充值套餐</template>
    <el-alert v-if="error" :title="error" type="error" :closable="false" show-icon />
    <el-form v-if="settings" label-width="140px" :disabled="saving || loading || !!error">
      <el-form-item label="开放积分充值"><el-switch v-model="settings.enabled" /></el-form-item>
      <el-form-item label="兑换比例">1 元 = 10 积分（固定）</el-form-item>
      <el-form-item v-for="(plan, index) in settings.plans" :key="index" :label="`套餐 ${index + 1}`">
        <div class="plan-row">
          <el-input-number v-model="plan.points" :min="10" :max="100000" :step="10" :aria-label="`套餐 ${index + 1} 积分`" />
          <span>积分 / {{ Number.isInteger(plan.points) ? `¥${(plan.points / 10).toFixed(2)}` : '—' }}</span>
          <el-button type="danger" plain @click="settings.plans.splice(index, 1)">删除</el-button>
        </div>
      </el-form-item>
      <el-form-item>
        <el-button :disabled="settings.plans.length >= 20" @click="addPlan">添加套餐</el-button>
      </el-form-item>
      <p>最多 20 个套餐，积分须为 10–100000 之间的整数且为 10 的倍数，不可重复。开启充值时至少保留一个套餐。</p>
      <p>配置仅影响新建积分充值订单；已有订单、订单查询和退款保持不变。AI 点数单独配置，仅用于 Studio。</p>
      <el-button type="primary" :loading="saving" :disabled="!!error || loading" @click="save">保存积分充值配置</el-button>
    </el-form>
    <el-button :disabled="saving || loading" @click="load">刷新</el-button>
  </el-card>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getPointsRechargeConfig, savePointsRechargeConfig, type PointsRechargeConfig } from '@/api/pointsRecharge'
const settings = ref<PointsRechargeConfig>()
const loading = ref(false), saving = ref(false), error = ref('')
function validate(value: PointsRechargeConfig): string {
  if (value.pointsPerYuan !== 10 || typeof value.enabled !== 'boolean' || !Array.isArray(value.plans)) return '积分充值配置格式无效，请刷新重试。'
  if (value.plans.length > 20 || (value.enabled && !value.plans.length)) return '最多 20 个套餐；开启充值时至少保留一个套餐。'
  if (value.plans.some(p => !p || !Number.isInteger(p.points) || p.points < 10 || p.points > 100000 || p.points % 10 !== 0)) return '积分须为 10–100000 之间的整数且为 10 的倍数。'
  if (new Set(value.plans.map(p => p.points)).size !== value.plans.length) return '套餐积分不可重复。'
  return ''
}
function addPlan() {
  if (!settings.value || settings.value.plans.length >= 20) return
  let points = 10
  while (settings.value.plans.some(p => p.points === points)) points += 10
  settings.value.plans.push({ points })
}
async function load() {
  loading.value = true; error.value = ''; settings.value = undefined
  try {
    const result = await getPointsRechargeConfig()
    if (result.code !== 0 || !result.data || validate(result.data)) throw new Error()
    settings.value = { ...result.data, plans: result.data.plans.map(p => ({ points: p.points })) }
    return true
  } catch { error.value = '无法读取积分充值配置，请刷新重试。'; return false }
  finally { loading.value = false }
}
async function save() {
  if (!settings.value || saving.value || loading.value || error.value) return
  const message = validate(settings.value)
  if (message) { ElMessage.warning(message); return }
  saving.value = true
  try {
    const result = await savePointsRechargeConfig({ ...settings.value, pointsPerYuan: 10, plans: settings.value.plans.map(p => ({ points: p.points })) })
    if (result.code !== 0) throw new Error()
    if (await load()) ElMessage.success('已保存，新建积分充值订单使用新配置')
  } catch { error.value = '未能确认保存结果，请刷新核对后重试。' }
  finally { saving.value = false }
}
onMounted(load)
</script>
<style scoped>
p { color: var(--el-text-color-secondary); line-height: 1.6; }
.plan-row { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }
.el-card { margin-bottom: 20px; }
.el-form + .el-button { margin-top: 12px; }
</style>
