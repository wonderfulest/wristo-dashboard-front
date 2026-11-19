<template>
  <el-card shadow="never" v-loading="configLoading">
    <template #header>自定义积分任务</template>
    <el-alert v-if="configError" :title="configError" type="error" :closable="false" />
    <p>每个任务按账号累计设置领取次数，0 表示不限次数。待审核和已通过的申请占用次数，驳回后释放。提交时固定奖励额度，调整配置不影响已有申请。</p>
    <el-form label-position="top">
      <PointsTaskFields v-for="item in configs" :key="item.kind" :task="item" period="ACCOUNT"
        :disabled="configSaving || configLoading || configUncertain" :switch-disabled="!saved.has(item.kind)"
        @toggle="toggleConfig(item, $event)" @save="saveConfig(item)">
        <el-form-item label="排序"><el-input-number v-model="item.sortOrder" :min="0" :max="100000" :precision="0" :disabled="configSaving" /></el-form-item>
      </PointsTaskFields>
    </el-form>
    <el-button :disabled="configSaving || configLoading" @click="addConfig">新增任务</el-button>
    <el-button :disabled="configSaving || configLoading" @click="loadConfig">刷新配置</el-button>
  </el-card>
  <el-card shadow="never" v-loading="loading">
    <template #header>任务凭证审核</template>
    <el-alert v-if="error" :title="error" type="error" :closable="false" />
    <div class="filters">
      <el-select v-model="status" style="width: 180px" :disabled="busy" @change="page = 1; load()">
        <el-option label="待审核" value="PENDING" /><el-option label="已通过" value="APPROVED" />
        <el-option label="已驳回" value="REJECTED" /><el-option label="全部" value="" />
      </el-select>
      <el-button :disabled="busy" @click="load">刷新</el-button>
    </div>
    <el-table :data="items" empty-text="暂无申请">
      <el-table-column label="操作" width="170"><template #default="{ row }">
        <el-button :disabled="busy" @click="open(row)">查看凭证 / 审核</el-button>
      </template></el-table-column>
      <el-table-column prop="userId" label="账号 ID" width="110" />
      <el-table-column label="任务" width="110"><template #default="{ row }">{{ row.taskName || row.kind }}</template></el-table-column>
      <el-table-column prop="points" label="积分" width="90" />
      <el-table-column label="状态" width="100"><template #default="{ row }">{{ statuses[row.status as keyof typeof statuses] }}</template></el-table-column>
      <el-table-column label="提交时间" min-width="180"><template #default="{ row }">{{ date(row.createdAt) }}</template></el-table-column>
      <el-table-column prop="reviewerId" label="审核人 ID" width="110" />
      <el-table-column prop="reason" label="审核说明" min-width="180" />
    </el-table>
    <el-pagination v-model:current-page="page" :page-size="20" :total="total" layout="prev, pager, next, total" :disabled="busy" @current-change="load" />
  </el-card>
  <el-dialog v-model="dialog" title="任务凭证" width="min(720px, 94vw)" :close-on-click-modal="!busy" :show-close="!busy" :close-on-press-escape="!busy">
    <template v-if="selected">
      <p>{{ selected.taskName || selected.kind }} · {{ selected.points }} 积分 · {{ statuses[selected.status] }}</p>
      <p>账号 {{ selected.userId }} · 提交于 {{ date(selected.createdAt) }}</p>
      <p v-if="selected.link"><a :href="selected.link" target="_blank" rel="noopener noreferrer">{{ selected.link }}</a></p>
      <p class="note">{{ selected.note || '无备注' }}</p>
      <el-alert v-if="evidenceError" :title="evidenceError" type="error" :closable="false" />
      <div v-loading="evidenceLoading"><el-image v-if="image" :src="image" :preview-src-list="[image]" fit="contain" class="evidence" /></div>
      <p v-if="selected.reviewedAt">审核人 {{ selected.reviewerId }} · {{ date(selected.reviewedAt) }}</p>
      <p v-if="selected.status !== 'PENDING'">{{ selected.reason || '审核通过' }}</p>
      <el-input v-else v-model="reason" type="textarea" :maxlength="500" show-word-limit placeholder="审核说明（驳回时必填）" :disabled="busy" />
    </template>
    <template #footer>
      <el-button :disabled="busy" @click="dialog = false">关闭</el-button>
      <template v-if="selected?.status === 'PENDING'">
        <el-button type="danger" :disabled="busy" @click="review(false)">驳回</el-button>
        <el-button type="primary" :disabled="busy || evidenceLoading || !!evidenceError" @click="review(true)">通过并发放 {{ selected.points }} 积分</el-button>
      </template>
    </template>
  </el-dialog>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import PointsTaskFields from '@/components/PointsTaskFields.vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getManualTaskConfig, createManualTaskConfig, saveManualTaskConfig, getManualTasks, reviewManualTask, getManualTaskEvidence, type ManualTaskConfig, type ManualSubmission } from '@/api/manualPointsTasks'
