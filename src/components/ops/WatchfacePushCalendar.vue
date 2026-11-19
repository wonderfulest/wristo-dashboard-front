<template>
  <section class="push-calendar">
    <div class="calendar-heading"><div><h3>每日推送日历</h3><p class="hint">北京时间 · 点击日期查看应用与配置，今天及未来日期可安排一款定时作品。</p></div><el-button :loading="loading" @click="load">刷新日历</el-button></div>
    <el-alert v-if="error" :title="error" type="error" :closable="false" />
    <el-alert title="日期排期替代当天默认定时任务；移除排期后当天恢复自动选择。总开关关闭时排期暂停发送，立即任务仍独立展示。" type="info" :closable="false" />
    <div class="calendar-layout">
      <el-calendar v-model="selected" v-loading="loading">
        <template #date-cell="{ data }">
          <div class="day-cell"><strong>{{ Number(data.day.slice(-2)) }}</strong>
            <div v-for="task in (byDay[data.day] || []).slice(0, 2)" :key="task.taskId" class="day-task" :class="{ planned: task.status === 'PLANNED', cancelled: task.status === 'CANCELLED' }">
              <span>{{ task.productName || '无可推送作品' }}</span><small>{{ statuses[task.status] || task.status }}</small>
            </div><small v-if="(byDay[data.day]?.length || 0) > 2">另有 {{ byDay[data.day].length - 2 }} 个任务</small>
          </div>
        </template>
      </el-calendar>
      <aside class="day-detail">
        <h3>{{ day }} <el-tag size="small">{{ daily.length }} 个任务</el-tag></h3>
        <p v-if="!loading && !error && !daily.length" class="hint">当天暂无已保存的任务或排期。未配置日期按全局规则运行，自动选择的应用在任务创建后显示。</p>
        <article v-for="task in daily" :key="task.taskId" class="task-detail">
          <div class="task-heading"><strong>{{ task.productName || '无可推送作品' }}</strong><el-tag size="small">{{ statuses[task.status] || task.status }}</el-tag></div>
          <dl><dt>应用</dt><dd>{{ task.appId ? '#' + task.appId : '未选择' }}</dd><dt>方式 / 时间</dt><dd>{{ task.taskId.startsWith('scheduled:') ? '定时 · ' + task.config.sendTime : '立即 · ' + task.createdAt }}</dd><dt>选择方式</dt><dd>{{ task.config.selectionMode === 'MANUAL' ? '指定作品' : '自动选择' }}</dd><dt>来源文案</dt><dd>{{ task.config.source }}</dd><dt>模板</dt><dd>{{ task.config.templateId }}</dd><dt>发送结果</dt><dd>成功 {{ task.sent }} · 拒绝 {{ task.rejected }} · 未知 {{ task.uncertain }}</dd></dl>
          <div v-if="canPlan && task.status === 'PLANNED'" class="task-actions"><el-button size="small" :disabled="busy || loading" @click="edit(task)">修改排期</el-button><el-button size="small" type="danger" plain :disabled="busy || loading" @click="cancel(task)">移除手动配置</el-button></div>
        </article>
        <el-button v-if="canPlan && !daily.some(t => t.taskId.startsWith('scheduled:') && t.status !== 'CANCELLED')" type="primary" :disabled="loading || !!error || !settings" @click="edit()">安排当天推送</el-button>
      </aside>
    </div>
    <el-dialog v-model="dialog" :title="editingDay + ' 推送排期'" width="560px" :close-on-click-modal="!busy" :close-on-press-escape="!busy" :show-close="!busy">
      <el-form label-width="100px" :disabled="busy">
        <el-form-item label="推送应用"><AppSearchSelect v-model="appId" width="100%" /></el-form-item>
        <el-form-item label="发送时间"><el-time-select v-model="draft.sendTime" start="00:00" step="00:01" end="23:59" /><span class="hint">北京时间</span></el-form-item>
        <el-form-item label="来源文案"><el-input v-model="draft.source" maxlength="20" show-word-limit /></el-form-item>
        <el-form-item label="订阅模板"><span class="template-id">{{ draft.templateId }}</span></el-form-item>
      </el-form><p class="hint">使用已保存的订阅模板。发送时仍检查应用公开状态、订阅授权和每日额度；需开启全局推送。</p>
      <template #footer><el-button :disabled="busy" @click="dialog = false">返回</el-button><el-button type="primary" :loading="busy" @click="save">保存排期</el-button></template>
    </el-dialog>
  </section>
