<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { getGameOverview, type GameOverview, type GameMetrics } from '@/api/games'
import DashboardFilterBar from '@/components/dashboard/DashboardFilterBar.vue'
import GameMetricsCards from './GameMetrics.vue'
import { recentRange } from './gameAnalytics.mjs'
const range = ref<[string, string]>(recentRange())
const data = ref<GameOverview | null>(null), loading = ref(false), error = ref(''), query = ref('')
let requestId = 0
const rows = computed(() => data.value?.games.filter(g => `${g.name} ${g.nameZh} ${g.key}`.toLowerCase().includes(query.value.toLowerCase())) || [])
const totals = computed<GameMetrics>(() => {
  const sum: GameMetrics = { activePlayers: 0, endDayActive: 0, starts: 0, completions: 0, newPlayers: 0, totalPlayers: 0, uploadedRuns: 0, uploadPlayers: 0 }
  for (const game of data.value?.games || []) for (const key of Object.keys(sum) as (keyof GameMetrics)[]) sum[key] += game.metrics[key]
  return sum
})
async function load() {
  const id = ++requestId
  loading.value = true; error.value = ''; data.value = null
  try { const result = await getGameOverview(...range.value); if (!result.data) throw new Error("Missing response data"); if (id === requestId) data.value = result.data }
  catch { if (id === requestId) error.value = '运营数据加载失败，请检查 API 和小游戏数据库迁移后重试。' }
  finally { if (id === requestId) loading.value = false }
}
function quick(days: number) { range.value = recentRange(days); load() }
onMounted(load)
</script>
<template>
  <section class="games-page">
    <DashboardFilterBar eyebrow="GAME OPERATIONS" title="小游戏运营总览" description="查看每款游戏的玩家活跃、游戏次数与运营详情" />
    <div class="filters"><el-button-group><el-button v-for="days in [7,30,90]" :key="days" @click="quick(days)">近 {{ days }} 天</el-button></el-button-group><el-date-picker v-model="range" type="daterange" value-format="YYYY-MM-DD" :clearable="false" start-placeholder="开始日期" end-placeholder="结束日期" @change="load"/><el-button type="primary" :loading="loading" @click="load">刷新数据</el-button><router-link to="/games/manage">游戏管理</router-link></div>
    <p class="muted">北京时间（Asia/Shanghai）· 最多 366 天。每款游戏独立匿名身份，跨游戏人数相加不代表真实用户去重。</p>
    <el-alert type="info" :closable="false" show-icon title="日活和游戏次数来自新版游戏事件采集，离线活动补传后归入实际发生日。未更新客户端或尚未补传的活动不在其中；历史成绩只计入上传结算。" />
    <el-alert v-if="error" type="error" :title="error" :closable="false" />
    <div v-if="loading" class="placeholder">正在加载游戏运营数据…</div>
    <template v-if="data">
      <GameMetricsCards :metrics="totals" :to="data.to" aggregate />
      <el-card shadow="never"><template #header><div class="filters"><h2>各游戏运营数据</h2><el-input v-model="query" placeholder="搜索游戏名称或标识" clearable style="max-width:280px" aria-label="搜索游戏"/></div></template>
        <el-table :data="rows" stripe empty-text="没有符合条件的游戏">
          <el-table-column label="游戏" min-width="180" fixed><template #default="{ row }"><router-link :to="`/games/${row.key}`">{{ row.nameZh || row.name }}</router-link><div class="muted">{{ row.key }}</div></template></el-table-column>
          <el-table-column label="状态" width="90"><template #default="{ row }"><el-tag :type="row.enabled ? 'success' : 'info'">{{ row.enabled ? '已上架' : '已下架' }}</el-tag></template></el-table-column>
          <el-table-column prop="metrics.endDayActive" label="截止日日活" min-width="110" sortable />
          <el-table-column prop="metrics.activePlayers" label="区间活跃" min-width="105" sortable />
          <el-table-column prop="metrics.starts" label="游戏次数" min-width="105" sortable />
          <el-table-column prop="metrics.completions" label="完成局数" min-width="105" sortable />
          <el-table-column prop="metrics.newPlayers" label="新增玩家" min-width="105" sortable />
          <el-table-column prop="metrics.totalPlayers" label="累计玩家" min-width="105" sortable />
          <el-table-column prop="metrics.uploadedRuns" label="上传结算" min-width="105" sortable />
          <el-table-column label="操作" width="100" fixed="right"><template #default="{ row }"><router-link :to="`/games/${row.key}`">运营详情</router-link></template></el-table-column>
        </el-table>
      </el-card>
    </template>
  </section>
</template>
<style scoped>
.games-page{padding:24px;display:flex;flex-direction:column;gap:18px}.filters{display:flex;flex-wrap:wrap;gap:12px;align-items:center}.muted{color:#738078;font-size:12px;margin:0;line-height:1.7}h2{font-size:16px;margin:0;margin-right:auto}a{color:#168456;text-decoration:none}.placeholder{padding:50px;text-align:center;color:#738078}@media(max-width:680px){.games-page{padding:14px}.filters :deep(.el-date-editor){max-width:100%;width:100%}}
</style>
