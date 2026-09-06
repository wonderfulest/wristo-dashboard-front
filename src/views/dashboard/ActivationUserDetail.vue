<template>
  <div class="detail-page">
    <div class="page-heading">
      <div><p class="eyebrow">ACTIVATION HISTORY</p><h1>邮箱激活详情</h1><p class="muted">查看用户激活过的应用、设备与地点</p></div>
      <router-link to="/dashboard/activations" class="back-link">返回激活分析</router-link>
    </div>
    <el-card shadow="never">
      <form class="search-form" @submit.prevent="searchEmail">
        <el-input v-model="emailInput" aria-label="用户邮箱" placeholder="输入用户邮箱" clearable />
        <el-button native-type="submit" type="primary" :loading="loading">查看激活详情</el-button>
      </form>
    </el-card>
    <el-alert v-if="error" :title="error" type="error" :closable="false" show-icon />
    <el-empty v-if="!activeEmail && !loading" description="输入邮箱，或从激活排行榜点击邮箱进入" />
    <div v-if="loading" class="loading-text">正在加载激活详情…</div>
    <template v-if="data">
      <section class="account-summary">
        <h2>{{ data.email }}</h2><span class="muted">累计概览 · 全部历史 · 排除测试记录</span>
        <div class="summary-grid">
          <div><span>激活次数</span><strong>{{ data.summary.activationCount.toLocaleString() }}</strong></div>
          <div><span>不同应用</span><strong>{{ data.summary.appCount.toLocaleString() }}</strong></div>
          <div><span>设备型号</span><strong>{{ data.summary.deviceCount.toLocaleString() }}</strong></div>
          <div><span>日期未知的历史记录</span><strong>{{ data.summary.historicalCount.toLocaleString() }}</strong></div>
        </div>
        <div class="known-dates"><span>首次已知激活：{{ activationTime(data.summary.firstActivatedAt) }}</span><span>最近已知激活：{{ activationTime(data.summary.lastActivatedAt) }}</span></div>
      </section>
      <el-alert v-if="data.summary.historicalCount" type="info" :closable="false" show-icon
        :title="`${data.summary.historicalCount} 条历史记录未保存激活时间，已单独列出；首次和最近时间仅涵盖有时间记录的激活。`" />
      <el-card shadow="never">
        <template #header><h2>激活设备 <small>按型号汇总全部历史，同型号多次激活不会被当作多台设备</small></h2></template>
        <el-table :data="data.devices" empty-text="暂无激活设备" max-height="360">
          <el-table-column label="设备型号" min-width="180"><template #default="{ row }"><strong>{{ row.deviceName || '未知型号' }}</strong><div v-if="row.deviceKey && row.deviceKey !== row.deviceName" class="muted">{{ row.deviceKey }}</div></template></el-table-column>
          <el-table-column prop="activationCount" label="激活次数" width="100" />
          <el-table-column prop="appCount" label="不同应用" width="100" />
          <el-table-column prop="historicalCount" label="日期未知" width="100" />
          <el-table-column label="首次已知激活" min-width="210"><template #default="{ row }">{{ activationTime(row.firstActivatedAt) }}</template></el-table-column>
          <el-table-column label="最近已知激活" min-width="210"><template #default="{ row }">{{ activationTime(row.lastActivatedAt) }}</template></el-table-column>
        </el-table>
      </el-card>
      <el-card shadow="never">
        <template #header><div class="timeline-heading"><h2>激活时间线</h2><el-radio-group v-model="historical" size="small" @change="resetPageAndFetch"><el-radio-button :label="false">有时间记录</el-radio-button><el-radio-button :label="true">历史记录 · 时间未知</el-radio-button></el-radio-group></div></template>
        <div class="timeline-filters">
          <el-date-picker v-if="!historical" v-model="dateRange" type="daterange" value-format="YYYY-MM-DD" start-placeholder="开始日期（UTC）" end-placeholder="结束日期（UTC）" @change="resetPageAndFetch" />
          <span class="muted">{{ historical ? '历史记录无法按日期排序或筛选' : '按激活时间倒序；日期筛选仅影响时间线' }} · 共 {{ data.total }} 条</span>
        </div>
        <el-empty v-if="data.items.length === 0" :description="historical ? '没有日期未知的历史记录' : '所选范围内暂无有时间记录的激活'" />
        <ol v-else class="timeline">
          <li v-for="item in data.items" :key="item.trialId">
            <div class="time-label">{{ activationTime(item.activatedAt) }}</div>
            <article class="event-card">
              <div class="event-heading">
                <div class="event-app">
                  <el-image v-if="activationAssetUrl(item.appImageUrl)" class="app-thumbnail"
                    :src="activationAssetUrl(item.appImageUrl)" :alt="item.appName || '应用图片'" fit="contain"
                    :preview-src-list="[activationAssetUrl(item.appImageUrl)]" preview-teleported>
                    <template #error><span class="image-placeholder">图片不可用</span></template>
                  </el-image>
                  <span v-else class="app-thumbnail image-placeholder">暂无图片</span>
                  <div class="app-meta">
                    <h3>{{ item.appName || (item.appId ? `应用 ${item.appId}` : '未知应用') }}</h3>
                    <a v-if="activationAssetUrl(item.appUrl)" :href="activationAssetUrl(item.appUrl)" target="_blank" rel="noopener noreferrer" class="app-link">查看应用 ↗</a>
                    <small v-else class="muted">暂无应用链接</small>
                  </div>
                </div>
                <el-tag size="small" effect="plain">{{ activationSourceLabel(item.source) }}</el-tag>
              </div>
              <p class="muted">App ID：{{ item.appId ?? '未知' }} · 激活记录 #{{ item.trialId }} · {{ item.channel === 'SIX_DIGIT' ? '六位码激活' : item.channel === 'OTHER' ? '其他入口' : '入口未知' }}</p>
              <dl class="event-facts">
                <div><dt>激活设备</dt><dd>{{ item.deviceName || '未知型号' }}<small v-if="item.partNumber">部件号：{{ item.partNumber }}</small></dd></div>
                <div><dt>地点</dt><dd>{{ activationLocation(item).place }}<small v-if="activationLocation(item).label">{{ activationLocation(item).label }}<br />采集于 {{ activationTime(item.locationCapturedAt) }}</small></dd></div>
                <div v-if="item.purchaseCountryCode"><dt>购买国家／地区</dt><dd>{{ item.purchaseCountryCode }}<small>关联订单信息，不代表激活地点</small></dd></div>
              </dl>
            </article>
          </li>
        </ol>
        <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :page-sizes="[20,50,100]" :total="data.total" layout="total, sizes, prev, pager, next" @size-change="resetPageAndFetch" @current-change="fetchData" />
      </el-card>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getActivationDetail, type ActivationDetail } from '@/api/activationDetail'
