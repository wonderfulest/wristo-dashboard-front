<template>
  <main class="conversion-page" v-loading="loading">
    <header class="heading">
      <div><span class="eyebrow">WRISTO.IO → STUDIO</span><h1>Studio 转化</h1><p>从第一次访问，到做出自己的表盘。</p></div>
      <div class="filters">
        <el-date-picker v-model="range" type="daterange" value-format="YYYY-MM-DD" start-placeholder="首次访问开始日期" end-placeholder="结束日期" :clearable="false" />
        <el-button type="primary" :loading="loading" @click="refresh">查询</el-button>
      </div>
    </header>
    <el-alert v-if="error" :title="error" type="error" show-icon :closable="false" />
    <template v-if="report">
      <div class="metrics">
        <article><span>官网新访客</span><strong>{{ report.steps[0]?.visitors.toLocaleString() }}</strong><small>按浏览器去重</small></article>
        <article><span>首次保存转化率</span><strong>{{ percent(report.steps[4]?.overallRate) }}</strong><small>{{ report.steps[4]?.visitors }} 位访客完成保存</small></article>
        <article><span>成功打包转化率</span><strong>{{ percent(report.steps[6]?.overallRate) }}</strong><small>{{ report.steps[6]?.visitors }} 位访客获得 PRG / IQ</small></article>
        <article><span>7 天内再次创作率</span><strong>{{ percent(report.returnRate) }}</strong><small>{{ report.returned }} / {{ report.retentionEligible }} 位观察完成；{{ report.pendingRetention }} 位待满 7 天</small></article>
      </div>
      <section class="panel">
        <div class="section-title"><h2>创作转化漏斗</h2><span>首次访问后的 {{ report.conversionWindowDays }} 天 · 同一批访客</span></div>
        <el-empty v-if="!report.steps[0]?.visitors" description="所选日期暂无官网新访客；上线采集后开始积累，不回填历史转化。" />
        <el-table v-else :data="report.steps" stripe>
          <el-table-column label="阶段" min-width="180"><template #default="{ row, $index }"><b class="step-number">{{ $index + 1 }}</b>{{ labels[row.key] || row.key }}</template></el-table-column>
          <el-table-column label="访客数" min-width="200"><template #default="{ row }"><div class="bar-cell"><div class="bar" :style="{ width: `${row.overallRate || 0}%` }"></div><b>{{ row.visitors.toLocaleString() }}</b></div></template></el-table-column>
          <el-table-column label="上一步转化率" width="150"><template #default="{ row }">{{ percent(row.previousRate) }}</template></el-table-column>
          <el-table-column label="总体转化率" width="140"><template #default="{ row }">{{ percent(row.overallRate) }}</template></el-table-column>
          <el-table-column prop="lost" label="较上一步流失" width="140" />
        </el-table>
      </section>
      <section class="panel">
        <div class="section-title"><h2>转化明细</h2><el-radio-group v-model="group"><el-radio-button value="sources">访问来源</el-radio-button><el-radio-button value="daily">首次访问日期</el-radio-button><el-radio-button value="devices">设备类型</el-radio-button></el-radio-group></div>
        <el-table :data="report[group]" stripe empty-text="暂无数据">
          <el-table-column prop="key" :label="group === 'daily' ? '日期' : group === 'devices' ? '设备' : '来源 / utm_source'" min-width="190" />
          <el-table-column prop="visitors" label="官网新访客" sortable />
          <el-table-column prop="entered" label="进入 Studio" sortable />
          <el-table-column prop="saved" label="完成保存" sortable />
          <el-table-column prop="apps" label="创建应用" sortable />
          <el-table-column prop="built" label="打包成功" sortable />
          <el-table-column label="保存转化率"><template #default="{ row }">{{ percent(row.visitors ? row.saved / row.visitors * 100 : null) }}</template></el-table-column>
        </el-table>
      </section>
      <section class="definitions"><h2>统计口径</h2>
        <p>按北京时间选择官网首次访问日期，观察随后 7 天内依次完成的阶段。最近 7 天的访客仍在转化，数据会继续增长。来源采用首次访问的 utm_source，否则使用来源域名或 direct。</p>
        <p>使用第一方浏览器标识串联官网和 Studio；同一账号跨浏览器不合并。管理员的已登录操作不计入，匿名访问无法判断身份。浏览器禁止追踪、清理 Cookie、网络失败会影响覆盖率。</p>
        <p>“开始设计”表示成功进入编辑器；“首次保存”取服务端保存成功记录；首次保存通常自动创建应用，两个阶段可能相同。“打包成功”取该应用真实完成记录；“发起下载”仅表示触发下载，不代表文件已保存或已安装到手表。</p>
        <p>再次创作率：首次保存后 24 小时至 7 天内，再次进入编辑器或保存的访客比例。仅将首次保存已满 7 天的访客纳入分母。采集开始：{{ report.trackingStartedAt ? `${report.trackingStartedAt} UTC` : '尚无数据' }}。</p>
      </section>
    </template>
  </main>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getStudioConversion, type StudioConversionReport } from '@/api/studio-conversion'
