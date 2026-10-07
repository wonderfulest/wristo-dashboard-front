<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getGameConfigs, getGameReport, getGameBoard, getGameRuns, type GameConfig, type GameReport, type GameBoard, type GameRuns } from '@/api/games'
import DashboardFilterBar from '@/components/dashboard/DashboardFilterBar.vue'
import GameMetricsCards from './GameMetrics.vue'
import GameTrend from './GameTrend.vue'
import { recentRange, shanghaiDate, leaderboardMode, formatGameScore } from './gameAnalytics.mjs'
const route = useRoute()
const key = computed(() => String(route.params.gameKey))
const game = ref<GameConfig | null>(null), report = ref<GameReport | null>(null), board = ref<GameBoard | null>(null), runs = ref<GameRuns | null>(null)
const range = ref<[string, string]>(recentRange()), boardDate = ref(shanghaiDate()), mode = ref('classic'), page = ref(1)
const loading = ref(false), boardLoading = ref(false), runsLoading = ref(false)
const error = ref(''), boardError = ref(''), runsError = ref('')
let reportRequest = 0, boardRequest = 0, runsRequest = 0, configRequest = 0
const title = computed(() => game.value?.nameZh || game.value?.name || key.value)
const timestamp = (seconds: number | null) => seconds == null ? '—' : new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', dateStyle: 'short', timeStyle: 'medium', hour12: false }).format(new Date(seconds * 1000))
async function loadReport() {
  const id = ++reportRequest, currentKey = key.value
  loading.value = true; error.value = ''; report.value = null
  try { const result = await getGameReport(currentKey, ...range.value); if (!result.data) throw new Error("Missing response data"); if (id === reportRequest) report.value = result.data }
  catch { if (id === reportRequest) error.value = '运营统计加载失败，请重试。' }
  finally { if (id === reportRequest) loading.value = false }
}
async function loadBoard() {
  const id = ++boardRequest
  boardLoading.value = true; boardError.value = ''; board.value = null
  try { const result = await getGameBoard(key.value, leaderboardMode(key.value, mode.value, boardDate.value)); if (!result.data) throw new Error("Missing response data"); if (id === boardRequest) board.value = result.data }
  catch { if (id === boardRequest) boardError.value = '排行榜加载失败，请重试。' }
  finally { if (id === boardRequest) boardLoading.value = false }
}
async function loadRuns() {
  const id = ++runsRequest
  runsLoading.value = true; runsError.value = ''; runs.value = null
  try { const result = await getGameRuns(key.value, ...range.value, page.value); if (!result.data) throw new Error("Missing response data"); if (id === runsRequest) runs.value = result.data }
  catch { if (id === runsRequest) runsError.value = '对局记录加载失败，请重试。' }
  finally { if (id === runsRequest) runsLoading.value = false }
}
function applyRange() { page.value = 1; loadReport(); loadRuns() }
function quick(days: number) { range.value = recentRange(days); applyRange() }
function changePage(value: number) { page.value = value; loadRuns() }
async function initialize() {
  const id = ++configRequest
  ++reportRequest; ++boardRequest; ++runsRequest
  game.value = null; report.value = null; board.value = null; runs.value = null
  error.value = ''; boardError.value = ''; runsError.value = ''; page.value = 1
  mode.value = key.value === 'echo-orbit' ? 'touch' : 'classic'
  boardDate.value = shanghaiDate()
  const currentKey = key.value
  loadReport(); loadBoard(); loadRuns()
  try {
    const result = await getGameConfigs()
    if (!result.data) throw new Error('Missing game catalog')
    if (id === configRequest) game.value = result.data.find(g => g.key === currentKey) || null
  } catch { if (id === configRequest) error.value = '游戏资料加载失败，请刷新页面。' }
}
watch(key, initialize, { immediate: true })
</script>
<template>
  <section class="games-page">
    <div class="back"><router-link to="/games/overview">← 运营总览</router-link><router-link to="/games/manage">游戏管理</router-link></div>
    <DashboardFilterBar eyebrow="GAME INSIGHTS" :title="`${title} · 运营详情`" description="每日活跃、游戏次数、对局记录与独立排行榜" />
    <div v-if="game" class="identity"><el-tag :type="game.enabled ? 'success' : 'info'">{{ game.enabled ? '已上架' : '已下架' }}</el-tag><span>{{ game.key }}</span><span>Garmin ID：<code>{{ game.garminAppId || '未配置' }}</code></span></div>
    <div class="filters"><el-button-group><el-button v-for="days in [7,30,90]" :key="days" @click="quick(days)">近 {{ days }} 天</el-button></el-button-group><el-date-picker v-model="range" type="daterange" value-format="YYYY-MM-DD" :clearable="false" start-placeholder="开始日期" end-placeholder="结束日期" @change="applyRange"/><el-button type="primary" :loading="loading" @click="applyRange">刷新统计</el-button></div>
    <p class="muted">北京时间（Asia/Shanghai）· 最多 366 天。日活按本游戏安装身份去重；重装后视为新身份。离线补传按活动发生日期归档，补传可能修正历史新增人数。</p>
    <el-alert type="info" :closable="false" show-icon title="事件指标仅覆盖支持采集的新版客户端和已成功上传的活动；零条记录不代表没有离线玩家。旧版成绩只计入“上传结算”，不能还原日活或开局。" />
    <el-alert v-if="error" :title="error" type="error" :closable="false" />
    <div v-if="loading" class="placeholder">正在加载运营数据…</div>
    <template v-if="report">
      <GameMetricsCards :metrics="report.summary" :to="report.to" />
      <el-card shadow="never"><template #header><h2>每日趋势</h2></template><GameTrend :items="report.daily" /></el-card>
      <el-card shadow="never"><template #header><div class="filters"><h2>每日数据</h2><span class="muted">区间上传结算 {{ report.summary.uploadedRuns.toLocaleString() }} 次 · 提交玩家 {{ report.summary.uploadPlayers.toLocaleString() }} 人</span></div></template>
        <el-table :data="report.daily" stripe max-height="430">
          <el-table-column prop="date" label="日期（北京时间）" min-width="160" />
          <el-table-column prop="activePlayers" label="日活" min-width="95" />
          <el-table-column prop="starts" label="游戏次数" min-width="100" />
          <el-table-column prop="completions" label="完成局数" min-width="100" />
          <el-table-column prop="newPlayers" label="新增玩家" min-width="100" />
          <el-table-column prop="uploadedRuns" label="上传结算次数" min-width="120" />
          <el-table-column prop="uploadPlayers" label="提交成绩玩家" min-width="120" />
        </el-table>
        <p class="muted footnote">上传结算按服务器接收日期统计，包含新旧客户端；玩家数按提交身份去重。与按发生日统计的游戏次数不能直接相减。</p>
      </el-card>
    </template>
    <el-card shadow="never"><template #header><div class="filters"><h2>对局记录</h2><el-button :loading="runsLoading" @click="loadRuns">刷新记录</el-button></div></template>
      <p class="muted">所选日期内发生开局或完成事件的对局。尚未收到完成事件可能是进行中、退出或等待补传；排行榜的模式筛选不影响此表。</p>
      <el-alert v-if="runsError" :title="runsError" type="error" :closable="false" />
      <el-table v-loading="runsLoading" :data="runs?.items || []" empty-text="暂无采集到的对局记录" stripe>
        <el-table-column prop="player" label="玩家" min-width="170" />
        <el-table-column prop="mode" label="模式" min-width="140" />
        <el-table-column label="开局时间" min-width="180"><template #default="{ row }">{{ timestamp(row.startedAt) }}</template></el-table-column>
        <el-table-column label="完成时间" min-width="180"><template #default="{ row }">{{ timestamp(row.completedAt) }}</template></el-table-column>
        <el-table-column label="结算原始分数" min-width="125"><template #default="{ row }">{{ row.score == null ? '—' : row.score.toLocaleString() }}</template></el-table-column>
        <el-table-column label="状态" min-width="140"><template #default="{ row }"><el-tag :type="row.completedAt == null ? 'info' : 'success'">{{ row.completedAt == null ? '未收到完成事件' : '已完成' }}</el-tag></template></el-table-column>
      </el-table>
      <el-pagination v-if="runs" :current-page="page" :page-size="20" :total="runs.total" :disabled="runsLoading" layout="total, prev, pager, next" :pager-count="5" @current-change="changePage" />
    </el-card>
    <el-card shadow="never"><template #header><div class="filters"><h2>排行榜</h2>
      <el-select v-if="key === 'echo-orbit'" v-model="mode" aria-label="排行榜模式" style="width:140px" @change="loadBoard"><el-option label="触屏" value="touch"/><el-option label="按键" value="buttons"/></el-select>
      <el-date-picker v-if="key === 'daily-lights'" v-model="boardDate" type="date" value-format="YYYY-MM-DD" :clearable="false" aria-label="挑战日期" @change="loadBoard" />
      <el-button :loading="boardLoading" @click="loadBoard">刷新排行榜</el-button></div></template>
      <p class="muted">{{ key === 'daily-lights' ? '按所选谜题日期独立排名，保留手表端谜题日期。' : '当前模式的历史最佳成绩榜，不受上方统计日期范围影响。' }} 展示前 50 位，同分并列；{{ board?.metric === 'errorMs' ? '误差越小越好' : '成绩越高越好' }}。{{ board ? `共 ${board.participants.toLocaleString()} 位参榜玩家。` : '' }}</p>
      <el-alert v-if="boardError" :title="boardError" type="error" :closable="false" />
      <el-table v-loading="boardLoading" :data="board?.entries || []" empty-text="该模式暂无成绩" stripe>
        <el-table-column prop="rank" label="名次" width="100"/>
        <el-table-column prop="player" label="玩家" min-width="190"/>
        <el-table-column label="最佳成绩" min-width="150"><template #default="{ row }">{{ formatGameScore(row.score, board?.metric || '') }}</template></el-table-column>
      </el-table>
    </el-card>
  </section>
</template>
<style scoped>
.games-page{padding:24px;display:flex;flex-direction:column;gap:18px}.back,.filters,.identity{display:flex;flex-wrap:wrap;align-items:center;gap:12px}.back{justify-content:space-between}.identity{font-size:12px;color:#64748b}code{overflow-wrap:anywhere}.muted{font-size:12px;line-height:1.8;color:#738078;margin:0}.footnote{margin-top:12px}h2{font-size:16px;margin:0;margin-right:auto}a{color:#168456;text-decoration:none}.placeholder{padding:45px;text-align:center;color:#738078}.el-pagination{margin-top:16px}@media(max-width:680px){.games-page{padding:14px}.filters :deep(.el-date-editor){width:100%;max-width:100%}}
</style>
