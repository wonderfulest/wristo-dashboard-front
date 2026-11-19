<template>
  <el-card class="push-config" shadow="never">
    <template #header><div class="push-header"><span>微信新作品推送</span><el-button :loading="loading" :disabled="saving || sending" @click="load">刷新配置与记录</el-button></div></template>
    <el-alert title="每天可创建多个任务。普通用户每天最多一条微信推送（北京时间），与其他平台独立计数；管理员可接收所有任务。每次发送仍需一次订阅授权。" type="info" :closable="false" />
    <el-alert v-if="failed" title="配置加载失败，请刷新后再编辑。" type="error" :closable="false" />
    <el-form label-width="140px" :disabled="loading || saving || sending || failed" class="push-form">
      <el-form-item label="开启推送"><el-switch v-model="form.enabled" /></el-form-item>
      <el-form-item label="每日发送时间"><el-time-select v-model="form.sendTime" start="00:00" step="00:01" end="23:59" /><span class="hint">北京时间（Asia/Shanghai）</span></el-form-item>
      <el-form-item label="模板 ID"><el-input v-model="form.templateId" maxlength="128" /><div class="hint">模板需包含更新内容 thing1、来源 thing4。更换模板后，用户需重新订阅。</div></el-form-item>
      <el-form-item label="来源文案"><el-input v-model="form.source" maxlength="20" show-word-limit /></el-form-item>
      <el-form-item label="立即任务作品"><el-radio-group v-model="form.selectionMode"><el-radio value="AUTO">自动选择新上架作品</el-radio><el-radio value="MANUAL">指定作品</el-radio></el-radio-group></el-form-item>
      <el-form-item v-if="form.selectionMode === 'MANUAL'" label="作品 appId"><AppSearchSelect v-model="manualAppId" width="100%" /><div class="hint">只允许已公开上架作品，普通用户收到同一作品后不再重复推荐；管理员可重复测试。</div></el-form-item>
      <el-form-item v-else label="筛选规则"><span>最近 24 小时上架、符合商店公开规则的最新一款表盘。</span></el-form-item>
      <el-form-item><el-button type="primary" :loading="saving" @click="save">保存推送配置</el-button><el-button type="success" :loading="sending" :disabled="!form.enabled" @click="sendNow">创建立即推送任务</el-button></el-form-item>
    </el-form>
    <p class="hint">每日定时推送默认自动选择；日历中指定作品后优先使用当天排期。上方作品选择仅用于立即任务。每个任务固定作品与文案，定时快照每天创建一次。关闭开关会停止后续发送；任务开始后新增的订阅可参与下一任务。</p>
    <WatchfacePushCalendar :settings="savedSettings" :revision="calendarRevision" />
    <h3>最近 30 个任务</h3>
    <el-alert v-if="historyFailed" title="发送记录加载失败，请刷新重试。" type="warning" :closable="false" />
    <el-table :data="history" empty-text="暂无推送任务">
      <el-table-column prop="createdAt" label="创建时间" min-width="170" />
      <el-table-column label="方式" width="90"><template #default="{ row }">{{ row.taskId?.startsWith('scheduled:') ? '定时' : '立即' }}</template></el-table-column>
      <el-table-column prop="productName" label="作品" min-width="140" />
      <el-table-column prop="appId" label="appId" width="100" />
      <el-table-column label="任务" min-width="130"><template #default="{ row }">{{ taskStatuses[row.status] || row.status }}</template></el-table-column>
      <el-table-column prop="attempted" label="尝试" width="80" />
      <el-table-column prop="sent" label="成功" width="80" />
      <el-table-column prop="rejected" label="微信拒绝" width="100" />
      <el-table-column prop="uncertain" label="处理中/结果未知" width="150" />
    </el-table>
    <p class="hint">结果未知的发送不会自动重试，以免重复通知；成功表示微信接口已接收，不代表用户已阅读。</p>
  </el-card>
