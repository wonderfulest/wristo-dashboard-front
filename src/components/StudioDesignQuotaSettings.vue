<template>
  <el-card class="quota-settings" v-loading="loading">
    <template #header><strong>Studio 设计数量与额外栏位</strong></template>
    <el-alert title="多个角色取最高额度，不累加；-1 表示不限。额外栏位永久累加，降低额度不会删除已有设计。" type="info" :closable="false" />
    <el-form v-if="settings" label-width="150px" style="margin-top: 20px">
      <el-form-item label="无匹配角色默认额度"><el-input-number v-model="settings.defaultLimit" :min="-1" :max="1000000" :precision="0" /></el-form-item>
      <el-table :data="roleRows">
        <el-table-column prop="name" label="角色" />
        <el-table-column prop="code" label="角色编码" />
        <el-table-column label="最大设计数量"><template #default="{ row }"><el-input-number v-model="settings.roleLimits[row.code]" :min="-1" :max="1000000" :precision="0" /></template></el-table-column>
      </el-table>
      <el-divider>永久额外栏位套餐</el-divider>
      <el-form-item label="积分兑换"><el-switch v-model="settings.creditsEnabled" /></el-form-item>
      <el-form-item label="1 个栏位积分"><el-input-number v-model="settings.creditCost" :min="1" :max="1000000" :precision="0" /></el-form-item>
      <el-form-item label="现金购买"><el-switch v-model="settings.purchaseEnabled" /></el-form-item>
      <el-form-item label="1 个栏位（美分）"><el-input-number v-model="settings.priceCents" :min="1" :max="1000000" :precision="0" /><span style="margin-left: 12px">{{ (settings.priceCents / 100).toFixed(2) }} USD / 栏位，税前</span></el-form-item>
      <el-form-item label="1 个栏位 Price ID"><el-input v-model="settings.paddlePriceId" placeholder="pri_…（一次性价格）" /></el-form-item>
      <el-table :data="settings.bundles">
        <el-table-column prop="slots" label="栏位数量" width="100" />
        <el-table-column label="套餐积分"><template #default="{ row }"><el-input-number v-model="row.creditCost" :min="1" :max="1000000" :precision="0" /></template></el-table-column>
        <el-table-column label="套餐价格（美分）"><template #default="{ row }"><el-input-number v-model="row.priceCents" :min="1" :max="1000000" :precision="0" /></template></el-table-column>
        <el-table-column label="Paddle Price ID"><template #default="{ row }"><el-input v-model="row.paddlePriceId" placeholder="pri_…（套餐总价）" /></template></el-table-column>
      </el-table>
      <el-alert title="每档使用独立的 Paddle Price ID，未配置的档位不开放现金购买。开启现金购买前，请配置同金额、USD、一次性、税外计价的 Paddle Price，并复用 Studio 积分的签名 Webhook。服务器会核验价格和付款，配置不匹配时拒绝购买。" type="info" :closable="false" />
      <el-button type="primary" :loading="saving" style="margin-top: 16px" @click="save">保存设计额度配置</el-button>
    </el-form>
    <el-button v-else-if="!loading" @click="load">重新加载</el-button>
  </el-card>
</template>
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import instance from '@/config/axios'
import { getRoleList } from '@/api/role'
import type { RoleInfo } from '@/types/api'
interface Settings { defaultLimit: number; roleLimits: Record<string, number>; creditCost: number; priceCents: number; paddlePriceId: string; creditsEnabled: boolean; purchaseEnabled: boolean; bundles: { slots: number; creditCost: number; priceCents: number; paddlePriceId: string }[] }
const settings = ref<Settings>(), roles = ref<RoleInfo[]>([]), loading = ref(false), saving = ref(false)
const roleRows = computed(() => Object.keys(settings.value?.roleLimits || {}).map(code => ({ code, name: roles.value.find(role => role.roleCode === code)?.roleName || code })))
async function load() {
  loading.value = true
  try {
    const [quota, list] = await Promise.all([instance.get('/admin/studio-design-quota'), getRoleList()])
    settings.value = (quota as any).data; roles.value = list.data || []
    if (settings.value) for (const role of roles.value) if (role.roleCode && !(role.roleCode in settings.value.roleLimits)) settings.value.roleLimits[role.roleCode] = settings.value.defaultLimit
  } catch { ElMessage.error('加载设计额度配置失败') } finally { loading.value = false }
}
async function save() {
  saving.value = true
  try { await instance.put('/admin/studio-design-quota', settings.value); ElMessage.success('设计额度配置已保存') }
  catch { ElMessage.error('保存失败，请检查额度和支付价格配置') } finally { saving.value = false }
}
onMounted(load)
</script>
<style scoped>.quota-settings { margin: 24px 0; }</style>
