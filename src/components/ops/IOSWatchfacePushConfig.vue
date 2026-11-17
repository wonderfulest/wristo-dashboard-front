<template>
  <el-card class="ios-push" shadow="never">
    <template #header><div class="push-header"><span>iOS 每日精选推送</span><el-button :loading="loading" :disabled="busy" @click="load">刷新配置与记录</el-button></div></template>
    <el-alert title="一份配置，按 App 语言发送。立即与定时推送共用每天一条的额度，同一表盘不重复推荐。" type="info" :closable="false" />
    <el-alert v-if="configured === false" title="APNs 尚未配置，暂时无法发送。" type="warning" :closable="false" />
    <el-alert v-if="failed" title="配置或模板加载失败，请刷新后重试。" type="error" :closable="false" />
    <el-form label-width="140px" :disabled="loading || busy || failed" class="push-form">
      <el-form-item label="开启定时推送"><el-switch v-model="form.enabled" /></el-form-item>
      <el-form-item label="用户当地时间">
        <el-time-select v-model="form.sendTime" start="00:00" step="00:01" end="23:59" />
        <div class="hint">建议晚间 19:35。全球只配置一次：按用户设备时区发送，自动适配夏令时，无需换算北京时间。</div>
      </el-form-item>
      <el-form-item label="指定表盘"><AppSearchSelect v-model="selectedAppId" width="100%" /></el-form-item>
      <el-form-item label="消息模板">
        <el-select v-model="form.templateId" placeholder="选择模板，填入全部语言文案" @change="applyTemplate">
          <el-option v-for="template in templates" :key="template.id" :label="template.name" :value="template.id" />
          <el-option label="自定义文案" value="custom" />
        </el-select>
        <div class="hint">选择模板会替换全部语言文案。支持 {productName} 自动填入表盘名称；名称保留作品原名。</div>
      </el-form-item>
      <el-form-item label="多语言文案">
        <el-alert v-if="legacy" title="当前保存的是旧版单语言文案。请选择模板补齐 9 种语言后保存。" type="warning" :closable="false" />
        <el-tabs v-model="activeLanguage" class="language-tabs">
          <el-tab-pane v-for="locale in languages" :key="locale.code" :label="locale.name" :name="locale.code">
            <label :for="`push-title-${locale.code}`">通知标题</label>
            <el-input :id="`push-title-${locale.code}`" v-model="messages[locale.code].title" maxlength="100" show-word-limit @input="edited" />
            <label :for="`push-body-${locale.code}`">通知正文</label>
            <el-input :id="`push-body-${locale.code}`" v-model="messages[locale.code].body" type="textarea" :rows="3" maxlength="500" show-word-limit @input="edited" />
          </el-tab-pane>
        </el-tabs>
      </el-form-item>
      <el-form-item>
        <div class="actions">
          <el-button type="primary" :loading="saving" @click="save">保存定时配置</el-button>
          <el-button :disabled="!selectedAppId" @click="showPreview(false)">预览 9 种语言</el-button>
          <el-button type="success" :disabled="!selectedAppId || configured !== true" @click="showPreview(true)">立即推送…</el-button>
        </div>
      </el-form-item>
    </el-form>
    <p class="hint">定时配置在当天首个时区任务开始时固定，之后修改用于下一当地日期；关闭定时开关停止尚未发送的定时通知。立即推送使用当前编辑内容，不更改已保存的定时配置，也不受定时开关影响。两种方式都只向已订阅用户发送，并保留至少 20 小时的发送间隔。</p>
    <h3>发送到我的测试设备</h3>
    <p class="hint">在 iPhone 上用当前后台账号登录并开启「每日精选」。测试使用当前编辑内容和设备语言，不占正式额度。</p>
    <el-alert v-if="devicesFailed" title="测试设备加载失败，请刷新重试。" type="warning" :closable="false" />
    <div class="test-row">
      <el-select v-model="testDeviceId" aria-label="测试设备" placeholder="选择我的已订阅设备" :disabled="loading || busy || devicesFailed" class="device-select">
        <el-option v-for="device in devices" :key="device.id" :value="device.id" :label="`${device.environment === 'production' ? '正式版' : '开发版'} · ${device.installationId.slice(0, 8)} · ${device.language} · ${device.timeZone}`" />
      </el-select>
      <el-button :loading="testing" :disabled="loading || busy || failed || !testDeviceId || !selectedAppId || configured !== true" @click="testPush">发送测试通知</el-button>
    </div>
    <h3>最近立即推送任务</h3>
    <el-table :data="tasks" empty-text="暂无立即推送任务">
      <el-table-column prop="createdAt" label="提交时间" min-width="170" />
      <el-table-column prop="productName" label="表盘" min-width="160" />
      <el-table-column label="状态" min-width="140"><template #default="{ row }">{{ taskStatus[row.status] || row.status }}</template></el-table-column>
      <el-table-column label="文案"><template #default="{ row }"><el-button link @click="viewSnapshot(row.contentJson, row.productName)">查看快照</el-button></template></el-table-column>
    </el-table>
    <h3>最近发送记录（最多 30 组）</h3>
    <el-alert v-if="historyFailed" title="发送记录加载失败，请刷新重试。" type="warning" :closable="false" />
    <el-table :data="history" empty-text="暂无发送记录">
      <el-table-column prop="pushDay" label="用户当地日期" width="140" />
      <el-table-column label="方式" width="90"><template #default="{ row }">{{ row.sendMode === 'IMMEDIATE' ? '立即' : '定时' }}</template></el-table-column>
      <el-table-column prop="productName" label="表盘" min-width="140" />
      <el-table-column prop="appId" label="appId" width="90" />
      <el-table-column prop="attempted" label="尝试" width="70" />
      <el-table-column prop="sent" label="苹果已接收" width="110" />
      <el-table-column prop="rejected" label="拒绝" width="70" />
      <el-table-column prop="uncertain" label="处理中/未知" width="120" />
      <el-table-column prop="clicked" label="点击" width="70" />
      <el-table-column label="文案"><template #default="{ row }"><el-button link :disabled="!row.contentJson" @click="viewSnapshot(row.contentJson, row.productName)">查看快照</el-button></template></el-table-column>
    </el-table>
    <p class="hint">苹果已接收不代表已送达。未知结果不自动重发；立即任务异常时停止，超过一小时未完成的任务过期。完成表示已检查符合条件的设备，不表示每位订阅用户都获得发送额度。</p>
    <el-dialog v-model="previewOpen" :title="confirmSend ? '确认立即推送' : '多语言消息预览'" width="min(900px, 95vw)" :close-on-click-modal="!sending" :close-on-press-escape="!sending" :show-close="!sending">
      <p><strong>{{ previewName }}</strong> · {{ previewTemplateName }}</p>
      <el-alert v-if="confirmSend" title="发送给所有符合条件的已订阅用户，立即执行，不等待当地晚间。占用每位用户当天额度，已推送过此表盘或未满间隔的用户会跳过。" type="warning" :closable="false" />
      <div class="preview-grid"><article v-for="locale in languages" :key="locale.code" class="notification-preview"><small>{{ locale.name }}</small><strong>{{ previewMessages[locale.code]?.title }}</strong><p>{{ previewMessages[locale.code]?.body }}</p></article></div>
      <template #footer><el-button :disabled="sending" @click="previewOpen = false">关闭</el-button><el-button v-if="confirmSend" type="primary" :loading="sending" @click="sendNow">确认立即推送</el-button></template>
    </el-dialog>
  </el-card>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import AppSearchSelect from '@/components/common/AppSearchSelect.vue'
