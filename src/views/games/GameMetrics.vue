<template>
  <div class="metrics">
    <div v-for="card in cards" :key="card.label" class="metric"><span>{{ card.label }}</span><strong>{{ metrics[card.key].toLocaleString() }}</strong><small>{{ card.note }}</small></div>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import type { GameMetrics } from '@/api/games'
const props = defineProps<{ metrics: GameMetrics; to: string; aggregate?: boolean }>()
const cards = computed<{ key: keyof GameMetrics; label: string; note: string }[]>(() => [
  { key: 'endDayActive', label: '截止日日活', note: `${props.to} · ${props.aggregate ? '各游戏安装身份之和' : '去重安装身份'}` },
  { key: 'activePlayers', label: '区间活跃玩家', note: props.aggregate ? '各游戏分别去重后相加' : '所选日期内去重' },
  { key: 'starts', label: '游戏次数', note: '按开局事件计数' },
  { key: 'completions', label: '完成局数', note: '按完成事件计数' },
  { key: 'newPlayers', label: '新增玩家', note: '首次采集到活动的安装身份' },
  { key: 'totalPlayers', label: '累计玩家', note: '截至所选结束日期 · 事件采集口径' },
])
</script>
<style scoped>
.metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.metric{border:1px solid #dfe9e4;border-radius:8px;background:#fff;padding:18px;display:flex;flex-direction:column;gap:8px}.metric span{font-size:13px;color:#64748b}.metric strong{font-size:28px;color:#173c2b;font-variant-numeric:tabular-nums}.metric small{color:#7b8b83;font-size:12px}@media(min-width:1500px){.metrics{grid-template-columns:repeat(6,minmax(0,1fr))}}@media(max-width:680px){.metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}
</style>
