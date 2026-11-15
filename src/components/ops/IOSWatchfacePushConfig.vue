<template>
  <el-card class="ios-push" shadow="never">
    <template #header>
      <div class="push-header"><span>iOS 每日精选推送</span><el-button :loading="loading" :disabled="saving || testing" @click="load">刷新配置与记录</el-button></div>
    </template>
    <el-alert title="仅推送后台指定的作品，不自动挑选。未指定作品时不发送，每位用户每天最多一条，同一作品不重复推荐。" type="info" :closable="false" />
    <el-alert v-if="configured === false" title="苹果推送服务尚未配置完成，需先配置 APNs 密钥后才能发送。" type="warning" :closable="false" />
    <el-alert v-if="failed" title="配置加载失败，请刷新后再编辑。" type="error" :closable="false" />
    <el-form label-width="140px" :disabled="loading || saving || failed || testing" class="push-form">
      <el-form-item label="开启每日推送"><el-switch v-model="form.enabled" /></el-form-item>
      <el-form-item label="每日发送时间">
        <el-time-select v-model="form.sendTime" start="00:00" step="00:01" end="23:59" />
        <span class="hint time-hint">北京时间（Asia/Shanghai）</span>
      </el-form-item>
      <el-form-item label="指定作品">
        <AppSearchSelect v-model="selectedAppId" width="100%" />
        <div class="hint">请选择已公开上架的作品。清空后暂停推荐；已接收过该作品的用户会跳过，需更换作品后继续推荐。</div>
      </el-form-item>
      <el-form-item label="通知标题"><el-input v-model="form.title" maxlength="100" show-word-limit /></el-form-item>
      <el-form-item label="通知正文"><el-input v-model="form.body" type="textarea" :rows="3" maxlength="500" show-word-limit /></el-form-item>
      <el-form-item><el-button type="primary" :loading="saving" @click="save">保存 iOS 推送配置</el-button></el-form-item>
    </el-form>
    <p class="hint">当天任务开始后固定作品与文案，后续修改供下一次任务使用；关闭开关可停止尚未发送的通知。只有在 iOS App 内开启「每日精选」并允许系统通知的用户会收到推送。</p>
    <h3>发送到我的测试设备</h3>
    <p class="hint">先在 iPhone 上使用当前后台账号登录 Wristo 并开启「每日精选」。测试使用已保存的文案及当前所选作品，不受每日推送开关限制。</p>
    <el-alert v-if="devicesFailed" title="测试设备加载失败，请刷新重试。" type="warning" :closable="false" />
    <div class="test-row">
      <el-select v-model="testDeviceId" aria-label="测试设备" placeholder="选择我的已订阅设备" :disabled="loading || devicesFailed || testing" class="device-select">
        <el-option v-for="device in devices" :key="device.id" :value="device.id" :label="`${device.environment === 'production' ? '正式版' : '开发版'} · ${device.installationId.slice(0, 8)} · ${device.language}`" />
      </el-select>
      <el-button :loading="testing" :disabled="loading || saving || failed || !testDeviceId || !selectedAppId" @click="testPush">发送测试通知</el-button>
    </div>
    <h3>最近 30 天发送记录</h3>
    <el-alert v-if="historyFailed" title="发送记录加载失败，请刷新重试。" type="warning" :closable="false" />
    <el-table :data="history" empty-text="暂无推送任务">
      <el-table-column prop="pushDay" label="日期" width="120" />
      <el-table-column prop="productName" label="作品" min-width="150" />
      <el-table-column prop="appId" label="appId" width="100" />
      <el-table-column label="任务" min-width="140"><template #default="{ row }">{{ row.status === 'NO_PRODUCT' ? '未指定可用作品' : row.status === 'READY' ? '已创建' : row.status }}</template></el-table-column>
      <el-table-column prop="attempted" label="尝试" width="80" />
      <el-table-column prop="sent" label="苹果已接收" width="110" />
      <el-table-column prop="rejected" label="拒绝" width="80" />
      <el-table-column prop="uncertain" label="处理中/未知" width="120" />
      <el-table-column prop="clicked" label="点击" width="80" />
    </el-table>
    <p class="hint">苹果已接收不代表已送达或已阅读；结果未知的通知不自动重发，避免重复打扰。点击数按通知去重统计，测试不计入每日任务。</p>
  </el-card>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import AppSearchSelect from '@/components/common/AppSearchSelect.vue'
