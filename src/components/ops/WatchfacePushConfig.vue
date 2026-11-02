<template>
  <el-card class="push-config" shadow="never">
    <template #header><div class="push-header"><span>微信新作品推送</span><el-button :loading="loading" :disabled="saving" @click="load">刷新配置与记录</el-button></div></template>
    <el-alert title="一次性订阅：每次授权提醒一次，无新作品不发送，每位用户每天最多一条。" type="info" :closable="false" />
    <el-alert v-if="failed" title="配置加载失败，请刷新后再编辑。" type="error" :closable="false" />
    <el-form label-width="140px" :disabled="loading || saving || failed" class="push-form">
      <el-form-item label="开启推送"><el-switch v-model="form.enabled" /></el-form-item>
      <el-form-item label="每日发送时间"><el-time-select v-model="form.sendTime" start="00:00" step="00:01" end="23:59" /><span class="hint">北京时间（Asia/Shanghai）</span></el-form-item>
      <el-form-item label="模板 ID"><el-input v-model="form.templateId" maxlength="128" /><div class="hint">模板需包含更新内容 thing1、来源 thing4。更换模板后，用户需重新订阅。</div></el-form-item>
      <el-form-item label="来源文案"><el-input v-model="form.source" maxlength="20" show-word-limit /></el-form-item>
      <el-form-item label="作品选择"><el-radio-group v-model="form.selectionMode"><el-radio value="AUTO">自动选择新上架作品</el-radio><el-radio value="MANUAL">指定作品</el-radio></el-radio-group></el-form-item>
      <el-form-item v-if="form.selectionMode === 'MANUAL'" label="作品 appId"><el-input-number v-model="manualAppId" :min="1" :precision="0" /><div class="hint">只允许已公开上架作品，同一作品发送成功或结果未知后不再重复推送。</div></el-form-item>
      <el-form-item v-else label="筛选规则"><span>最近 24 小时上架、符合商店公开规则的最新一款表盘。</span></el-form-item>
      <el-form-item><el-button type="primary" :loading="saving" @click="save">保存推送配置</el-button></el-form-item>
    </el-form>
    <p class="hint">当天任务开始后固定作品与文案；修改配置供下次任务使用。关闭开关会停止后续发送。当天任务开始后新增的订阅从次日参与。</p>
    <h3>最近 30 天任务记录</h3>
    <el-alert v-if="historyFailed" title="发送记录加载失败，请刷新重试。" type="warning" :closable="false" />
    <el-table :data="history" empty-text="暂无推送任务">
      <el-table-column prop="pushDay" label="日期" width="120" />
      <el-table-column prop="productName" label="作品" min-width="140" />
      <el-table-column prop="appId" label="appId" width="100" />
      <el-table-column label="任务" min-width="130"><template #default="{ row }">{{ row.status === 'NO_NEW_PRODUCT' ? '无可推送作品' : '已创建' }}</template></el-table-column>
      <el-table-column prop="attempted" label="尝试" width="80" />
      <el-table-column prop="sent" label="成功" width="80" />
      <el-table-column prop="rejected" label="微信拒绝" width="100" />
      <el-table-column prop="uncertain" label="处理中/结果未知" width="150" />
    </el-table>
    <p class="hint">结果未知的发送不会自动重试，以免重复通知；成功表示微信接口已接收，不代表用户已阅读。</p>
  </el-card>
</template>
<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getWatchfacePushSettings, saveWatchfacePushSettings, getWatchfacePushHistory, type WatchfacePushSettings, type WatchfacePushHistory } from '@/api/watchface-push'
const loading = ref(true), saving = ref(false), failed = ref(false), historyFailed = ref(false)
const form = reactive<WatchfacePushSettings>({ enabled: false, sendTime: '09:00', templateId: '', source: 'Wristo', selectionMode: 'AUTO', appId: null })
const manualAppId = ref<number | undefined>()
const history = ref<WatchfacePushHistory[]>([])
async function load() {
  loading.value = true
  failed.value = false
  historyFailed.value = false
  await Promise.all([
    (async () => { try {
      const result = await getWatchfacePushSettings()
      if (result.code !== 0 || !result.data) throw new Error()
      Object.assign(form, result.data)
      manualAppId.value = result.data.appId ?? undefined
    } catch { failed.value = true } })(),
    (async () => { try {
      const result = await getWatchfacePushHistory()
      if (result.code !== 0) throw new Error()
      history.value = result.data || []
    } catch { historyFailed.value = true } })(),
  ])
  loading.value = false
}
async function save() {
  if (loading.value || failed.value || saving.value) return
  if (!form.sendTime || !form.templateId.trim() || !form.source.trim() || (form.selectionMode === 'MANUAL' && !manualAppId.value)) {
    ElMessage.warning('请完整填写推送配置'); return
  }
  saving.value = true
  try {
    const result = await saveWatchfacePushSettings({ ...form, templateId: form.templateId.trim(), source: form.source.trim(), appId: form.selectionMode === 'MANUAL' ? manualAppId.value! : null })
    if (result.code !== 0) throw new Error(result.msg || '保存失败')
    Object.assign(form, result.data)
    ElMessage.success('推送配置已保存')
  } catch (error) { ElMessage.error(error instanceof Error ? error.message : '保存失败，请重试') }
  finally { saving.value = false }
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
