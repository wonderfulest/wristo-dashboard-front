<template>
  <div class="page">
    <div class="header">
      <div>
        <h2>平台版本</h2>
        <p>配置后续打包任务使用的当前版本。保存不会触发部署、重启或重新打包。</p>
      </div>
      <el-button @click="load">刷新</el-button>
    </div>

    <el-card v-loading="loading">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="190px" style="max-width: 760px">
        <el-form-item label="Connect IQ Tools" prop="connectIqTools">
          <el-input v-model="form.connectIqTools" />
          <div class="hint">ghcr.io/wonderfulest/wristo-connectiq-tools:{{ form.connectIqTools }}</div>
        </el-form-item>
        <el-form-item label="Connect IQ App Build" prop="connectIqAppBuild">
          <el-input v-model="form.connectIqAppBuild" />
          <div class="hint">ghcr.io/wonderfulest/wristo-connectiq-app-build:{{ form.connectIqAppBuild }}</div>
        </el-form-item>
        <el-form-item label="SuperAlpha" prop="superAlpha"><el-input v-model="form.superAlpha" /></el-form-item>
        <el-form-item label="SuperBarrel" prop="superBarrel"><el-input v-model="form.superBarrel" /></el-form-item>
        <el-form-item label="Studio" prop="studio"><el-input v-model="form.studio" /></el-form-item>
        <el-form-item label="Wristo API" prop="wristoApi"><el-input v-model="form.wristoApi" /></el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="saving" @click="save">确认启用</el-button>
          <el-button @click="historyVisible = true; loadHistory()">修改历史</el-button>
        </el-form-item>
      </el-form>
      <el-divider />
      <div class="meta">配置版本：{{ form.configVersion }} · 修改人：{{ current?.updatedBy || '-' }} · 更新时间：{{ current?.updatedAt || '-' }}</div>
    </el-card>

    <el-drawer v-model="historyVisible" title="平台版本修改历史" size="55%">
      <el-table :data="histories" v-loading="historyLoading">
        <el-table-column prop="updatedAt" label="时间" width="180" />
        <el-table-column prop="updatedBy" label="修改人" width="140" />
        <el-table-column prop="oldValue" label="旧配置" show-overflow-tooltip />
        <el-table-column prop="newValue" label="新配置" show-overflow-tooltip />
      </el-table>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getPlatformVersionHistory, getPlatformVersions, updatePlatformVersions, type PlatformVersions } from '@/api/platformVersions'
import type { GlobalConfigHistory } from '@/types/ops'

const semver = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/
const formRef = ref<FormInstance>()
const loading = ref(false)
const saving = ref(false)
const current = ref<PlatformVersions>()
const historyVisible = ref(false)
const historyLoading = ref(false)
const histories = ref<GlobalConfigHistory[]>([])
const form = reactive({ configVersion: 0, connectIqTools: '', connectIqAppBuild: '', superAlpha: '', superBarrel: '', studio: '', wristoApi: '' })
const validator = (_rule: unknown, value: string, callback: (error?: Error) => void) => callback(semver.test(value) ? undefined : new Error('请输入合法 SemVer，例如 1.2.3'))
const rules: FormRules = Object.fromEntries(['connectIqTools', 'connectIqAppBuild', 'superAlpha', 'superBarrel', 'studio', 'wristoApi'].map(key => [key, [{ required: true, validator, trigger: 'blur' }]]))

const apply = (value: PlatformVersions) => {
  current.value = value
  form.configVersion = value.configVersion
  for (const key of ['connectIqTools', 'connectIqAppBuild', 'superAlpha', 'superBarrel', 'studio', 'wristoApi'] as const) form[key] = value[key].version
}
const load = async () => {
  loading.value = true
  try {
    const response = await getPlatformVersions()
    if (!response.data) throw new Error('平台版本配置为空')
    apply(response.data)
  } finally { loading.value = false }
}
const save = async () => {
  if (!await formRef.value?.validate().catch(() => false)) return
  await ElMessageBox.confirm('新版本将用于后续打包任务，确定启用吗？', '确认启用', { type: 'warning' })
  saving.value = true
  try {
    const response = await updatePlatformVersions({ ...form })
    if (!response.data) throw new Error('平台版本更新响应为空')
    apply(response.data)
    ElMessage.success('平台版本已启用')
  } finally { saving.value = false }
}
const loadHistory = async () => {
  historyLoading.value = true
  try { histories.value = (await getPlatformVersionHistory()).data || [] } finally { historyLoading.value = false }
}
onMounted(load)
</script>

<style scoped>
.page { padding: 20px; }
.header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
.header h2 { margin: 0 0 6px; }
.header p, .hint, .meta { color: #909399; }
.hint { width: 100%; font-family: monospace; font-size: 12px; }
</style>