import { activationDetailRoute, activationTime, activationSourceLabel, activationLocation, activationAssetUrl } from '@/components/dashboard/activationDetail.mjs'

const route = useRoute()
const router = useRouter()
const emailInput = ref('')
const activeEmail = ref('')
const historical = ref(false)
const dateRange = ref<[string, string] | null>(null)
const page = ref(1)
const pageSize = ref(20)
const data = ref<ActivationDetail | null>(null)
const loading = ref(false)
const error = ref('')
let requestId = 0
async function searchEmail() {
  const email = emailInput.value.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { error.value = '请输入有效的邮箱地址'; return }
  if (email === activeEmail.value) { page.value = 1; await fetchData(); return }
  await router.push(activationDetailRoute(email))
}
function resetPageAndFetch() { page.value = 1; void fetchData() }
async function fetchData() {
  const current = ++requestId
  data.value = null
  error.value = ''
  if (!activeEmail.value) { loading.value = false; return }
  loading.value = true
  try {
    const response = await getActivationDetail({ email: activeEmail.value, page: page.value, pageSize: pageSize.value, historical: historical.value,
      ...(!historical.value && dateRange.value ? { startDate: dateRange.value[0], endDate: dateRange.value[1] } : {}) })
    if (current !== requestId) return
    if (response.code !== 0 || !response.data) throw new Error(response.msg || '获取激活详情失败')
    data.value = response.data
  } catch (cause) {
    if (current === requestId) error.value = cause instanceof Error ? cause.message
      : cause && typeof cause === 'object' && 'msg' in cause ? String(cause.msg) : '获取激活详情失败，请重新查询'
  } finally { if (current === requestId) loading.value = false }
}
watch(() => route.query.email, value => {
  activeEmail.value = typeof value === 'string' ? value.trim().toLowerCase() : ''
  emailInput.value = activeEmail.value
  page.value = 1
  historical.value = false
  dateRange.value = null
  void fetchData()
}, { immediate: true })
onBeforeUnmount(() => { requestId++ })
</script>

