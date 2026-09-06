<template>
  <div class="activation-page">
    <DashboardFilterBar eyebrow="ACTIVATION ANALYTICS" title="激活分析" description="查看六位码激活趋势、权益来源与用户激活排行" />
    <section class="filters">
      <div class="heading">
        <el-radio-group v-model="quickDays" size="small" @change="applyQuickRange"><el-radio-button :label="7">近 7 天</el-radio-button><el-radio-button :label="30">近 30 天</el-radio-button><el-radio-button :label="90">近 90 天</el-radio-button></el-radio-group>
        <el-date-picker v-model="dateRange" type="daterange" value-format="YYYY-MM-DD" :clearable="false" start-placeholder="开始日期（UTC）" end-placeholder="结束日期（UTC）" @change="applyDates" />
        <AppSearchSelect v-model="filter.appId" width="240px" />
        <el-button type="primary" :loading="loading" @click="fetchData">刷新数据</el-button>
      </div>
      <span class="muted">按 UTC 自然日统计，最多 366 天</span>
    </section>
    <el-alert v-if="error" :title="error" type="error" :closable="false" show-icon />
    <div v-if="loading && !data" class="placeholder">正在加载激活统计…</div>
    <template v-if="data">
      <el-alert type="info" :closable="false" show-icon>
        <template #title>采集起点：{{ data.trackingStartedAt?.replace('T', ' ') || '尚未开始' }} UTC</template>
        历史记录 {{ data.historicalCount.toLocaleString() }} 条的激活日期和来源未知，仅计入全部历史排行和分布。
        采集首日为不完整日，之前的日期显示为未采集。每条试用记录首次成功激活计一次，排除测试记录；退款不撤销已发生的激活。
      </el-alert>
      <div class="summary-grid" v-loading="loading">
        <el-card shadow="never"><span class="muted">区间全部激活</span><strong>{{ summary.totalCount.toLocaleString() }}</strong></el-card>
        <el-card shadow="never"><span class="muted">六位码激活次数</span><strong>{{ summary.codeCount.toLocaleString() }}</strong></el-card>
        <el-card shadow="never"><span class="muted">直接购买激活</span><strong>{{ summary.directPurchaseCount.toLocaleString() }}</strong><span>{{ percent(summary.directPurchaseCount, summary.totalCount) }}%</span></el-card>
        <el-card shadow="never"><span class="muted">已有套餐权益激活</span><strong>{{ summary.existingBundleCount.toLocaleString() }}</strong><span>{{ percent(summary.existingBundleCount, summary.totalCount) }}%</span></el-card>
      </div>
      <el-card shadow="never" v-loading="loading">
        <template #header><h2>六位码激活趋势 <small>{{ data.startDate }} 至 {{ data.endDate }}</small></h2></template>
        <p class="muted">次数按首次成功激活的试用记录统计；去重应用数按每日不同 appId 统计，同一应用可被多个用户或设备激活。</p>
        <ActivationChart :items="data.daily" :tracking-started-at="data.trackingStartedAt" mode="trend" />
      </el-card>
      <el-card shadow="never" v-loading="loading">
        <template #header>
          <div class="heading"><h2>每日激活来源</h2><el-radio-group v-model="sourceMode" size="small"><el-radio-button label="count">数量</el-radio-button><el-radio-button label="percent">占比</el-radio-button></el-radio-group></div>
        </template>
        <p class="muted">占比的分母为当天全部成功激活次数。直接购买包含购买套餐时的首次激活；已有套餐权益指无需再次购买的套餐复用。</p>
        <ActivationChart :items="data.daily" :tracking-started-at="data.trackingStartedAt" :mode="sourceMode" />
        <div class="source-summary"><span v-for="source in activationSources" :key="source.key"><i :style="{ background: source.color }" />{{ source.label }}：{{ summary[source.key] }}（{{ percent(summary[source.key], summary.totalCount) }}%）</span></div>
        <el-table :data="data.daily" max-height="360" empty-text="暂无激活数据" stripe>
          <el-table-column prop="date" label="日期（UTC）" width="140" fixed />
          <el-table-column label="全部激活" width="110"><template #default="{ row }">{{ isObserved(row.date) ? row.totalCount : '未采集' }}</template></el-table-column>
          <el-table-column v-for="source in activationSources" :key="source.key" :label="source.label + ' / 占比'" min-width="160"><template #default="{ row }">{{ isObserved(row.date) ? `${row[source.key]} / ${percent(row[source.key], row.totalCount)}%` : '未采集' }}</template></el-table-column>
        </el-table>
      </el-card>
      <section class="heading ranking-controls">
        <h2>用户邮箱排行与分布</h2>
        <div class="heading">
          <el-radio-group v-model="rankingScope" :disabled="loading" size="small"><el-radio-button label="all">全部历史</el-radio-button><el-radio-button label="period">所选时间段</el-radio-button></el-radio-group>

        </div>
      </section>
      <div class="heading"><el-select v-model="limit" aria-label="每页条数" style="width: 140px"><el-option v-for="n in [20,50,100]" :key="n" :value="n" :label="`每页 ${n} 人`" /></el-select></div>
      <p class="muted">邮箱忽略首尾空格和大小写，缺失邮箱不参与排行。设备按标准型号去重，未知型号不计入型号数量；无法匹配设备库的型号暂按原始标识去重。</p>
      <el-card shadow="never">
        <template #header><div class="heading"><h2>用户激活分布</h2><el-radio-group v-model="distributionMetric" size="small"><el-radio-button label="apps">不同应用数</el-radio-button><el-radio-button label="activations">激活次数</el-radio-button></el-radio-group></div></template>
        <p class="muted">共 {{ data.activationUserCount.toLocaleString() }} 位有成功激活记录的用户，按邮箱去重，排除测试及空邮箱。{{ distributionMetric === 'apps' ? '同一用户重复激活同一个应用只计一个。' : '每条试用记录首次成功激活计一次。' }}统计全部符合当前应用及时间范围筛选的用户，与排行榜页码无关。</p>
        <el-table :data="distributionRows" empty-text="暂无符合条件的激活用户">
          <el-table-column label="用户比例" min-width="130"><template #default="{ row }">至少 {{ row.targetPercent }}% 的用户</template></el-table-column>
          <el-table-column :label="distributionMetric === 'apps' ? '激活的不同应用数' : '激活次数'" min-width="140"><template #default="{ row }">≥ {{ row.threshold }} {{ distributionMetric === 'apps' ? '个' : '次' }}</template></el-table-column>
          <el-table-column label="实际达到人数" min-width="120"><template #default="{ row }">{{ row.userCount.toLocaleString() }} 人</template></el-table-column>
          <el-table-column label="实际占比" min-width="180"><template #default="{ row }"><el-progress :percentage="Number(row.actualPercent.toFixed(2))" color="#168456" /></template></el-table-column>
        </el-table>
        <p class="muted">门槛按人数向上取整；激活数量相同的用户一并计入，因此实际占比可能高于目标比例。此处使用“至少”，不是“严格超过”。无成功激活记录的注册用户不在分母中。</p>
      </el-card>
      <div class="ranking-grid" v-loading="loading">
        <el-card v-for="ranking in rankings" :key="ranking.title" shadow="never">
          <template #header><h2>{{ ranking.title }}</h2></template>
          <el-table :data="ranking.rows" empty-text="暂无成功激活记录" max-height="550">
            <el-table-column type="index" :index="(index: number) => (ranking.page - 1) * limit + index + 1" label="#" width="65" />
            <el-table-column prop="email" label="用户邮箱" min-width="200" show-overflow-tooltip><template #default="{ row }"><router-link :to="activationDetailRoute(row.email)" style="color: #168456">{{ row.email }}</router-link></template></el-table-column>
            <el-table-column :prop="ranking.primary" :label="ranking.label" width="110" />
            <el-table-column :prop="ranking.secondary" :label="ranking.secondaryLabel" width="105" />
            <el-table-column v-if="rankingScope === 'all'" prop="historicalCount" label="含历史记录" width="105" />
          </el-table>
          <div class="ranking-pagination">
            <span class="muted">共 {{ ranking.total.toLocaleString() }} 人</span>
            <el-pagination :current-page="ranking.page" :page-size="limit" :total="ranking.total" :pager-count="5" layout="prev, pager, next" @current-change="(value: number) => changeRankingPage(ranking.key, value)" />
          </div>
        </el-card>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import DashboardFilterBar from '@/components/dashboard/DashboardFilterBar.vue'