import {
  getIOSPushStatus, getIOSPushConfig, saveIOSPushConfig, getIOSPushHistory, getIOSPushDevices, sendIOSPushTest,
  type IOSWatchfacePushSettings, type IOSWatchfacePushHistory, type IOSPushDevice,
} from '@/api/ios-watchface-push'

const form = reactive<IOSWatchfacePushSettings>({ enabled: false, sendTime: '09:00', title: '', body: '', appId: null })
const configured = ref<boolean | null>(null)
const selectedAppId = ref<number>()
const loading = ref(true), saving = ref(false), testing = ref(false)
const failed = ref(false), historyFailed = ref(false), devicesFailed = ref(false)
const history = ref<IOSWatchfacePushHistory[]>([])
const devices = ref<IOSPushDevice[]>([])
const testDeviceId = ref<number>()

async function load() {
  loading.value = true
  failed.value = historyFailed.value = devicesFailed.value = false
  await Promise.all([
    (async () => { try {
      const result = await getIOSPushStatus()
      configured.value = result.code === 0 && result.data ? result.data.configured : null
    } catch { configured.value = null } })(),
    (async () => { try {
      const result = await getIOSPushConfig()
      if (result.code !== 0 || !result.data) throw new Error()
      Object.assign(form, result.data)
      selectedAppId.value = result.data.appId ?? undefined
    } catch { failed.value = true } })(),
    (async () => { try {
      const result = await getIOSPushHistory()
      if (result.code !== 0) throw new Error()
      history.value = result.data || []
    } catch { historyFailed.value = true } })(),
    (async () => { try {
      const result = await getIOSPushDevices()
      if (result.code !== 0) throw new Error()
      devices.value = result.data || []
      if (!devices.value.some(d => d.id === testDeviceId.value)) testDeviceId.value = devices.value[0]?.id
    } catch { devicesFailed.value = true } })(),
  ])
  loading.value = false
}
async function save() {
  if (loading.value || failed.value || saving.value) return
  if (!form.sendTime || !form.title.trim() || !form.body.trim()) { ElMessage.warning('请填写发送时间、标题和正文'); return }
  saving.value = true
  try {
    const result = await saveIOSPushConfig({ ...form, appId: selectedAppId.value ?? null, title: form.title.trim(), body: form.body.trim() })
    if (result.code !== 0 || !result.data) throw new Error(result.msg || '保存失败')
    Object.assign(form, result.data)
    ElMessage.success('iOS 推送配置已保存')
  } catch (error) { ElMessage.error(error instanceof Error ? error.message : '保存失败，请重试') }
  finally { saving.value = false }
}
async function testPush() {
  if (!testDeviceId.value || !selectedAppId.value || testing.value) return
  testing.value = true
  try {
    const result = await sendIOSPushTest(testDeviceId.value, selectedAppId.value)
    if (result.code !== 0 || !result.data) throw new Error(result.msg || '测试发送失败')
    if (result.data.status === 'SENT') ElMessage.success('苹果已接收测试通知，请检查 iPhone')
    else ElMessage.warning(`测试结果：${result.data.status}，请检查推送服务配置与设备状态`)
  } catch (error) { ElMessage.error(error instanceof Error ? error.message : '测试发送失败') }
  finally { testing.value = false }
}
onMounted(load)
</script>

<style scoped>
.ios-push { margin-top: 24px; }
.push-header, .test-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.push-header { justify-content: space-between; }
.push-form { margin-top: 24px; max-width: 820px; }
.hint { color: var(--el-text-color-secondary); font-size: 13px; line-height: 1.7; }
.time-hint { margin-left: 12px; }
.device-select { width: 360px; max-width: 100%; }
h3 { font-size: 16px; margin-top: 24px; }
</style>