const beijingDate = (offset: number) => new Date(Date.now() + 8 * 3600000 + offset * 86400000).toISOString().slice(0, 10)
const range = ref<[string, string]>([beijingDate(-29), beijingDate(0)])
const report = ref<StudioConversionReport | null>(null)
const loading = ref(false)
const error = ref('')
const group = ref<'sources' | 'daily' | 'devices'>('sources')
const labels: Record<string, string> = { website_visit: '访问 wristo.io', studio_click: '点击 Studio 入口', studio_enter: '进入 Studio（含登录前）', design_start: '开始设计', design_save: '首次保存设计', app_create: '创建应用', build_complete: '打包成功', download_start: '发起下载' }
const percent = (value?: number | null) => value == null ? '—' : `${value.toFixed(1)}%`
async function refresh() {
  const [start, end] = range.value || []
  const days = (Date.parse(end) - Date.parse(start)) / 86400000
  if (!start || !end || days < 0 || days > 179) { ElMessage.warning('请选择 1–180 天的日期范围'); return }
  loading.value = true; error.value = ''; report.value = null
  try {
    const data = (await getStudioConversion(start, end)).data
    if (!data) throw new Error('Missing conversion report')
    report.value = data
  }
  catch { error.value = '转化数据加载失败，请重试。' }
  finally { loading.value = false }
}
onMounted(refresh)
</script>
<style scoped>
.conversion-page { padding: 28px; color: #182b29; }
.heading,.section-title { display:flex; justify-content:space-between; align-items:center; gap:20px; flex-wrap:wrap; }
.eyebrow { font-size:11px; letter-spacing:2px; color:#448477; font-weight:700; }
h1 { font-size:28px; margin:8px 0; } h2 { font-size:17px; margin:0; }
.heading p,.section-title>span { color:#73817f; font-size:13px; }
.filters { display:flex; gap:12px; flex-wrap:wrap; }
.metrics { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:16px; margin:24px 0; }
.metrics article { padding:22px; background:#f1f7f5; border:1px solid #dceae5; border-radius:12px; display:flex; flex-direction:column; gap:12px; }
.metrics span { font-size:13px; color:#4b6760; }.metrics strong { font-size:32px; font-variant-numeric:tabular-nums; }.metrics small { color:#698079; line-height:1.6; }
.panel { background:var(--el-bg-color); border:1px solid var(--el-border-color-light); border-radius:12px; padding:22px; margin-bottom:20px; }
.section-title { margin-bottom:20px; }.step-number { display:inline-grid; place-items:center; width:24px; height:24px; border-radius:50%; background:#eef5f2; color:#377765; margin-right:10px; font-size:11px; }
.bar-cell { position:relative; height:32px; display:flex; align-items:center; padding-left:10px; }.bar { position:absolute; inset:0 auto 0 0; background:#cbe7dd; border-radius:4px; }.bar-cell b { z-index:1; font-variant-numeric:tabular-nums; }
.definitions { color:#75847f; font-size:12px; line-height:1.9; }.definitions h2 { font-size:13px; }
@media(max-width:1100px) { .metrics { grid-template-columns:repeat(2,minmax(0,1fr)); } }
@media(max-width:600px) { .conversion-page { padding:12px; }.metrics { grid-template-columns:1fr; }.panel { padding:12px; } }
</style>
