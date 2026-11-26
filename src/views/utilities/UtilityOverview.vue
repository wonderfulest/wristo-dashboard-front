<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import DashboardFilterBar from '@/components/dashboard/DashboardFilterBar.vue'
import TableActionColumn from '@/components/common/TableActionColumn.vue'
import { getUtilityOverview, type UtilityOverview } from '@/api/utilities'
import { recentRange } from '../games/gameAnalytics.mjs'
import UtilityTrend from './UtilityTrend.vue'
const range = ref<[string, string]>(recentRange())
const data = ref<UtilityOverview | null>(null)
const loading = ref(false), error = ref(''), query = ref('')
let requestId = 0
const rows = computed(() => data.value?.tools.filter(row =>
  `${row.appKey} ${row.name} ${row.nameZh}`.toLowerCase().includes(query.value.trim().toLowerCase())) ?? [])
const cards = computed(() => data.value ? [
  { label: '区间新增安装', value: data.value.summary.newInstallations },
  { label: '当前累计安装', value: data.value.summary.installationCount },
  { label: '当前已绑定安装', value: data.value.summary.boundInstallationCount },
  { label: '当前绑定用户（跨工具去重）', value: data.value.summary.boundUserCount },
] : [])
function storeUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : undefined
  } catch { return undefined }
}
async function load() {
  const id = ++requestId
  error.value = ''; data.value = null
  const [from, to] = range.value ?? []
  const days = (Date.parse(to) - Date.parse(from)) / 86400000 + 1
  if (!Number.isFinite(days) || days < 1 || days > 366) {
    error.value = '请选择 1 至 366 天的日期范围。'; loading.value = false; return
  }
  loading.value = true
  try {
    const result = await getUtilityOverview(from, to)
    if (!result.data) throw new Error('Missing overview')
    if (id === requestId) data.value = result.data
  } catch {
    if (id === requestId) error.value = '工具运营数据加载失败，请重试。'
  } finally { if (id === requestId) loading.value = false }
}
function quick(days: number) { range.value = recentRange(days); load() }
onMounted(load)
</script>
<template>
  <section class="utilities-page">
    <DashboardFilterBar eyebrow="UTILITY OPERATIONS" title="实用工具运营总览" description="查看工具安装趋势、账号绑定情况与各工具运营数据" />
    <div class="filters">
      <el-button-group><el-button v-for="days in [7, 30, 90]" :key="days" @click="quick(days)">近 {{ days }} 天</el-button></el-button-group>
      <el-date-picker v-model="range" type="daterange" value-format="YYYY-MM-DD" :clearable="false" start-placeholder="开始日期" end-placeholder="结束日期" @change="load" />
      <el-button type="primary" :loading="loading" @click="load">刷新数据</el-button>
      <router-link to="/utilities/manage">工具管理</router-link>
    </div>
    <p class="muted">北京时间（Asia/Shanghai）· 最多 366 天。日期筛选仅影响新增安装及趋势；累计安装和绑定数为当前状态。</p>
    <el-alert type="info" :closable="false" show-icon title="安装记录指首次连接服务的应用安装，不代表商店下载量。总绑定用户跨工具去重，各工具用户数不可直接相加。当前暂不统计日活和使用次数。" />
    <el-alert v-if="error" type="error" :title="error" :closable="false" />
    <div v-if="loading" class="placeholder">正在加载工具运营数据…</div>
    <template v-if="data">
      <div class="metrics"><el-card v-for="card in cards" :key="card.label" shadow="never"><div class="muted">{{ card.label }}</div><strong>{{ card.value.toLocaleString('zh-CN') }}</strong></el-card></div>
      <el-card shadow="never"><template #header><h2>每日新增安装趋势</h2></template><UtilityTrend :items="data.daily" /></el-card>
      <el-card shadow="never">
        <template #header><div class="filters"><h2>各工具运营数据</h2><el-input v-model="query" placeholder="搜索工具名称或标识" clearable style="max-width:280px" aria-label="搜索工具" /></div></template>
        <el-table :data="rows" stripe empty-text="没有符合条件的工具">
          <TableActionColumn><template #default="{ row }"><el-link v-if="storeUrl(row.downloadUrl)" :href="storeUrl(row.downloadUrl)" target="_blank" rel="noopener noreferrer" type="primary">跳转到商店 ↗</el-link><span v-else class="muted">未配置商店链接</span></template></TableActionColumn>
          <el-table-column label="工具" min-width="240">
            <template #default="{ row }"><div class="identity"><el-image v-if="row.logoUrl" :src="row.logoUrl" :alt="row.nameZh || row.name" class="logo" fit="contain"><template #error><span class="muted">无图片</span></template></el-image><span v-else class="logo muted">未设置</span><div>{{ row.nameZh || row.name }}<div class="muted">{{ row.appKey }}</div></div></div></template>
          </el-table-column>
          <el-table-column label="应用服务" width="100"><template #default="{ row }"><el-tag :type="row.enabled ? 'success' : 'info'">{{ row.enabled ? '已启用' : '已停用' }}</el-tag></template></el-table-column>
          <el-table-column label="网站展示" width="100"><template #default="{ row }"><el-tag :type="row.websiteVisible ? 'success' : 'info'">{{ row.websiteVisible ? '显示' : '隐藏' }}</el-tag></template></el-table-column>
          <el-table-column prop="metrics.newInstallations" label="区间新增安装" min-width="140" sortable />
          <el-table-column prop="metrics.installationCount" label="当前累计安装" min-width="140" sortable />
          <el-table-column prop="metrics.boundInstallationCount" label="当前已绑定安装" min-width="155" sortable />
          <el-table-column prop="metrics.boundUserCount" label="当前绑定用户" min-width="140" sortable />
        </el-table>
      </el-card>
    </template>
  </section>
</template>
<style scoped>
.utilities-page{padding:24px;display:flex;flex-direction:column;gap:18px}.filters{display:flex;flex-wrap:wrap;gap:12px;align-items:center}.muted{color:#738078;font-size:12px;margin:0;line-height:1.7}.metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}.metrics strong{display:block;font-size:28px;margin-top:10px}h2{font-size:16px;margin:0;margin-right:auto}a{color:#168456;text-decoration:none}.placeholder{padding:50px;text-align:center;color:#738078}.identity{display:flex;align-items:center;gap:12px}.logo{width:44px;height:44px;flex-shrink:0;border-radius:8px;background:#f1f5f9;display:flex;align-items:center;justify-content:center}@media(max-width:900px){.metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:680px){.utilities-page{padding:14px}.filters :deep(.el-date-editor){max-width:100%;width:100%}}
</style>
