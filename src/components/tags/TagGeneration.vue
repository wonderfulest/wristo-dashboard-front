<template>
  <el-alert title="仅手动提交百炼批量任务：下载量 ≥ 下载阈值 或 购买量 ≥ 购买阈值，且没有 AI 标签生成记录的应用才可入选。失败记录也不会再次生成。" type="info" :closable="false" />
  <div class="toolbar">
    <label>下载阈值 <el-input-number v-model="minDownloads" :min="1" :max="2147483647" :precision="0" :disabled="busy" placeholder="必填" /></label>
    <label>购买阈值 <el-input-number v-model="minPurchases" :min="1" :max="2147483647" :precision="0" :disabled="busy" placeholder="必填" /></label>
    <el-button :disabled="busy || !valid" :loading="loading" @click="query(1)">查询 / 刷新候选</el-button>
    <el-button type="primary" :disabled="busy || !selected.length || !matchesQuery" :loading="quoting" @click="prepare">批量补齐标签（{{ selected.length }}）</el-button>
  </div>
  <el-table ref="table" :data="rows" row-key="appId" @selection-change="selected = $event">
    <el-table-column type="selection" :selectable="selectable" width="50" />
    <el-table-column label="原图" width="80"><template #default="{row}"><img :src="row.rawImageUrl" width="48" height="48" style="object-fit: contain" /></template></el-table-column>
    <el-table-column prop="name" label="应用" />
    <el-table-column prop="appId" label="App ID" />
    <el-table-column prop="download" label="下载量" width="100" />
    <el-table-column prop="purchase" label="购买量" width="100" />
    <el-table-column label="本次状态" width="170"><template #default="{row}">{{ states[row.appId] || '待选择' }}</template></el-table-column>
  </el-table>
  <div class="toolbar">
    <span>共 {{ total }} 个，第 {{ page }} / {{ Math.max(1, pages) }} 页，每页最多 50 个</span>
    <el-button :disabled="busy || page <= 1 || !matchesQuery" @click="query(page - 1)">上一页</el-button>
    <el-button :disabled="busy || page >= pages || !matchesQuery" @click="query(page + 1)">下一页</el-button>
  </div>
  <p v-if="message" role="status">{{ message }}</p>
  <div class="toolbar"><strong>最近批量任务</strong><el-button :loading="jobsLoading" @click="loadJobs">刷新任务列表</el-button></div>
  <p>平台运营费用由平台承担，不扣用户或管理员积分。提交后异步处理；点击“检查结果”获取百炼进度并写入已完成标签，不会发起新的生成。</p>
  <el-table :data="jobs" row-key="id" empty-text="暂无批量任务">
    <el-table-column type="expand"><template #default="{ row }"><div class="job-items"><p>任务 ID：{{ row.id }} · 百炼任务 ID：{{ row.providerBatchId || '尚未返回' }}</p><p v-for="item in row.items" :key="item.appId">{{ item.appId }}：{{ batchStatus(item.status) }}</p></div></template></el-table-column>
    <el-table-column prop="createdAt" label="提交时间" min-width="180" />
    <el-table-column prop="model" label="模型" min-width="150" />
    <el-table-column label="状态" min-width="130"><template #default="{ row }">{{ batchStatus(row.status) }}</template></el-table-column>
    <el-table-column label="结果" min-width="230"><template #default="{ row }">共 {{ row.total }} · 成功 {{ row.completed }} · 失败 {{ row.failed }} · 跳过 {{ row.skipped }}</template></el-table-column>
    <el-table-column label="操作" width="130"><template #default="{ row }"><el-button :loading="refreshing === row.id" :disabled="!!refreshing" @click="checkJob(row.id)">检查结果</el-button></template></el-table-column>
  </el-table>
  <el-dialog v-model="confirmVisible" title="确认提交百炼批量任务" width="520px" :close-on-click-modal="false">
    <template v-if="snapshot">
      <p>所选应用：{{ snapshot.apps.length }} 个</p>
      <p>下载量 ≥ {{ snapshot.thresholds.minDownloads }} 或购买量 ≥ {{ snapshot.thresholds.minPurchases }}</p>
      <p>服务商：百炼（BAILIAN） · 模型：{{ snapshot.quote.model }}</p>
      <p>属于平台运营，由平台承担百炼费用，不扣用户或管理员积分。</p>
      <p>每个应用仅使用 raw image，生成 3–8 个唯一基础标签。一次提交异步批量任务，提交后关闭页面不会取消；稍后检查任务结果。失败或结果未知不会自动重试。</p>
    </template>
    <template #footer><el-button @click="confirmVisible = false">取消</el-button><el-button type="primary" @click="confirm">确认提交批量任务</el-button></template>
  </el-dialog>