const saved = ref(new Map<string, ManualTaskConfig>())
const configUncertain = ref(false)
const statuses = { PENDING: '待审核', APPROVED: '已通过', REJECTED: '已驳回' }
const date = (value: string) => new Date(value).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
const configs = ref<ManualTaskConfig[]>([]), configLoading = ref(false), configSaving = ref(false), configError = ref('')
const items = ref<ManualSubmission[]>([]), page = ref(1), total = ref(0), status = ref('PENDING'), loading = ref(false), busy = ref(false), error = ref('')
const selected = ref<ManualSubmission>(), dialog = ref(false), reason = ref(''), image = ref(''), evidenceLoading = ref(false), evidenceError = ref('')
let revision = 0, evidenceRevision = 0
async function loadConfig() {
  if (configLoading.value || configSaving.value) return
  configLoading.value = true; configError.value = ''
  try { const r = await getManualTaskConfig(); if (r.code !== 0 || !r.data) throw new Error(); configs.value = r.data; configUncertain.value = false; saved.value.clear(); r.data.forEach(item => saved.value.set(item.kind, { ...item })) }
  catch { configError.value = '配置读取失败，请重试。' }
  finally { configLoading.value = false }
}
function addConfig() {
  configs.value.push({ kind: 'TASK_' + crypto.randomUUID().replace(/-/g, '').slice(0, 24).toUpperCase(), name: '', description: '', points: 50, enabled: false, maxClaims: 0, sortOrder: 0 })
}
async function toggleConfig(item: ManualTaskConfig, enabled: boolean) {
  const previous = saved.value.get(item.kind)
  if (!previous || configSaving.value || configLoading.value || configUncertain.value) return
  configSaving.value = true; configError.value = ''
  try {
    const r = await saveManualTaskConfig({ ...previous, enabled })
    if (r.code !== 0 || !r.data) throw new Error()
    saved.value.set(item.kind, { ...r.data }); item.enabled = r.data.enabled
  } catch {
    item.enabled = previous.enabled; configUncertain.value = true
    configError.value = '未能确认开关保存结果，请刷新配置核对。'
  } finally { configSaving.value = false }
}
async function saveConfig(item: ManualTaskConfig) {
  if (configSaving.value || configLoading.value || configUncertain.value) return
  if (!item.name.trim() || item.name.length > 120 || item.description.length > 2000) { ElMessage.warning('请填写任务名称，并检查名称和说明长度'); return }
  if (!Number.isInteger(item.points) || item.points < 1 || item.points > 100000) { ElMessage.warning('积分须为 1 至 100000 的整数'); return }
  if (![item.maxClaims, item.sortOrder].every(value => Number.isInteger(value) && value >= 0 && value <= 100000)) { ElMessage.warning('次数和排序须为非负整数'); return }
  configSaving.value = true; configError.value = ''
  try {
    const write = saved.value.has(item.kind) ? saveManualTaskConfig : createManualTaskConfig
    const r = await write({ ...item, name: item.name.trim(), description: item.description.trim() })
    if (r.code !== 0 || !r.data) throw new Error()
    Object.assign(item, r.data); saved.value.set(item.kind, { ...r.data }); ElMessage.success('已保存')
  } catch { configUncertain.value = true; configError.value = '未能确认保存结果，请刷新配置核对。' }
  finally { configSaving.value = false }
}
async function load() {
  const current = ++revision; loading.value = true; error.value = ''; items.value = []
  try { const r = await getManualTasks(page.value, status.value); if (r.code !== 0 || !r.data) throw new Error(); if (current === revision) { items.value = r.data.items; total.value = r.data.total } }
  catch { if (current === revision) error.value = '申请读取失败，请重试。' }
  finally { if (current === revision) loading.value = false }
}
async function open(row: ManualSubmission) {
  selected.value = row; reason.value = ''; image.value = ''; evidenceError.value = ''; dialog.value = true
  const current = ++evidenceRevision; evidenceLoading.value = row.hasImage
  if (!row.hasImage) return
  try { const r = await getManualTaskEvidence(row.id); if (r.code !== 0 || !r.data) throw new Error(); if (current === evidenceRevision) image.value = `data:image/png;base64,${r.data.imageBase64}` }
  catch { if (current === evidenceRevision) evidenceError.value = '截图读取失败，请关闭后重新查看。' }
  finally { if (current === evidenceRevision) evidenceLoading.value = false }
}
async function review(approve: boolean) {
  const row = selected.value
  if (!row || busy.value) return
  if (!approve && !reason.value.trim()) { ElMessage.warning('请填写驳回原因'); return }
  busy.value = true
  try {
    try { await ElMessageBox.confirm(approve ? `审核通过后将给账号 ${row.userId} 发放 ${row.points} 积分。` : '确认驳回该申请？', '确认审核') } catch { return }
    const r = await reviewManualTask(row.id, approve, reason.value.trim())
    if (r.code !== 0 || !r.data) throw new Error()
    selected.value = r.data; dialog.value = false; ElMessage.success(approve ? '已通过，积分已到账' : '已驳回'); await load()
  } catch { dialog.value = false; await load(); error.value = '未能确认审核结果，请刷新并核对该申请状态后再操作。' }
  finally { busy.value = false }
}
onMounted(() => { void loadConfig(); void load() })
</script>
<style scoped>
p { line-height: 1.7; overflow-wrap: anywhere; } .filters { display: flex; gap: 12px; margin-bottom: 16px; }
.el-form-item :deep(.el-form-item__content) { gap: 12px; } .evidence { width: 100%; max-height: 420px; }
.note { white-space: pre-wrap; } .el-pagination { margin-top: 16px; }
</style>
