<template>
  <section class="purchase-settings">
    <h2>单表盘购买</h2>
    <el-card shadow="never" v-loading="loading">
      <el-alert v-if="error" :title="error" type="error" :closable="false" />
      <el-alert v-if="settings && !settings.paymentEnabled" title="支付总开关未开启，保存后仍需开启支付服务才能购买。" type="warning" :closable="false" />
      <el-form v-if="settings" label-width="160px" :disabled="loading || saving || !!error">
        <el-form-item label="开放单表盘购买"><el-switch v-model="settings.enabled" /></el-form-item>
        <p>控制微信小程序的单表盘购买。保存后立即影响购买信息和新建订单，无需重启服务。</p>
        <p>已有订单的支付确认、权益发放与退款不受影响。微信后台对应商品须已发布。</p>
        <el-button type="primary" :loading="saving" @click="save">保存配置</el-button>
      </el-form>
      <el-button :disabled="loading || saving" @click="load">刷新</el-button>
    </el-card>
  </section>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import instance from '@/config/axios'
import type { ApiResponse } from '@/types/api'
interface Settings { enabled: boolean; paymentEnabled: boolean }
const settings = ref<Settings>(), loading = ref(false), saving = ref(false), error = ref('')
async function load() {
  loading.value = true; error.value = ''; settings.value = undefined
  try {
    const result: ApiResponse<Settings> = await instance.get('/admin/single-face-purchase-config')
    if (result.code !== 0 || typeof result.data?.enabled !== 'boolean') throw new Error()
    settings.value = result.data
    return true
  } catch { error.value = '读取失败，请刷新重试。'; return false }
  finally { loading.value = false }
}
async function save() {
  if (!settings.value || saving.value || loading.value || error.value) return
  saving.value = true
  try {
    const result: ApiResponse<Settings> = await instance.put('/admin/single-face-purchase-config', { enabled: settings.value.enabled })
    if (result.code !== 0) throw new Error()
    if (await load()) ElMessage.success('已保存，单表盘购买配置已生效')
  } catch { error.value = '未能确认保存结果，请刷新核对后重试。' }
  finally { saving.value = false }
}
onMounted(load)
</script>
<style scoped>
.purchase-settings { padding: 20px; } h2 { margin-top: 0; } p { color: var(--el-text-color-secondary); line-height: 1.6; } .el-form { margin: 20px 0; }
</style>
