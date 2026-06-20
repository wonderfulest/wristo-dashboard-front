<template>
  <el-card class="section-card" shadow="never">
    <template #header>
      <div class="card-header">
        <span>评分</span>
        <div v-if="score" class="header-head">
          <span class="header-meta">总分：{{ formatNum(score.total, 4) }}</span>
          <el-link type="primary" class="toggle-link" @click="expanded = !expanded">
            {{ expanded ? '收起详情' : '展开详情' }}
          </el-link>
        </div>
      </div>
    </template>

    <el-empty v-if="!score" description="暂无评分数据" />

    <template v-else>
      <el-row :gutter="16" class="score-summary">
        <el-col :span="6">
          <el-statistic title="总分" :value="formatNum(score.total, 4)" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="市场表现" :value="formatNum(items.market.score, 4)" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="近期互动" :value="formatNum(items.engagement.score, 4)" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="长期可信度" :value="formatNum(items.trust.score, 4)" />
        </el-col>
      </el-row>

      <el-table
        v-if="expanded"
        :data="tableRows"
        size="small"
        border
        style="width: 100%; margin-top: 12px"
      >
        <el-table-column prop="name" label="维度" width="180" />
        <el-table-column prop="value" label="raw" width="140" />
        <el-table-column prop="score" label="score" width="140" />
        <el-table-column prop="weight" label="weight" width="140" />
        <el-table-column prop="weighted" label="weight*score" min-width="160" />
      </el-table>

      <div v-if="expanded" class="formula">
        <div class="formula__title">计算过程</div>
        <pre class="formula__code">{{ formulaText }}</pre>
      </div>
    </template>
  </el-card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { AppMeterScoreVO } from '@/types/meter'

const props = defineProps<{ score: AppMeterScoreVO | null }>()

const expanded = ref(false)

const safeNum = (v: any) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

const formatNum = (v: any, digits = 4) => {
  const n = safeNum(v)
  return n.toFixed(digits)
}

const scoreKeys = [
  ['market', '市场表现'],
  ['engagement', '近期互动'],
  ['trust', '长期可信度'],
  ['totalDownload', '累计下载'],
  ['recentDownload', '近 30 天下载'],
  ['purchaseVelocity', '购买速度'],
  ['conversion', '购买转化率'],
  ['recentPurchase', '近 30 天购买'],
  ['recentActiveUser', '近 30 天活跃'],
  ['recentUsage', '近 30 天使用'],
  ['usageDepth', '使用深度'],
  ['totalPurchase', '累计购买'],
  ['ageTrust', '上架时间可信度'],
] as const

const items = computed(() => {
  const s = props.score
  const get = (key: string) => {
    const value = safeNum((s as any)?.breakdown?.[key]?.value)
    const score = safeNum((s as any)?.breakdown?.[key]?.score)
    const weight = safeNum((s as any)?.weights?.[key] ?? (s as any)?.breakdown?.[key]?.weight)
    const weighted = safeNum((s as any)?.breakdown?.[key]?.weightedScore) || weight * score
    return { value, score, weight, weighted }
  }

  return {
    market: get('market'),
    engagement: get('engagement'),
    trust: get('trust'),
  }
})

const tableRows = computed(() => {
  const s = props.score
  return scoreKeys.map(([key, label]) => {
    const item = (s as any)?.breakdown?.[key] || {}
    return {
      name: label,
      value: item.value == null ? '-' : formatNum(item.value),
      score: formatNum(item.score),
      weight: formatNum((s as any)?.weights?.[key] ?? item.weight),
      weighted: formatNum(item.weightedScore),
    }
  })
})

const formulaText = computed(() => {
  const s = props.score
  if (!s) return ''
  const it = items.value

  const left = `total = w.market*market + w.engagement*engagement + w.trust*trust`
  const right = `= ${formatNum(it.market.weight)}*${formatNum(it.market.score)} + ${formatNum(it.engagement.weight)}*${formatNum(it.engagement.score)} + ${formatNum(it.trust.weight)}*${formatNum(it.trust.score)}`

  const sum = it.market.weighted + it.engagement.weighted + it.trust.weighted
  const result = `= ${formatNum(sum)} (backend total: ${formatNum((s as any).total)})`

  return [left, right, result].join('\n')
})
</script>

<style scoped>
.section-card { margin-bottom: 24px; }
.card-header { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
.header-head { display: inline-flex; align-items: center; gap: 8px; }
.header-meta { color: #606266; font-size: 12px; }
.toggle-link { font-size: 12px; }
.score-summary :deep(.el-statistic) { background: var(--el-bg-color-page); border-radius: 8px; padding: 16px; }
.formula { margin-top: 12px; }
.formula__title { font-size: 13px; color: #606266; margin-bottom: 6px; font-weight: 600; }
.formula__code {
  margin: 0;
  padding: 10px 12px;
  border-radius: 8px;
  background: var(--el-fill-color-light);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
