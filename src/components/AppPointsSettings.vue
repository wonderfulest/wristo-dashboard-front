<template>
  <el-card shadow="never" v-loading="loading">
    <template #header>积分兑换激活</template>
    <el-alert v-if="error" :title="error" type="error" :closable="false" />
    <el-form v-if="settings" label-position="top" :disabled="saving || loading">
      <el-form-item label="支持积分兑换"><el-switch v-model="settings.enabled" /></el-form-item>
      <el-form-item label="使用全局默认"><el-switch v-model="inherit" /></el-form-item>
      <el-form-item v-if="!inherit" label="兑换所需积分"><el-input-number v-model="customPoints" :min="1" :max="100000" :precision="0" /></el-form-item>
      <p>{{ inherit ? `使用全局默认 ${defaultPoints} 积分，随全局设置变化。` : '单独定价，不受全局默认值调整影响。' }}</p>
      <p>使用微信小程序积分；关闭后停止新兑换，已兑换权益不受影响。</p>
      <el-button type="primary" :loading="saving" @click="save">保存兑换设置</el-button>
      <el-button @click="load">重新读取</el-button>
    </el-form>
    <el-button v-else-if="!loading" @click="load">重新读取</el-button>
  </el-card>
</template>
<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { getAppPoints, saveAppPoints, getPointsSettings, type AppPointsSettings } from '@/api/miniappPoints'
const props = defineProps<{ appId: number }>()
const settings = ref<AppPointsSettings>(), loading = ref(false), saving = ref(false), error = ref('')
const inherit = ref(true), customPoints = ref<number | undefined>(100), defaultPoints = ref(100)
let revision = 0
async function load() {
  const current = ++revision, id = props.appId
  settings.value = undefined; error.value = ''; loading.value = true
  try {
    const [app, global] = await Promise.all([getAppPoints(id), getPointsSettings()])
    if (current !== revision) return
    if (app.code !== 0 || !app.data || global.code !== 0 || !global.data) throw new Error()
    settings.value = app.data; defaultPoints.value = global.data.defaultPoints
    inherit.value = app.data.points === null; customPoints.value = app.data.points ?? global.data.defaultPoints
  } catch { if (current === revision) error.value = '无法读取兑换设置，请重试。' }
  finally { if (current === revision) loading.value = false }
}
async function save() {
  if (!settings.value || saving.value || loading.value) return
  if (!inherit.value && (!Number.isInteger(customPoints.value) || customPoints.value! < 1 || customPoints.value! > 100000)) { ElMessage.warning('积分须为 1 至 100000 的整数'); return }
  const current = revision
  saving.value = true; error.value = ''
  try {
    const response = await saveAppPoints(props.appId, { enabled: settings.value.enabled, points: inherit.value ? null : customPoints.value! })
    if (current !== revision) return
    if (response.code !== 0 || !response.data) throw new Error()
    settings.value = response.data; ElMessage.success('兑换设置已保存')
  } catch { if (current === revision) error.value = '未能确认保存结果，请重新读取核对后重试。' }
  finally { saving.value = false }
}
watch(() => props.appId, load, { immediate: true })
</script>
<style scoped>p { color: var(--el-text-color-secondary); font-size: 13px; line-height: 1.6; }</style>
