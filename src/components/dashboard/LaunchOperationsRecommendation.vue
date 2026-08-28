<template>
  <section class="analytics-section" v-loading="loading">
    <header class="analytics-heading">
      <div><span class="section-kicker">LAUNCH PLAN</span><h2>今日经营建议</h2></div>
      <el-button size="small" type="primary" @click="load">刷新模型</el-button>
    </header>
    <el-alert v-if="error" :title="error" type="error" :closable="false" show-icon />
    <template v-else-if="response">
      <div class="model-meta">
        <el-tag :type="response.status === 'READY' ? 'success' : 'warning'">{{ modelStatusLabel(response) }}</el-tag>
        <span>模型版本：{{ response.modelVersion || '—' }}</span>
        <span>样本量：{{ response.sampleSize.toLocaleString() }}</span>
        <span>生成时间：{{ formatTime(response.generatedAt) }}</span>
      </div>
      <div class="recommendation-grid">
        <article class="primary-card">
          <span>建议上线量</span>
          <strong>{{ recommendationRangeLabel(recommendation) }}</strong>
          <small>历史关联建议，不代表因果保证</small>
        </article>
        <article><span>预测归因营收</span><strong>{{ formatUsdCents(recommendation?.predictedRevenueCents) }}</strong></article>
        <article><span>边际营收 / 新增一款</span><strong>{{ formatUsdCents(recommendation?.marginalRevenuePerLaunchCents) }}</strong></article>
        <article><span>存量保护</span><strong>{{ formatPercent(recommendation?.stockRevenueRetention) }}</strong></article>
        <article><span>新品单款保护</span><strong>{{ formatPercent(recommendation?.launchRevenueRetention) }}</strong></article>
        <article><span>预测置信区间</span><strong>{{ confidenceRange }}</strong></article>
      </div>
      <div v-if="quotas.length" class="quota-block">
        <h3>各品类建议上线量</h3>
        <div class="quota-grid">
          <article v-for="quota in quotas" :key="quota.categoryId">
            <span>{{ quota.categoryName }}</span>
            <strong>{{ quota.totalQuota }} 款</strong>
            <small>首发 {{ quota.firstLaunchQuota }} / 重新上线 {{ quota.relaunchQuota }}</small>
          </article>
        </div>
      </div>
      <el-empty v-if="!response.data" description="暂无成功模型，请先完成事实回填和训练" :image-size="72" />
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { getLaunchRecommendation } from '@/api/launch-analytics'
import type { AnalyticsResponse, LaunchOperationsRecommendation } from '@/types/launch-analytics'
import { formatUsdCents, modelStatusLabel, recommendationRangeLabel } from './launchAnalyticsUtils.mjs'

const loading = ref(false)
const error = ref('')
const response = ref<AnalyticsResponse<LaunchOperationsRecommendation> | null>(null)
const recommendation = computed(() => response.value?.data?.recommendation ?? null)
const quotas = computed(() => response.value?.data?.quotaAllocation?.quotas ?? [])
const formatPercent = (value?: number | null) => value == null ? '—' : `${(value * 100).toFixed(1)}%`
const formatTime = (value?: string) => value ? value.replace('T', ' ').slice(0, 16) : '—'
const confidenceRange = computed(() => {
  const data = recommendation.value
  return data ? `${formatUsdCents(data.confidenceLowerRevenueCents)} – ${formatUsdCents(data.confidenceUpperRevenueCents)}` : '—'
})
const load = async () => {
  loading.value = true
  error.value = ''
  try { response.value = (await getLaunchRecommendation()).data ?? null }
  catch { error.value = '经营建议暂时无法加载，请稍后重试' }
  finally { loading.value = false }
}
onMounted(load)
</script>

<style scoped>
.analytics-section { margin-top: 16px; padding: 18px; border: 1px solid #e2eae5; border-radius: 12px; background: #fff; }
.analytics-heading,.model-meta { display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; }
.section-kicker { color:#6f8177; font-size:10px; font-weight:800; letter-spacing:.14em; } h2{margin:2px 0 0;color:#1d3027;font-size:18px}
.model-meta { justify-content:flex-start; margin:12px 0; color:#718078; font-size:12px; }
.recommendation-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; }
.quota-block h3{margin:18px 0 10px;color:#263b31;font-size:14px}.quota-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
article { display:flex; min-height:86px; padding:14px; flex-direction:column; border:1px solid #e7ece9; border-radius:10px; background:#fbfcfb; }
article span { color:#718078; font-size:12px; } article strong { margin-top:8px; color:#193126; font-size:20px; font-variant-numeric:tabular-nums; }
.primary-card { background:#edf8f2; border-color:#cce8da; } .primary-card strong { color:#11734b; font-size:26px; } small{margin-top:6px;color:#87958e}
@media(max-width:900px){.recommendation-grid,.quota-grid{grid-template-columns:repeat(2,1fr)}} @media(max-width:520px){.recommendation-grid,.quota-grid{grid-template-columns:1fr}}
</style>