import { getIOSPushStatus, getIOSPushConfig, saveIOSPushConfig, getIOSPushHistory, getIOSPushDevices, sendIOSPushTest,
  getIOSPushTemplates, previewIOSPush, sendIOSPushNow, getIOSImmediateHistory,
  type IOSWatchfacePushSettings, type IOSWatchfacePushHistory, type IOSPushDevice, type IOSPushMessage, type IOSPushTemplate, type IOSImmediateTask } from '@/api/ios-watchface-push'
const languages = [{ code: 'zh-Hans', name: '简体中文' }, { code: 'en', name: 'English' }, { code: 'de', name: 'Deutsch' }, { code: 'es', name: 'Español' }, { code: 'fr', name: 'Français' }, { code: 'it', name: 'Italiano' }, { code: 'nl', name: 'Nederlands' }, { code: 'pl', name: 'Polski' }, { code: 'pt-BR', name: 'Português (Brasil)' }]
const messages = reactive<Record<string, IOSPushMessage>>(Object.fromEntries(languages.map(l => [l.code, { title: '', body: '' }])))
const form = reactive<IOSWatchfacePushSettings>({ enabled: false, sendTime: '19:35', title: '', body: '', appId: null, templateId: 'custom' })
const configured = ref<boolean | null>(null), selectedAppId = ref<number>(), testDeviceId = ref<number>()
const loading = ref(true), saving = ref(false), testing = ref(false), sending = ref(false), previewing = ref(false)
const busy = computed(() => saving.value || testing.value || sending.value || previewing.value)
const failed = ref(false), historyFailed = ref(false), devicesFailed = ref(false), legacy = ref(false)
const templates = ref<IOSPushTemplate[]>([]), history = ref<IOSWatchfacePushHistory[]>([]), devices = ref<IOSPushDevice[]>([]), tasks = ref<IOSImmediateTask[]>([])
const activeLanguage = ref('zh-Hans'), previewOpen = ref(false), confirmSend = ref(false), previewName = ref(''), previewTemplateName = ref('')
const previewMessages = ref<Record<string, IOSPushMessage>>({})
let pendingConfig: IOSWatchfacePushSettings | undefined
let requestId = ''
const taskStatus: Record<string, string> = { QUEUED: '排队 / 发送中', COMPLETED: '已处理完成', STOPPED: '发送异常，已停止', EXPIRED: '已过期', UNAVAILABLE: '表盘已不可用' }
function edited() { form.templateId = 'custom' }
function applyTemplate(id: string) {
  const template = templates.value.find(t => t.id === id)
  if (template) { Object.assign(messages, JSON.parse(JSON.stringify(template.messages))); legacy.value = false }
}
function draft(): IOSWatchfacePushSettings {
  for (const locale of languages) {
    if (!messages[locale.code].title.trim() || !messages[locale.code].body.trim()) {
      activeLanguage.value = locale.code
      throw new Error(`请补齐 ${locale.name} 的标题与正文`)
    }
  }
  return { ...form, title: messages.en.title, body: messages.en.body, appId: selectedAppId.value ?? null,
    messages: Object.fromEntries(languages.map(l => [l.code, { title: messages[l.code].title.trim(), body: messages[l.code].body.trim() }])) }
}
function errorMessage(error: unknown) { ElMessage.error(error instanceof Error ? error.message : '操作失败，请重试') }
async function load() {
  loading.value = true
  failed.value = historyFailed.value = devicesFailed.value = false
  await Promise.all([
    (async () => { try { const r = await getIOSPushStatus(); configured.value = r.code === 0 && r.data ? r.data.configured : null } catch { configured.value = null } })(),
    (async () => { try {
      const [c, t] = await Promise.all([getIOSPushConfig(), getIOSPushTemplates()])
      if (c.code !== 0 || !c.data || t.code !== 0 || !t.data) throw new Error()
      templates.value = t.data
      Object.assign(form, c.data)
      selectedAppId.value = c.data.appId ?? undefined
      legacy.value = !c.data.messages || Object.keys(c.data.messages).length === 0
      for (const l of languages) messages[l.code] = c.data.messages?.[l.code] ?? { title: '', body: '' }
      if (legacy.value) { form.templateId = 'custom'; messages['zh-Hans'] = { title: c.data.title, body: c.data.body } }
    } catch { failed.value = true } })(),
    (async () => { try {
      const [h,t] = await Promise.all([getIOSPushHistory(), getIOSImmediateHistory()])
      if (h.code !== 0 || t.code !== 0) throw new Error()
      history.value = h.data || []; tasks.value = t.data || []
    } catch { historyFailed.value = true } })(),
    (async () => { try {
      const r = await getIOSPushDevices(); if (r.code !== 0) throw new Error()
      devices.value = r.data || []
      if (!devices.value.some(d => d.id === testDeviceId.value)) testDeviceId.value = devices.value[0]?.id
    } catch { devicesFailed.value = true } })(),
  ])
  loading.value = false
}
async function save() {
  saving.value = true
  try {
    const r = await saveIOSPushConfig(draft())
    if (r.code !== 0 || !r.data) throw new Error(r.msg || '保存失败')
    Object.assign(form, r.data); legacy.value = false
    ElMessage.success('已保存一份全球定时配置，按用户当地时间发送')
  } catch (e) { errorMessage(e) } finally { saving.value = false }
}
async function showPreview(send: boolean) {
  previewing.value = true
  try {
    const config = draft(), r = await previewIOSPush(config)
    if (r.code !== 0 || !r.data) throw new Error(r.msg || '预览失败')
    pendingConfig = config; requestId = crypto.randomUUID()
    previewMessages.value = r.data.messages; previewName.value = r.data.productName
    previewTemplateName.value = templates.value.find(t => t.id === config.templateId)?.name ?? '自定义'
    confirmSend.value = send; previewOpen.value = true
  } catch (e) { errorMessage(e) } finally { previewing.value = false }
}
function viewSnapshot(value: string, name: string) {
  try {
    const config: IOSWatchfacePushSettings = JSON.parse(value)
    previewMessages.value = Object.fromEntries(languages.map(l => {
      const m = config.messages?.[l.code] ?? { title: config.title, body: config.body }
      return [l.code, { title: m.title.split('{productName}').join(name || ''), body: m.body.split('{productName}').join(name || '') }]
    }))
    previewName.value = name; previewTemplateName.value = templates.value.find(t => t.id === config.templateId)?.name ?? '自定义 / 旧版'
    confirmSend.value = false; previewOpen.value = true
  } catch { ElMessage.error('历史文案无法读取') }
}
async function sendNow() {
  if (!pendingConfig || sending.value) return
  sending.value = true
  try {
    const r = await sendIOSPushNow(requestId, pendingConfig)
    if (r.code !== 0) throw new Error(r.msg || '提交失败')
    previewOpen.value = false
    ElMessage.success('立即推送任务已提交，后台将在数秒内开始处理；可刷新查看结果')
    const t = await getIOSImmediateHistory(); if (t.code === 0) tasks.value = t.data || []
  } catch (e) { errorMessage(e) } finally { sending.value = false }
}
async function testPush() {
  if (!testDeviceId.value || !selectedAppId.value) return
  testing.value = true
  try {
    const r = await sendIOSPushTest(testDeviceId.value, selectedAppId.value, draft())
    if (r.code !== 0 || !r.data) throw new Error(r.msg || '测试失败')
    if (r.data.status === 'SENT') ElMessage.success('苹果已接收测试通知，请检查 iPhone')
    else ElMessage.warning(`测试结果：${r.data.status}`)
  } catch (e) { errorMessage(e) } finally { testing.value = false }
}
onMounted(load)
</script>

<style scoped>
.ios-push { margin-top: 24px; }
.push-header, .test-row, .actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.push-header { justify-content: space-between; }
.push-form { margin-top: 24px; max-width: 960px; }
.hint { color: var(--el-text-color-secondary); font-size: 13px; line-height: 1.7; }
.device-select { width: 400px; max-width: 100%; }
.language-tabs { width: 100%; min-width: 0; }
.language-tabs label { display: block; margin-top: 12px; }
.preview-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px; margin-top: 16px; }
.notification-preview { background: var(--el-fill-color-light); padding: 16px; border-radius: 12px; overflow-wrap: anywhere; }
.notification-preview small, .notification-preview strong { display: block; margin-bottom: 8px; }
.notification-preview small { color: var(--el-text-color-secondary); }
.notification-preview p { margin: 0; line-height: 1.6; }
h3 { font-size: 16px; margin-top: 24px; }
</style>
