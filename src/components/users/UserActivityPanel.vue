<template>
  <el-card shadow="never" class="activity-panel">
    <div class="heading"><h3>各端用户日活</h3><span class="muted">北京时间 · 按用户账号去重</span></div>
    <el-form inline @submit.prevent="search">
      <el-form-item label="日期范围"><el-date-picker v-model="dates" type="daterange" value-format="YYYY-MM-DD" :clearable="false" :disabled-date="disabledDate" start-placeholder="开始日期" end-placeholder="结束日期" /></el-form-item>
      <el-form-item label="使用端"><el-select v-model="platform" clearable placeholder="全部端" style="width: 180px" aria-label="日活使用端">
        <el-option v-for="item in options" :key="item.key" :label="label(item.key) + (item.internal ? '（内部端）' : '')" :value="item.key" />
      </el-select></el-form-item>
      <el-form-item><el-button type="primary" native-type="submit" :loading="loading">查询</el-button><el-button :disabled="loading" @click="reset">最近 30 天</el-button></el-form-item>
    </el-form>
    <p v-if="rangeError" class="error" role="alert">{{ rangeError }}</p>
    <el-alert v-if="error" :title="error" type="error" :closable="false" show-icon />
    <p class="muted">当天已登录用户打开页面、回到前台或进行交互即计入；不含匿名访客、后台自动刷新和心跳，排除已删除账号。各端分别去重，跨端总人数再次去重，因此各端人数之和可能大于总人数。</p>
    <p class="muted">仅覆盖已接入新版客户端且成功上报的活动。各端从首次成功上报起展示，首日为部分数据；此前显示“未采集”，不补算为 0。全平台总数仅汇总已有采集数据的端，不能代表尚未接入的端。</p>
    <div v-loading="loading">
      <template v-if="report">
        <div class="heading"><strong>今日 · {{ report.platform ? label(report.platform) : '全平台' }}去重日活：{{ format(report.todayTotal) }}</strong><span class="muted">更新于 {{ formatTime(report.generatedAt) }}</span></div>
        <div class="cards">
          <div v-for="item in externalPlatforms" :key="item.key" class="metric">
            <span>{{ label(item.key) }}</span><strong>{{ format(item.today) }}</strong><small>{{ coverage(item) }}</small>
          </div>
        </div>
        <p class="muted">内部端（各卡片始终展示今日人数，不受日期和端点筛选影响）</p>
        <div class="cards internal">
          <div v-for="item in internalPlatforms" :key="item.key" class="metric">
            <span>{{ label(item.key) }}</span><strong>{{ format(item.today) }}</strong><small>{{ coverage(item) }}</small>
          </div>
        </div>
        <div class="heading trend-heading"><h3>每日活跃趋势</h3><span class="muted">{{ report.from }} 至 {{ report.to }} · 最多 366 天，今天截至查询时刻</span></div>
        <UserActivityChart :rows="report.trend" :platforms="visiblePlatforms.map(item => item.key)" />
        <el-table :data="rows" row-key="date" max-height="400" empty-text="暂无活动数据">
          <el-table-column prop="date" label="日期" width="120" fixed />
          <el-table-column label="所选端去重日活" width="150" align="right"><template #default="{ row }">{{ format(row.total) }}</template></el-table-column>
          <el-table-column v-for="item in visiblePlatforms" :key="item.key" :label="label(item.key)" min-width="125" align="right">
            <template #default="{ row }">{{ format(row.platforms[item.key]) }}</template>
          </el-table-column>
        </el-table>
      </template>
      <el-empty v-else :description="loading ? '正在读取日活统计' : '暂无统计，请查询或重试'" />
    </div>
  </el-card>
</template>
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { getUserActivity, type ActivityPlatform, type UserActivityReport } from '@/api/userActivity'
import { registrationSourceLabels } from './userOverview.mjs'
import UserActivityChart from './UserActivityChart.vue'
const report = ref<UserActivityReport>()
const options = ref<ActivityPlatform[]>([])
const dates = ref<string[]>([])
const platform = ref(''), loading = ref(false), error = ref(''), rangeError = ref('')
const label = (key: string) => registrationSourceLabels[key] || key
const format = (value: number | null | undefined) => value == null ? '未采集' : value.toLocaleString('zh-CN')
const day = (value: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(value)
const formatTime = (value: string) => new Date(value).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false })
const coverage = (item: ActivityPlatform) => item.startedAt ? `首次上报 ${formatTime(item.startedAt)}` : '尚未收到活动上报'
const disabledDate = (value: Date) => `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}` > day(new Date())
const externalPlatforms = computed(() => report.value?.platforms.filter(item => !item.internal) || [])
const internalPlatforms = computed(() => report.value?.platforms.filter(item => item.internal) || [])
const visiblePlatforms = computed(() => report.value?.platforms.filter(item => !report.value?.platform || item.key === report.value.platform) || [])
const rows = computed(() => [...(report.value?.trend || [])].reverse())
let sequence = 0
async function search() {
  const [from, to] = dates.value || []
  rangeError.value = ''
  if (!from || !to || from > to || to > day(new Date()) || (Date.parse(to) - Date.parse(from)) / 86400000 >= 366) {
    rangeError.value = '请选择截至今天、最多 366 天的有效日期范围。'
    return
  }
  const request = ++sequence
  loading.value = true
  error.value = ''
  report.value = undefined
  try {
    const result = await getUserActivity({ from, to, platform: platform.value || undefined })
    if (request !== sequence) return
    if (result.code !== 0 || !result.data) throw new Error('Missing activity report')
    report.value = result.data
    options.value = result.data.platforms
  } catch {
    if (request === sequence) error.value = '无法读取日活统计，请重新查询。'
  } finally {
    if (request === sequence) loading.value = false
  }
}
function reset() {
  const now = new Date()
  dates.value = [day(new Date(now.getTime() - 29 * 86400000)), day(now)]
  platform.value = ''
  void search()
}
onMounted(reset)
onBeforeUnmount(() => { sequence++ })
</script>
<style scoped>
.activity-panel { min-width: 0; }
.heading { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 16px; }
h3 { margin: 0; font-size: 16px; }
.muted, small { color: var(--el-text-color-secondary); font-size: 12px; line-height: 1.7; }
.cards { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.internal { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.metric { padding: 16px; border: 1px solid var(--el-border-color-light); border-radius: 6px; display: flex; flex-direction: column; gap: 8px; }
.metric span { font-size: 13px; }
.metric strong { font-size: 24px; overflow-wrap: anywhere; }
.trend-heading { margin-top: 24px; }
.error { color: var(--el-color-danger); }
@media (max-width: 900px) { .cards { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 600px) {
  .activity-panel :deep(.el-form-item) { display: block; margin-right: 0; }
  .activity-panel :deep(.el-form-item__content) { min-width: 0; }
  .activity-panel :deep(.el-date-editor) { width: 100%; min-width: 0; }
}
</style>
