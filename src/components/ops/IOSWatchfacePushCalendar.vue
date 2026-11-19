<template>
  <section class="push-calendar">
    <div class="calendar-heading"><div><h3>每日精选日历</h3><p class="hint">按用户当地日期和时间发送 · 未配置日期默认自动选择新上架作品</p></div><el-button :loading="loading" @click="load">刷新日历</el-button></div>
    <el-alert title="手动排期优先于自动选择，移除后恢复自动选择。配置在 UTC+14 到达发送时间后锁定，确保全球使用同一份作品和文案；发送仍受定时总开关控制。" type="info" :closable="false" />
    <el-alert v-if="error" :title="error" type="error" :closable="false" />
    <div class="calendar-layout">
      <el-calendar v-model="selected" v-loading="loading">
        <template #date-cell="{ data }"><div class="day-cell"><strong>{{ Number(data.day.slice(-2)) }}</strong>
          <div v-if="byDay[data.day]" class="day-task" :class="{ planned: byDay[data.day].status === 'PLANNED' }"><span>{{ byDay[data.day].productName || '无可推送作品' }}</span><small>{{ statusLabel(byDay[data.day]) }}</small><small>{{ byDay[data.day].config.sendTime }} 当地时间</small></div>
          <small v-else-if="!loading && !error && data.type === 'current-month'" class="automatic">默认自动选择</small>
        </div></template>
      </el-calendar>
      <aside class="day-detail">
        <h3>{{ day }}</h3>
        <template v-if="current">
          <div class="task-heading"><strong>{{ current.productName || '无可推送作品' }}</strong><el-tag size="small">{{ statusLabel(current) }}</el-tag></div>
          <dl><dt>应用</dt><dd>{{ current.appId ? '#' + current.appId : '未选择' }}</dd><dt>选取方式</dt><dd>{{ current.config.appId ? '手动指定' : '自动选择' }}</dd><dt>发送时间</dt><dd>{{ current.config.sendTime }}（用户当地时间）</dd><dt>模板</dt><dd>{{ templateName(current.config.templateId) }}</dd><dt>尝试 / 成功</dt><dd>{{ current.attempted }} / {{ current.sent }}</dd><dt>拒绝 / 未知</dt><dd>{{ current.rejected }} / {{ current.uncertain }}</dd><dt>点击</dt><dd>{{ current.clicked }}</dd></dl>
          <el-button @click="emit('snapshot', JSON.stringify(current.config), current.productName || '')">查看全部语言文案</el-button>
          <div v-if="editable(current)" class="task-actions"><el-button :disabled="loading || busy || !settings" @click="edit">修改排期</el-button><el-button type="danger" plain :disabled="loading || busy" @click="remove">移除手动配置</el-button></div>
          <p v-else class="hint">已进入全球发送时段或任务已固定，不能修改。</p>
        </template>
        <template v-else-if="!loading && !error">
          <p class="hint">当天暂无任务快照或手动排期。默认按全局配置自动选择新上架作品，任务创建后显示实际应用。</p>
          <p v-if="settings" class="hint">默认时间：{{ settings.sendTime }}（用户当地时间）<br>定时推送：{{ settings.enabled ? '已开启' : '已关闭' }}</p>
          <el-button v-if="canCreate" type="primary" :disabled="!settings || busy" @click="edit">指定当天作品</el-button>
        </template>
        <p class="hint">本日历展示每日定时任务；立即推送仍在下方独立记录。每日额度按北京时间统计。</p>
      </aside>
    </div>
    <el-dialog v-model="dialog" :title="editingDay + ' 每日精选排期'" width="680px" :close-on-click-modal="!busy" :close-on-press-escape="!busy" :show-close="!busy">
      <el-form label-width="100px" :disabled="busy">
        <el-form-item label="指定作品"><AppSearchSelect v-model="appId" width="100%" /></el-form-item>
        <el-form-item label="当地时间"><el-time-select v-model="draft.sendTime" start="00:00" step="00:01" end="23:59" /></el-form-item>
        <el-form-item label="消息模板"><el-select v-model="draft.templateId" @change="applyTemplate"><el-option v-for="t in templates" :key="t.id" :value="t.id" :label="t.name" /><el-option label="自定义文案" value="custom" /></el-select></el-form-item>
        <el-form-item label="语言文案"><el-tabs v-model="activeLanguage" class="language-tabs"><el-tab-pane v-for="locale in languages" :key="locale.code" :name="locale.code" :label="locale.name"><label :for="`plan-title-${locale.code}`">通知标题</label><el-input :id="`plan-title-${locale.code}`" v-model="messages[locale.code].title" maxlength="100" show-word-limit @input="draft.templateId = 'custom'" /><label :for="`plan-body-${locale.code}`">通知正文</label><el-input :id="`plan-body-${locale.code}`" v-model="messages[locale.code].body" type="textarea" :rows="3" maxlength="500" show-word-limit @input="draft.templateId = 'custom'" /></el-tab-pane></el-tabs></el-form-item>
      </el-form>
      <p class="hint">支持 {productName} 变量。锁定时间：{{ cutoffLabel }}（北京时间，对应 UTC+14 的发送时间）。</p>
      <template #footer><el-button :disabled="busy" @click="dialog = false">返回</el-button><el-button type="primary" :loading="busy" @click="save">保存排期</el-button></template>
    </el-dialog>
  </section>