</template>
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getCandidates, getQuote, submitBatch, getBatches, refreshBatch, type BatchJob, type BatchRequest, type Candidate, type Quote, type Thresholds } from '@/api/tagGeneration'
import { validThresholds, createBatchRequest, batchStatus, batchFeedback } from './generationBatch.mjs'
const minDownloads = ref<number>(), minPurchases = ref<number>()
const rows = ref<Candidate[]>([]), selected = ref<Candidate[]>([])
const page = ref(1), pages = ref(0), total = ref(0)
const loading = ref(false), quoting = ref(false), running = ref(false), confirmVisible = ref(false)
const states = ref<Record<string, string>>({}), message = ref('')
const table = ref<{ clearSelection: () => void }>()
const queried = ref<Thresholds>()
const snapshot = ref<{ apps: Candidate[]; thresholds: Thresholds; quote: Quote; request: BatchRequest }>()
const jobs = ref<BatchJob[]>([]), jobsLoading = ref(false), refreshing = ref<string>()
const valid = computed(() => validThresholds({ minDownloads: minDownloads.value, minPurchases: minPurchases.value }))
const busy = computed(() => loading.value || quoting.value || running.value || confirmVisible.value)
const matchesQuery = computed(() => queried.value?.minDownloads === minDownloads.value && queried.value?.minPurchases === minPurchases.value)
const selectable = (row: Candidate) => !busy.value && !states.value[row.appId]
async function query(nextPage: number) {
  if (busy.value || !valid.value) return
  loading.value = true
  selected.value = []; table.value?.clearSelection()
  const thresholds = { minDownloads: minDownloads.value!, minPurchases: minPurchases.value! }
  try {
    const response = await getCandidates({ ...thresholds, pageNum: nextPage, pageSize: 50 })
    if (!response.data) throw new Error('Missing candidates')
    rows.value = response.data.list; total.value = response.data.total; pages.value = response.data.pages
    page.value = nextPage; queried.value = thresholds; states.value = {}; message.value = ''
  } catch { rows.value = []; queried.value = undefined; ElMessage.error('候选查询失败') }
  finally { loading.value = false }
}
async function prepare() {
  if (busy.value || !matchesQuery.value || !selected.value.length || !queried.value) return
  const apps = selected.value.filter(app => !states.value[app.appId]).map(app => ({ ...app }))
  if (!apps.length) return
  const thresholds = { ...queried.value }
  quoting.value = true
  try {
    const response = await getQuote()
    const quote = response.data
    if (!quote) throw new Error('Missing model')
    const request = createBatchRequest(apps, thresholds, quote, crypto.randomUUID())
    snapshot.value = { apps, thresholds, quote: { ...quote }, request }; confirmVisible.value = true
  } catch { ElMessage.error('无法获取百炼模型，未发起生成') }
  finally { quoting.value = false }
}
async function confirm() {
  if (!confirmVisible.value || !snapshot.value || running.value) return
  const batch = snapshot.value
  confirmVisible.value = false; running.value = true
  selected.value = []; table.value?.clearSelection()
  batch.apps.forEach(app => { states.value[app.appId] = '已提交请求，请勿重试' })
  try {
    const response = await submitBatch(batch.request)
    if (!response.data?.id) throw new Error('Missing batch')
    jobs.value = [response.data, ...jobs.value.filter(job => job.id !== response.data!.id)].slice(0, 20)
    message.value = batchFeedback(response.data)
  } catch {
    message.value = `提交失败或结果未知（请求 ID：${batch.request.requestId}）。请先刷新任务列表核实，不要重复提交；不会自动重试。`
  } finally { running.value = false; snapshot.value = undefined }
}
async function loadJobs() {
  if (jobsLoading.value) return
  jobsLoading.value = true
  try {
    const response = await getBatches()
    if (!Array.isArray(response.data)) throw new Error('Missing jobs')
    jobs.value = response.data
  } catch { ElMessage.error('任务列表加载失败，请手动刷新') }
  finally { jobsLoading.value = false }
}
async function checkJob(id: string) {
  if (refreshing.value) return
  refreshing.value = id
  try {
    const response = await refreshBatch(id)
    if (!response.data?.id) throw new Error('Missing batch')
    jobs.value = jobs.value.map(job => job.id === id ? response.data! : job)
    message.value = batchFeedback(response.data)
  } catch { ElMessage.error('检查结果失败，可稍后再次检查；不会重新生成') }
  finally { refreshing.value = undefined }
}
onMounted(loadJobs)
</script>
<style scoped>
.toolbar { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; margin: 16px 0; }
.job-items { padding: 0 24px; overflow-wrap: anywhere; }
</style>
