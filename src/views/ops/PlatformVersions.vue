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
          <el-select v-model="form.connectIqAppBuild" filterable allow-create default-first-option style="width: 100%">
            <el-option v-for="item in buildVersions" :key="item.version" :label="item.version" :value="item.version" />
          </el-select>
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

    <el-card class="version-registry" v-loading="versionsLoading">
      <template #header>
        <div class="registry-header"><strong>Connect IQ App Build 版本记录</strong><el-button @click="loadVersions">刷新列表</el-button></div>
      </template>
      <p class="hint">登记版本号和更新说明，供打包配置及 Studio 筛选使用。登记不会启用版本，也不代表镜像已发布。</p>
      <el-form class="version-register-form" @submit.prevent="registerVersion">
        <el-input v-model="newVersion" placeholder="版本号，例如 2.10.0" aria-label="新版本号" style="max-width: 200px" />
        <el-input v-model="newVersionNote" placeholder="更新说明" aria-label="版本更新说明" maxlength="2000" style="max-width: 520px" />
        <el-button type="primary" :loading="registering" :disabled="!semver.test(newVersion.trim())" @click="registerVersion">登记版本</el-button>
      </el-form>
      <el-table :data="buildVersions" empty-text="暂无版本记录">
        <el-table-column prop="version" label="版本号" width="160" />
        <el-table-column label="当前配置" width="120"><template #default="{ row }"><el-tag v-if="row.version === current?.connectIqAppBuild.version" type="success">当前启用</el-tag></template></el-table-column>
        <el-table-column prop="releaseNote" label="更新说明" min-width="240" show-overflow-tooltip />
        <el-table-column prop="recordedBy" label="登记人" width="140" />
        <el-table-column prop="recordedAt" label="登记时间" width="190" />
        <el-table-column label="操作" width="100"><template #default="{ row }"><el-button link type="primary" @click="form.connectIqAppBuild = row.version">填入配置</el-button></template></el-table-column>
      </el-table>
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
import { getPlatformVersionHistory, getPlatformVersions, updatePlatformVersions, getAppBuildVersions, registerAppBuildVersion, type AppBuildVersionRecord, type PlatformVersions } from '@/api/platformVersions'
import type { GlobalConfigHistory } from '@/types/ops'

const semver = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/
const formRef = ref<FormInstance>()
const loading = ref(false)
const saving = ref(false)
const current = ref<PlatformVersions>()
const buildVersions = ref<AppBuildVersionRecord[]>([])
const versionsLoading = ref(false)
const registering = ref(false)
const newVersion = ref('')
const newVersionNote = ref('')
const loadVersions = async () => {
  versionsLoading.value = true
  try { buildVersions.value = (await getAppBuildVersions()).data || [] }
  finally { versionsLoading.value = false }
}
const registerVersion = async () => {
  if (!semver.test(newVersion.value.trim()) || registering.value) return
  if (buildVersions.value.some(item => item.version === newVersion.value.trim())) {
    ElMessage.info('该版本已登记'); return
  }
  registering.value = true
  try {
    const response = await registerAppBuildVersion({ version: newVersion.value.trim(), releaseNote: newVersionNote.value.trim() })
    if (response.code !== 0) throw new Error(response.msg || '登记失败')
    newVersion.value = ''; newVersionNote.value = ''
    await loadVersions()
    ElMessage.success('版本已登记，当前启用版本未改变')
  } finally { registering.value = false }
}
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
    await loadVersions()
    ElMessage.success('平台版本已启用')
  } finally { saving.value = false }
}
const loadHistory = async () => {
  historyLoading.value = true
  try { histories.value = (await getPlatformVersionHistory()).data || [] } finally { historyLoading.value = false }
}
onMounted(() => { void load(); void loadVersions() })
</script>

<style scoped>
.version-registry { margin-top: 20px; }
.registry-header, .version-register-form { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.registry-header { justify-content: space-between; }
.version-register-form { margin: 16px 0; }
.page { padding: 20px; }
.header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
.header h2 { margin: 0 0 6px; }
.header p, .hint, .meta { color: #909399; }
.hint { width: 100%; font-family: monospace; font-size: 12px; }
</style>
