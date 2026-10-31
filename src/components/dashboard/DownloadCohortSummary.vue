<template>
  <section v-loading="loading" aria-label="下载分类概览">
    <el-alert v-if="error" :title="error" type="error" :closable="false" show-icon />
    <div v-if="stats" class="summary-grid">
      <article><span>全部上报</span><strong>{{ number(stats.downloads) }}</strong><small>首次记录与历史重新上报合计</small></article>
      <article><span>首次下载</span><strong>{{ number(stats.firstDownloads) }}</strong><small>占全部上报 {{ rate(stats.firstDownloads, stats.downloads) }}</small></article>
      <article><span>历史设备重新上报</span><strong>{{ number(stats.repeatDownloads) }}</strong><small>占全部上报 {{ rate(stats.repeatDownloads, stats.downloads) }} · {{ number(stats.returningDevices) }} 个设备与表盘</small></article>
      <article><span>首次下载转化率</span><strong>{{ rate(stats.purchasedDevices, stats.firstDownloads) }}</strong><small>{{ number(stats.purchasedDevices) }} 个首次下载设备与表盘已购买</small></article>
      <article><span>回流后购买率</span><strong>{{ rate(stats.returningPurchasedDevices, stats.returningDevices) }}</strong><small>{{ number(stats.returningPurchasedDevices) }} 个设备与表盘在本期首次回流后购买</small></article>
    </div>
    <p class="note">购买按设备与表盘去重，包含成功购买的应用或覆盖该表盘的套餐，不含订阅；观察截至当前，不限制付款必须发生在筛选日期内。同批设备的转化率可能随延迟购买更新。“首次”仅依据已保留的历史判断。</p>
  </section>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { getFunnel } from '@/api/purchase'
import type { AppFunnelVO } from '@/types/api'
import type { DashboardFilter } from './dashboardTypes'
const props = defineProps<{ filter: DashboardFilter; revision: number }>()
const stats = ref<AppFunnelVO | null>(null)
const loading = ref(false)
const error = ref('')
let requestId = 0
const number = (value: number) => Number(value).toLocaleString('zh-CN')
const rate = (value: number, total: number) => total > 0 ? `${(value / total * 100).toFixed(1)}%` : '—'
async function load() {
  const id = ++requestId
  loading.value = true
  error.value = ''
  stats.value = null
  try {
    const result = await getFunnel({ startDate: props.filter.startDate, endDate: props.filter.endDate })
    if (id !== requestId) return
    if (result.code !== 0 || result.data?.firstDownloads == null || result.data?.purchasedDevices == null) {
      throw new Error('下载分类统计尚未就绪，请确认后端已更新')
    }
    stats.value = result.data
  } catch (cause) {
    if (id === requestId) error.value = cause instanceof Error ? cause.message : '下载分类统计加载失败'
  } finally {
    if (id === requestId) loading.value = false
  }
}
watch(() => [props.filter.startDate, props.filter.endDate, props.revision], load, { immediate: true })
</script>

<style scoped>
.summary-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 12px; }
article { display: flex; flex-direction: column; gap: 10px; padding: 18px; border: 1px solid var(--el-border-color-light); border-radius: 12px; background: var(--el-bg-color); }
span, small, .note { color: var(--el-text-color-secondary); line-height: 1.6; }
strong { font-size: 26px; font-variant-numeric: tabular-nums; color: var(--el-text-color-primary); }
.note { font-size: 13px; margin: 14px 0 20px; }
@media (max-width: 1100px) { .summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 520px) { .summary-grid { grid-template-columns: 1fr; } }
</style>