</template>
<script setup lang="ts">
import WatchfacePushCalendar from './WatchfacePushCalendar.vue'
import AppSearchSelect from '@/components/common/AppSearchSelect.vue'
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getWatchfacePushSettings, saveWatchfacePushSettings, getWatchfacePushHistory, sendWatchfacePushNow, type WatchfacePushSettings, type WatchfacePushHistory } from '@/api/watchface-push'
const savedSettings = ref<WatchfacePushSettings>()
const calendarRevision = ref(0)
const sending = ref(false)
let pendingRequest: { id: string; fingerprint: string } | undefined
const taskStatuses: Record<string, string> = { READY: '已创建 / 发送中', COMPLETED: '已处理完成', EXPIRED: '已过期', NO_NEW_PRODUCT: '无可推送作品' }
const loading = ref(true), saving = ref(false), failed = ref(false), historyFailed = ref(false)
const form = reactive<WatchfacePushSettings>({ enabled: false, sendTime: '09:00', templateId: '', source: 'Wristo', selectionMode: 'AUTO', appId: null })
const manualAppId = ref<number | undefined>()
const history = ref<WatchfacePushHistory[]>([])
async function load() {
  loading.value = true
  failed.value = false
  savedSettings.value = undefined
  historyFailed.value = false
  await Promise.all([
    (async () => { try {
      const result = await getWatchfacePushSettings()
      if (result.code !== 0 || !result.data) throw new Error()
      Object.assign(form, result.data)
      savedSettings.value = { ...result.data }
      manualAppId.value = result.data.appId ?? undefined
    } catch { failed.value = true } })(),
    (async () => { try {
      const result = await getWatchfacePushHistory()
      if (result.code !== 0) throw new Error()
      history.value = result.data || []
    } catch { historyFailed.value = true } })(),
  ])
  loading.value = false
  calendarRevision.value++
}
async function save() {
  if (loading.value || failed.value || saving.value || sending.value) return
  if (!form.sendTime || !form.templateId.trim() || !form.source.trim() || (form.selectionMode === 'MANUAL' && !manualAppId.value)) {
    ElMessage.warning('请完整填写推送配置'); return
  }
  saving.value = true
  try {
    const result = await saveWatchfacePushSettings({ ...form, templateId: form.templateId.trim(), source: form.source.trim(), appId: form.selectionMode === 'MANUAL' ? manualAppId.value! : null })
    if (result.code !== 0 || !result.data) throw new Error(result.msg || '保存失败')
    Object.assign(form, result.data)
      savedSettings.value = { ...result.data }
    ElMessage.success('推送配置已保存')
  } catch (error) { ElMessage.error(error instanceof Error ? error.message : '保存失败，请重试') }
  finally { saving.value = false }
}
async function sendNow() {
  if (loading.value || failed.value || saving.value || sending.value) return
  const config: WatchfacePushSettings = { ...form, templateId: form.templateId.trim(), source: form.source.trim(), appId: form.selectionMode === 'MANUAL' ? manualAppId.value ?? null : null }
  if (!config.templateId || !config.source || (config.selectionMode === 'MANUAL' && !config.appId)) {
    ElMessage.warning('请完整填写推送配置'); return
  }
  sending.value = true
  try {
    await ElMessageBox.confirm('创建立即推送任务？普通用户每天最多收到一条微信推送；管理员可接收每个任务。请先保存并开启推送配置。', '立即推送', { type: 'warning' })
    const fingerprint = JSON.stringify(config)
    if (!pendingRequest || pendingRequest.fingerprint !== fingerprint) pendingRequest = { id: crypto.randomUUID(), fingerprint }
    const result = await sendWatchfacePushNow(pendingRequest.id, config)
    if (result.code !== 0) throw new Error(result.msg || '提交失败')
    pendingRequest = undefined
    ElMessage.success('任务已创建，后台将在一分钟内开始处理')
    await load()
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') ElMessage.error(error instanceof Error ? error.message : '提交失败，请重试')
  } finally { sending.value = false }
}
onMounted(load)
</script>
<style scoped>
.push-config { margin-top: 24px; }
.push-header { display: flex; align-items: center; justify-content: space-between; }
.push-form { margin-top: 24px; max-width: 820px; }
.hint { color: var(--el-text-color-secondary); font-size: 13px; line-height: 1.7; }
span.hint { margin-left: 12px; }
h3 { font-size: 16px; margin-top: 24px; }
</style>