</template>
<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import AppSearchSelect from '@/components/common/AppSearchSelect.vue'
import { getWatchfacePushCalendar, saveWatchfacePushPlan, cancelWatchfacePushPlan, type WatchfacePushCalendarTask, type WatchfacePushSettings } from '@/api/watchface-push'
const props = defineProps<{ settings?: WatchfacePushSettings; revision: number }>()
const beijingDay = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
const selected = ref(new Date(beijingDay() + 'T12:00:00'))
const day = computed(() => `${selected.value.getFullYear()}-${String(selected.value.getMonth()+1).padStart(2,'0')}-${String(selected.value.getDate()).padStart(2,'0')}`)
const month = computed(() => day.value.slice(0,7))
const tasks = ref<WatchfacePushCalendarTask[]>([]), loading = ref(false), error = ref(''), busy = ref(false), dialog = ref(false), editingDay = ref('')
const statuses: Record<string,string> = { PLANNED: '待发送', CANCELLED: '已取消', READY: '已创建 / 发送中', COMPLETED: '已处理完成', EXPIRED: '已过期', NO_NEW_PRODUCT: '无可推送作品' }
const byDay = computed(() => tasks.value.reduce<Record<string,WatchfacePushCalendarTask[]>>((map,t) => { (map[t.pushDay.slice(0,10)] ||= []).push(t); return map }, {}))
const daily = computed(() => byDay.value[day.value] || [])
const canPlan = computed(() => day.value >= beijingDay())
const appId = ref<number>()
const draft = reactive<WatchfacePushSettings>({ enabled: true, sendTime: '09:00', source: 'Wristo', templateId: '', selectionMode: 'MANUAL', appId: null })
let request = 0
async function load() {
  const id = ++request
  loading.value = true; error.value = ''; tasks.value = []
  try { const result = await getWatchfacePushCalendar(month.value); if (result.code !== 0) throw new Error(result.msg || '日历加载失败'); if (id === request) tasks.value = result.data || [] }
  catch (e) { if (id === request) error.value = e instanceof Error ? e.message : '日历加载失败，请重试' }
  finally { if (id === request) loading.value = false }
}
function edit(task?: WatchfacePushCalendarTask) {
  if (!props.settings || !canPlan.value) return
  editingDay.value = day.value
  Object.assign(draft, task?.config || props.settings, { enabled: true, selectionMode: 'MANUAL', templateId: props.settings.templateId })
  appId.value = task?.appId ?? undefined; dialog.value = true
}
async function save() {
  if (busy.value) return
  if (!appId.value || !draft.sendTime || !draft.source.trim() || !draft.templateId) { ElMessage.warning('请选择应用并完整填写排期'); return }
  busy.value = true
  try { const result = await saveWatchfacePushPlan(editingDay.value, { ...draft, appId: appId.value, source: draft.source.trim() }); if (result.code !== 0) throw new Error(result.msg || '保存失败'); dialog.value = false; ElMessage.success('排期已保存'); await load() }
  catch(e) { ElMessage.error(e instanceof Error ? e.message : '保存失败') }
  finally { busy.value = false }
}
async function cancel(task: WatchfacePushCalendarTask) {
  if (busy.value) return
  busy.value = true
  try { await ElMessageBox.confirm(`取消 ${task.pushDay.slice(0,10)} 的推送？移除后当天恢复默认自动选择。`, '移除手动配置', { type: 'warning' }); const result = await cancelWatchfacePushPlan(task.pushDay.slice(0,10)); if (result.code !== 0) throw new Error(result.msg || '取消失败'); await load() }
  catch(e) { if (e !== 'cancel' && e !== 'close') ElMessage.error(e instanceof Error ? e.message : '取消失败') }
  finally { busy.value = false }
}
watch([month, () => props.revision], load, { immediate: true })
</script>
<style scoped>
.push-calendar { margin-top: 28px; border-top: 1px solid var(--el-border-color-light); padding-top: 20px; }
.calendar-heading, .task-heading, .task-actions { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
h3 { margin: 0 0 12px; font-size: 16px; }
.hint { color: var(--el-text-color-secondary); font-size: 13px; line-height: 1.7; }
.calendar-layout { display: grid; grid-template-columns: minmax(0, 1fr) 330px; gap: 20px; margin-top: 16px; }
.day-cell { min-height: 110px; font-size: 12px; }
.day-task { background: var(--el-fill-color-light); border-left: 3px solid var(--el-color-primary); padding: 3px 5px; margin-top: 5px; border-radius: 4px; }
.day-task span { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.day-task small { color: var(--el-text-color-secondary); }
.planned { background: var(--el-color-success-light-9); border-color: var(--el-color-success); }
.cancelled { opacity: .6; border-color: var(--el-text-color-placeholder); }
.day-detail { border: 1px solid var(--el-border-color-light); border-radius: 8px; padding: 16px; min-width: 0; }
.task-detail { padding: 16px 0; border-bottom: 1px solid var(--el-border-color-light); margin-bottom: 16px; }
dl { display: grid; grid-template-columns: 82px minmax(0,1fr); gap: 10px; font-size: 13px; line-height: 1.5; }
dt { color: var(--el-text-color-secondary); } dd { margin: 0; overflow-wrap: anywhere; }
.template-id { overflow-wrap: anywhere; }
:deep(.el-calendar) { --el-calendar-cell-width: auto; }
:deep(.el-calendar__body) { padding: 12px 0; }
:deep(.el-calendar-day) { min-height: 140px; }
@media(max-width: 1200px) { .calendar-layout { grid-template-columns: minmax(0,1fr); } }
@media(max-width: 650px) { .calendar-layout { overflow-x: auto; } :deep(.el-calendar) { min-width: 600px; } .calendar-heading { align-items: flex-start; } }
</style>