import AppSearchSelect from '@/components/common/AppSearchSelect.vue'
import ActivationChart from '@/components/dashboard/ActivationChart.vue'
import { activationSources, activationSummary, activationPercent as percent } from '@/components/dashboard/activationCharts.mjs'
import type { DashboardFilter } from '@/components/dashboard/dashboardTypes'
import { getActivationAnalytics, type ActivationAnalytics } from '@/api/activationAnalytics'
import { activationDetailRoute } from '@/components/dashboard/activationDetail.mjs'

const today = new Date()
const start = new Date(today)
start.setUTCDate(start.getUTCDate() - 29)
const filter = ref<DashboardFilter>({ rangeType: '30d', startDate: start.toISOString().slice(0, 10), endDate: today.toISOString().slice(0, 10), appId: null })
const quickDays = ref<number | null>(30)
const dateRange = ref<[string, string]>([filter.value.startDate, filter.value.endDate])
function applyDates() {
  if (!dateRange.value?.[0] || !dateRange.value?.[1]) return
  quickDays.value = null
  filter.value = { ...filter.value, startDate: dateRange.value[0], endDate: dateRange.value[1] }
}
function applyQuickRange() {
  const end = new Date()
  const begin = new Date(end)
  begin.setUTCDate(begin.getUTCDate() - (quickDays.value || 30) + 1)
  dateRange.value = [begin.toISOString().slice(0, 10), end.toISOString().slice(0, 10)]
  filter.value = { ...filter.value, startDate: dateRange.value[0], endDate: dateRange.value[1] }
}
const limit = ref(20)
const activationPage = ref(1)
const devicePage = ref(1)
const distributionMetric = ref<'apps' | 'activations'>('apps')
const distributionRows = computed(() => (distributionMetric.value === 'apps' ? data.value?.appDistribution : data.value?.activationDistribution) || [])
function changeRankingPage(key: string, value: number) {
  if (key === 'activation') activationPage.value = value
  else devicePage.value = value
  fetchData()
}
const rankingScope = ref<'all' | 'period'>('all')
const sourceMode = ref<'count' | 'percent'>('count')
const loading = ref(false)
const error = ref('')
const data = ref<ActivationAnalytics | null>(null)
const summary = computed(() => activationSummary(data.value?.daily || []))
const rankings = computed(() => [
  { key: 'activation', page: activationPage.value, total: data.value?.activationUserCount || 0, title: '激活次数最多的用户', rows: data.value?.activationRanking || [], primary: 'activationCount', label: '激活次数', secondary: 'appCount', secondaryLabel: '不同应用数' },
  { key: 'device', page: devicePage.value, total: data.value?.deviceUserCount || 0, title: '激活设备型号最多的用户', rows: data.value?.deviceRanking || [], primary: 'deviceCount', label: '设备型号数', secondary: 'activationCount', secondaryLabel: '激活次数' },
])
const isObserved = (date: string) => !!data.value?.trackingStartedAt && date >= data.value.trackingStartedAt.slice(0, 10)
let requestId = 0
async function fetchData() {
  const current = ++requestId
  loading.value = true
  error.value = ''
  // Clear the prior result so a failed filter change cannot display stale data as current.
  data.value = null
  try {
    const response = await getActivationAnalytics({ startDate: filter.value.startDate, endDate: filter.value.endDate,
      ...(filter.value.appId ? { appId: filter.value.appId } : {}), activationPage: activationPage.value, devicePage: devicePage.value, limit: limit.value, rankingScope: rankingScope.value })
    if (current !== requestId) return
    if (response.code !== 0 || !response.data) throw new Error(response.msg || '获取激活统计失败')
    data.value = response.data
  } catch (cause) {
    if (current === requestId) error.value = cause instanceof Error ? cause.message
      : cause && typeof cause === 'object' && 'msg' in cause ? String(cause.msg)
      : '获取激活统计失败，请刷新重试'
  } finally {
    if (current === requestId) loading.value = false
  }
}
watch([filter, limit, rankingScope], () => {
  activationPage.value = 1
  devicePage.value = 1
  fetchData()
}, { deep: true })
onMounted(fetchData)
onBeforeUnmount(() => { requestId++ })
</script>

<style scoped>
.activation-page { padding: 16px; max-width: 1480px; margin: 0 auto; display: grid; gap: 16px; }
.filters { display: grid; gap: 8px; }
.muted, small { color: #708078; font-size: 12px; line-height: 1.7; }
.summary-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; }
strong { display: block; font-size: 30px; color: #173c2b; margin: 8px 0; }
h2 { margin: 0; font-size: 16px; color: #173c2b; }
small { margin-left: 12px; font-weight: 400; }
.heading { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
.ranking-pagination { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
.ranking-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.source-summary { display: flex; flex-wrap: wrap; gap: 12px 24px; font-size: 12px; margin: 16px 0; }
.source-summary i { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 6px; }
.placeholder { padding: 40px; text-align: center; color: #708078; }
@media(max-width: 1000px) { .ranking-grid { grid-template-columns: 1fr; } }
@media(max-width: 768px) { .activation-page { padding: 0; } .summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; } small { display: block; margin-left: 0; } .filters :deep(.el-date-editor) { width: 100%; max-width: 100%; flex: auto; } }
</style>
