<template>
  <el-card shadow="never" v-loading="loading">
    <template #header>Studio 注册赠送与充值到账AI 点数</template>
    <el-alert v-if="error" :title="error" type="error" :closable="false" />
    <el-form v-if="settings" label-width="160px" :disabled="saving || loading">
      <el-form-item label="注册赠送AI 点数"><el-input-number v-model="settings.registrationCredits" :min="0" :max="1000000" :precision="0" /></el-form-item>
      <el-form-item v-for="item in packs" :key="item.key" :label="item.label"><el-input-number v-model="settings[item.key]" :min="1" :max="1000000" :precision="0" /></el-form-item>
      <p>注册赠送设为 0 时不赠送；已领取的账号不会补发。充值设置只影响新建订单，现金售价不变；已创建订单和退款均使用原订单AI 点数。</p>
      <el-button type="primary" :loading="saving" @click="save">保存 Studio AI 点数数量</el-button>
    </el-form>
    <el-button :disabled="saving || loading" @click="load">刷新</el-button>
  </el-card>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getStudioCreditAmounts, saveStudioCreditAmounts, type StudioCreditAmounts } from '@/api/studioCredits'
const settings = ref<StudioCreditAmounts>()
const loading = ref(false), saving = ref(false), error = ref('')
const packs = [{ key: 'starterCredits', label: 'Starter 到账AI 点数' }, { key: 'creatorCredits', label: 'Creator 到账AI 点数' }, { key: 'studioCredits', label: 'Studio 到账AI 点数' }] as const
async function load() {
  loading.value = true; error.value = ''; settings.value = undefined
  try { const r = await getStudioCreditAmounts(); if (r.code !== 0 || !r.data) throw new Error(); settings.value = { ...r.data } }
  catch { error.value = '无法读取 Studio AI 点数配置，请刷新重试。' }
  finally { loading.value = false }
}
async function save() {
  if (!settings.value || saving.value) return
  const s = settings.value
  if (!Number.isInteger(s.registrationCredits) || s.registrationCredits < 0 || s.registrationCredits > 1000000 || packs.some(p => !Number.isInteger(s[p.key]) || s[p.key] < 1 || s[p.key] > 1000000)) { ElMessage.warning('请填写有效整数，最大 1000000；套餐AI 点数至少为 1'); return }
  saving.value = true; error.value = ''
  try { const r = await saveStudioCreditAmounts({ ...s }); if (r.code !== 0 || !r.data) throw new Error(); settings.value = { ...r.data }; ElMessage.success('已保存，后续注册和新建充值订单使用新数量') }
  catch { error.value = '未能确认保存结果，请刷新核对后重试。' }
  finally { saving.value = false }
}
onMounted(load)
</script>
<style scoped>p { color: var(--el-text-color-secondary); line-height: 1.6; } .el-button { margin-top: 12px; }</style>