<style scoped>
.detail-page { max-width: 1400px; margin: 0 auto; padding: 16px; display: grid; gap: 18px; }
.page-heading,.timeline-heading,.event-heading,.timeline-filters { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.eyebrow { color: #168456; font-size: 11px; font-weight: 800; letter-spacing: .15em; margin: 0 0 6px; }
h1,h2,h3 { color: #173c2b; margin: 0; } h1 { font-size: 25px; } h2 { font-size: 17px; overflow-wrap: anywhere; } h3 { font-size: 16px; }
.muted,small { color: #708078; font-size: 12px; line-height: 1.7; } small { font-weight: 400; }
.back-link { color: #168456; font-size: 13px; }
.search-form { display: flex; gap: 12px; } .search-form .el-input { max-width: 520px; }
.account-summary { padding: 24px; background: #f2faf6; border: 1px solid #dfe9e4; border-radius: 12px; }
.summary-grid { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 20px; margin: 24px 0; }
.summary-grid span { color: #708078; font-size: 12px; } .summary-grid strong { display: block; font-size: 30px; color: #173c2b; margin-top: 6px; }
.known-dates { display: flex; flex-wrap: wrap; gap: 12px 32px; font-size: 12px; color: #596c61; }
.timeline-filters { justify-content: flex-start; margin-bottom: 20px; }
.timeline { padding: 0; margin: 0 0 24px; list-style: none; }
.timeline li { border-left: 2px solid #dfe9e4; padding: 0 0 24px 22px; margin-left: 5px; position: relative; }
.timeline li::before { content: ''; position: absolute; width: 10px; height: 10px; background: #168456; border: 3px solid white; border-radius: 50%; left: -9px; top: 0; }
.time-label { color: #52675b; font-size: 12px; margin-bottom: 10px; }
.event-app { display: flex; align-items: center; gap: 14px; min-width: 0; max-width: 100%; }
.app-thumbnail { width: 72px; height: 72px; flex: 0 0 72px; border-radius: 8px; background: #f5f7f6; }
.image-placeholder { display: flex; align-items: center; justify-content: center; height: 100%; font-size: 12px; color: #7c8982; }
.app-thumbnail.image-placeholder { height: 72px; }
.app-meta { min-width: 0; overflow-wrap: anywhere; }
.app-link { display: inline-block; margin-top: 8px; color: #16845e; font-size: 13px; }
.event-card { padding: 18px; border: 1px solid #e1e8e4; border-radius: 8px; }
.event-facts { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 16px; margin: 16px 0 0; }
dt { font-size: 12px; color: #708078; margin-bottom: 6px; } dd { margin: 0; font-size: 14px; color: #304438; overflow-wrap: anywhere; } dd small { display: block; margin-top: 4px; }
.loading-text { padding: 30px; text-align: center; color: #708078; }
@media(max-width: 768px) { .detail-page { padding: 0; } .summary-grid { grid-template-columns: repeat(2,minmax(0,1fr)); } .event-facts { grid-template-columns: 1fr; } .search-form { flex-direction: column; } .account-summary { padding: 18px; } h2 small { display: block; } .el-pagination { flex-wrap: wrap; gap: 8px; } .timeline-filters :deep(.el-date-editor) { width: 100%; max-width: 100%; } }
</style>