</template>
<script setup lang="ts">
import { computed, ref, reactive, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import AppSearchSelect from '@/components/common/AppSearchSelect.vue'
import { getIOSPushCalendar, saveIOSPushPlan, cancelIOSPushPlan, type IOSWatchfacePushSettings, type IOSPushCalendarDay, type IOSPushTemplate, type IOSPushMessage } from '@/api/ios-watchface-push'
const props = defineProps<{ settings?: IOSWatchfacePushSettings; templates: IOSPushTemplate[]; revision: number }>()
const emit = defineEmits<{ snapshot: [value: string, name: string] }>()
const languages = [{ code: 'zh-Hans', name: '简体中文' }, { code: 'en', name: 'English' }, { code: 'de', name: 'Deutsch' }, { code: 'es', name: 'Español' }, { code: 'fr', name: 'Français' }, { code: 'it', name: 'Italiano' }, { code: 'nl', name: 'Nederlands' }, { code: 'pl', name: 'Polski' }, { code: 'pt-BR', name: 'Português (Brasil)' }]
const dateKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
const selected = ref(new Date(today + 'T12:00:00')), day = computed(() => dateKey(selected.value)), month = computed(() => day.value.slice(0,7))
const tasks = ref<IOSPushCalendarDay[]>([]), loading = ref(false), error = ref(''), busy = ref(false), dialog = ref(false), editingDay = ref('')
const byDay = computed(() => Object.fromEntries(tasks.value.map(t => [t.pushDay.slice(0,10), t])))
const current = computed(() => byDay.value[day.value])
const cutoff = (date: string, time: string) => Date.parse(`${date}T${time}:00+14:00`)
const canCreate = computed(() => cutoff(day.value, '23:59') > Date.now())
const editable = (task: IOSPushCalendarDay) => task.status === 'PLANNED' && cutoff(task.pushDay.slice(0,10), task.config.sendTime) > Date.now()
const statusLabel = (task: IOSPushCalendarDay) => ({ PLANNED: '手动排期', READY: '配置已固定', NO_PRODUCT: '无可推送作品' }[task.status] || task.status)
const templateName = (id?: string) => props.templates.find(t => t.id === id)?.name || '自定义 / 旧版'
const appId = ref<number>(), activeLanguage = ref('zh-Hans')
const draft = reactive<IOSWatchfacePushSettings>({ enabled: true, sendTime: '19:35', title: '', body: '', appId: null, templateId: 'custom' })
const messages = reactive<Record<string,IOSPushMessage>>(Object.fromEntries(languages.map(l => [l.code, {title:'', body:''}])))
const cutoffLabel = computed(() => {
  const value = cutoff(editingDay.value, draft.sendTime)
  return Number.isFinite(value) ? new Intl.DateTimeFormat('zh-CN', {timeZone:'Asia/Shanghai', dateStyle:'short', timeStyle:'short', hour12:false}).format(new Date(value)) : '请选择发送时间'
})
let request = 0
async function load() {
  const id = ++request; loading.value = true; error.value = ''; tasks.value = []
  try { const r = await getIOSPushCalendar(month.value); if (r.code !== 0) throw new Error(r.msg || '日历加载失败'); if (id === request) tasks.value = r.data || [] }
  catch(e) { if (id === request) error.value = e instanceof Error ? e.message : '日历加载失败' }
  finally { if (id === request) loading.value = false }
}
function applyTemplate(id: string) {
  const t = props.templates.find(t => t.id === id)
  if (t) for (const l of languages) messages[l.code] = {...t.messages[l.code]}
}
function edit() {
  if (!props.settings || (current.value && !editable(current.value))) return
  editingDay.value = day.value
  const config = current.value?.config || props.settings
  Object.assign(draft, config, {enabled:true})
  appId.value = current.value?.appId ?? undefined
  for (const l of languages) messages[l.code] = {...(config.messages?.[l.code] || {title:config.title,body:config.body})}
  activeLanguage.value = 'zh-Hans'; dialog.value = true
}
async function save() {
  if (busy.value) return
  if (!appId.value || !draft.sendTime || !(cutoff(editingDay.value,draft.sendTime) > Date.now())) { ElMessage.warning('请选择作品和尚未进入全球发送时段的时间'); return }
  for (const l of languages) if (!messages[l.code].title.trim() || !messages[l.code].body.trim()) { activeLanguage.value = l.code; ElMessage.warning(`请补齐 ${l.name} 文案`); return }
  const config = {...draft, appId:appId.value, title:messages.en.title.trim(), body:messages.en.body.trim(), messages:Object.fromEntries(languages.map(l => [l.code, {title:messages[l.code].title.trim(), body:messages[l.code].body.trim()}]))}
  busy.value = true
  try { const r = await saveIOSPushPlan(editingDay.value,config); if (r.code !== 0) throw new Error(r.msg || '保存失败'); dialog.value = false; ElMessage.success('手动排期已保存'); await load() }
  catch(e) { ElMessage.error(e instanceof Error ? e.message : '保存失败') }
  finally { busy.value = false }
}
async function remove() {
  if (busy.value || !current.value || !editable(current.value)) return
  const target = current.value.pushDay.slice(0,10)
  busy.value = true
  try { await ElMessageBox.confirm(`移除 ${target} 的手动配置？当天将恢复自动选择。`, '移除手动配置', {type:'warning'}); const r = await cancelIOSPushPlan(target); if (r.code !== 0) throw new Error(r.msg || '移除失败'); await load() }
  catch(e) { if (e !== 'cancel' && e !== 'close') ElMessage.error(e instanceof Error ? e.message : '移除失败') }
  finally { busy.value = false }
}
watch([month, () => props.revision], load, {immediate:true})
</script>
<style scoped>
.push-calendar { margin-top: 28px; border-top: 1px solid var(--el-border-color-light); padding-top: 20px; }
.calendar-heading, .task-heading, .task-actions { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
h3 { margin: 0 0 12px; font-size: 16px; }
.hint { color: var(--el-text-color-secondary); font-size: 13px; line-height: 1.7; }
.calendar-layout { display: grid; grid-template-columns: minmax(0,1fr) 330px; gap: 20px; margin-top: 16px; }
.day-cell { min-height: 110px; font-size: 12px; }
.day-task { background: var(--el-fill-color-light); border-left: 3px solid var(--el-color-primary); padding: 5px; margin-top: 5px; border-radius: 4px; }
.day-task span { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.day-task small, .automatic { display: block; color: var(--el-text-color-secondary); margin-top: 4px; }
.planned { background: var(--el-color-success-light-9); border-color: var(--el-color-success); }
.day-detail { border: 1px solid var(--el-border-color-light); border-radius: 8px; padding: 16px; min-width: 0; }
dl { display: grid; grid-template-columns: 90px minmax(0,1fr); gap: 10px; font-size: 13px; line-height: 1.5; }
dt { color: var(--el-text-color-secondary); } dd { margin: 0; overflow-wrap: anywhere; }
.task-actions { margin-top: 16px; justify-content: flex-start; flex-wrap: wrap; }
.language-tabs { width: 100%; min-width: 0; } .language-tabs label { display: block; margin-top: 12px; }
:deep(.el-calendar) { --el-calendar-cell-width: auto; }
:deep(.el-calendar__body) { padding: 12px 0; } :deep(.el-calendar-day) { min-height: 140px; }
@media(max-width:1200px) { .calendar-layout { grid-template-columns: minmax(0,1fr); } }
@media(max-width:650px) { .calendar-layout { overflow-x:auto; } :deep(.el-calendar) { min-width:600px; } .calendar-heading { align-items:flex-start; } }
</style>
