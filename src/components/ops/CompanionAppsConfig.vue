<template>
  <el-card class="companion-config" shadow="never">
    <template #header>Wristo 配套应用地址</template>
    <p>统一维护 iOS、Google Play 和备用下载地址。Studio 发布上线时只读展示并支持复制。</p>
    <el-alert v-if="failed" title="应用地址加载失败，请重新加载后编辑。" type="error" :closable="false" />
    <el-form label-width="170px" :disabled="loading || saving || failed">
      <el-form-item label="iOS App Store"><el-input v-model="form.ios" placeholder="https://apps.apple.com/..." /></el-form-item>
      <el-form-item label="Google Play"><el-input v-model="form.android" placeholder="https://play.google.com/store/apps/details?id=..." /></el-form-item>
      <el-form-item label="iOS 备用地址"><el-input v-model="form.iosAlternatives" type="textarea" :rows="3" placeholder="每行一个完整地址，可留空" /></el-form-item>
      <el-form-item label="Android 备用地址"><el-input v-model="form.androidAlternatives" type="textarea" :rows="3" placeholder="每行一个完整地址，可留空" /></el-form-item>
      <el-form-item><el-button type="primary" :loading="saving" @click="save">保存应用地址</el-button></el-form-item>
    </el-form>
    <el-button :loading="loading" :disabled="saving" @click="load">重新加载</el-button>
  </el-card>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { listConfigs, upsertConfig } from '@/api/config'
import { COMPANION_APPS_KEY, parseCompanionApps } from '@/utils/companionApps'

const emit = defineEmits<{ saved: [] }>()
const form = reactive({ ios: '', android: '', iosAlternatives: '', androidAlternatives: '' })
const loading = ref(true)
const saving = ref(false)
const failed = ref(false)
async function load() {
  loading.value = true
  failed.value = false
  try {
    const response = await listConfigs('frontend')
    if (response.code !== 0) throw new Error('Load failed')
    const config = response.data?.find(row => row.configKey === COMPANION_APPS_KEY)
    const value = parseCompanionApps(config?.configValue)
    Object.assign(form, { ...value, iosAlternatives: value.iosAlternatives.join('\n'), androidAlternatives: value.androidAlternatives.join('\n') })
  } catch {
    failed.value = true
  } finally {
    loading.value = false
  }
}
async function save() {
  if (loading.value || failed.value || saving.value) return
  let value
  try {
    value = parseCompanionApps(JSON.stringify({ ...form, iosAlternatives: form.iosAlternatives.split('\n'), androidAlternatives: form.androidAlternatives.split('\n') }))
  } catch {
    ElMessage.warning('请填写有效的 HTTP 或 HTTPS 完整地址；备用地址每行一个。')
    return
  }
  saving.value = true
  try {
    const response = await upsertConfig(COMPANION_APPS_KEY, { category: 'frontend', config_value: JSON.stringify(value), description: 'Wristo 配套应用地址，供 Studio 发布上线时只读复制' })
    if (response.code !== 0) throw new Error('Save failed')
    ElMessage.success('应用地址已保存')
    emit('saved')
  } catch {
    ElMessage.error('应用地址保存失败，请重试')
  } finally {
    saving.value = false
  }
}
onMounted(load)
</script>

<style scoped>
.companion-config { margin-top: 24px; }
p { margin: 0 0 20px; color: var(--el-text-color-secondary); }
</style>
