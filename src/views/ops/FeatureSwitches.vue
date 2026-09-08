<template>
  <div class="page">
    <div class="header">
      <div><h2>功能开关</h2><p>分别开启或暂停业务功能，配置由所有支持开关的 API 节点共享。</p></div>
      <el-button :loading="loading" :disabled="saving || dialogVisible" @click="load">刷新</el-button>
    </div>
    <el-alert type="warning" :closable="false" show-icon class="notice">
      <template #title>暂停仅阻止新操作，在途操作会继续完成，不代表任务已全部结束。</template>
      <p>浏览和普通查询不受影响。旧版节点不支持此开关；两台节点均升级后才能统一生效。</p>
      <p>暂停支付处理时，支付回调返回 503，等待支付平台重试；已打开的外部收银台仍可能完成付款。</p>
    </el-alert>
    <el-alert v-if="loadError" :title="loadError" type="error" :closable="false" show-icon class="notice" />
    <el-card v-loading="loading">
      <el-table :data="features" empty-text="暂无可显示的配置，请刷新重试">
        <el-table-column label="功能" min-width="250">
          <template #default="{ row }"><strong>{{ row.name }}</strong><p class="description">{{ row.description }}</p><span class="muted">{{ row.key }}</span></template>
        </el-table-column>
        <el-table-column label="状态" width="95"><template #default="{ row }"><el-tag :type="row.enabled ? 'success' : 'warning'">{{ row.enabled ? '已开启' : '已暂停' }}</el-tag></template></el-table-column>
        <el-table-column prop="reason" label="变更原因" min-width="150" show-overflow-tooltip />
        <el-table-column prop="updatedBy" label="修改人" min-width="110" show-overflow-tooltip />
        <el-table-column prop="updatedAt" label="更新时间" min-width="180" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link :type="row.enabled ? 'warning' : 'primary'" :disabled="saving || loading" @click="openChange(row)">{{ row.enabled ? '暂停' : '开启' }}</el-button>
            <el-button link type="primary" :disabled="saving" @click="openHistory(row)">历史</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    <el-dialog v-model="dialogVisible" :title="`${selected?.enabled ? '暂停' : '开启'}功能`" width="min(520px, 94vw)" :close-on-click-modal="false" :close-on-press-escape="!saving" :show-close="!saving" :before-close="beforeClose">
      <p>确认{{ selected?.enabled ? '暂停' : '开启' }}「{{ selected?.name }}」？</p>
      <p class="description">{{ selected?.enabled ? '新操作将被阻止；已开始的请求和任务会继续执行。' : '后续请求和后台调度将恢复执行，积压任务可能陆续处理。' }}</p>
      <el-form label-position="top" @submit.prevent="save">
        <el-form-item label="变更原因（必填）" :error="reasonError">
          <el-input v-model="reason" type="textarea" :rows="3" maxlength="256" show-word-limit :disabled="saving" placeholder="说明暂停或恢复的原因，便于值班人员追溯" />
        </el-form-item>
      </el-form>
      <template #footer><el-button :disabled="saving" @click="dialogVisible = false">取消</el-button><el-button :type="selected?.enabled ? 'warning' : 'primary'" :loading="saving" @click="save">确认{{ selected?.enabled ? '暂停' : '开启' }}</el-button></template>
    </el-dialog>
    <el-drawer v-model="historyVisible" :title="`${historyName} · 变更历史`" size="min(850px, 96vw)">
      <el-alert v-if="historyError" :title="historyError" type="error" :closable="false" class="notice" />
      <el-table v-loading="historyLoading" :data="histories" empty-text="暂无变更记录">
        <el-table-column prop="updatedAt" label="时间" min-width="180" />
        <el-table-column prop="updatedBy" label="修改人" min-width="110" />
        <el-table-column label="变更" min-width="130"><template #default="{ row }">{{ row.oldEnabled ? '开启' : '暂停' }} → {{ row.newEnabled ? '开启' : '暂停' }}</template></el-table-column>
        <el-table-column prop="reason" label="原因" min-width="200" />
      </el-table>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getFeatureSwitches, getFeatureSwitchHistory, updateFeatureSwitch, type FeatureSwitch, type FeatureSwitchHistory } from '@/api/featureSwitches'

const features = ref<FeatureSwitch[]>([])
const loading = ref(false)
const saving = ref(false)
const loadError = ref('')
const dialogVisible = ref(false)
const selected = ref<FeatureSwitch>()
const reason = ref('')
const reasonError = ref('')
const historyVisible = ref(false)
const historyLoading = ref(false)
const historyName = ref('')
const historyError = ref('')
const histories = ref<FeatureSwitchHistory[]>([])
let historyRequest = 0

async function load() {
  loading.value = true
  loadError.value = ''
  features.value = []
  try {
    const response = await getFeatureSwitches()
    if (!Array.isArray(response.data)) throw new Error('Invalid response')
    features.value = response.data
  } catch {
    loadError.value = '无法读取当前功能状态，请刷新后再操作。'
  } finally { loading.value = false }
}
function openChange(feature: FeatureSwitch) {
  selected.value = { ...feature }
  reason.value = ''
  reasonError.value = ''
  dialogVisible.value = true
}
function beforeClose(done: () => void) { if (!saving.value) done() }
async function save() {
  if (saving.value || !selected.value) return
  if (!reason.value.trim()) { reasonError.value = '请填写变更原因'; return }
  saving.value = true
  const feature = selected.value
  try {
    const response = await updateFeatureSwitch(feature.key, { enabled: !feature.enabled, version: feature.version, reason: reason.value.trim() })
    if (!response.data) throw new Error('Invalid response')
    features.value = features.value.map(row => row.key === feature.key ? response.data! : row)
    dialogVisible.value = false
    ElMessage.success(`${feature.name}已${response.data.enabled ? '开启' : '暂停'}`)
  } catch {
    dialogVisible.value = false
    ElMessage.warning('未能确认变更结果，已重新读取状态；如需继续，请检查最新状态后重试。')
    await load()
  } finally { saving.value = false }
}
async function openHistory(feature: FeatureSwitch) {
  const request = ++historyRequest
  historyName.value = feature.name
  historyVisible.value = true
  historyLoading.value = true
  historyError.value = ''
  histories.value = []
  try {
    const response = await getFeatureSwitchHistory(feature.key)
    if (!Array.isArray(response.data)) throw new Error('Invalid response')
    if (request === historyRequest) histories.value = response.data
  } catch {
    if (request === historyRequest) historyError.value = '历史记录读取失败，请关闭后重试。'
  } finally { if (request === historyRequest) historyLoading.value = false }
}
onMounted(load)
</script>

<style scoped>
.page { padding: 20px; }
.header { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; margin-bottom: 16px; }
h2 { margin: 0 0 6px; }
.header p, .description { color: #606266; line-height: 1.6; }
.description { margin: 6px 0; }
.muted { color: #909399; font-size: 12px; }
.notice { margin-bottom: 16px; }
.notice p { margin: 6px 0; }
</style>
