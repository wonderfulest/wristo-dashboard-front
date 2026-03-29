<template>
  <div class="meter-stats-page">
    <div class="header">
      <h2>业务指标</h2>
    </div>

    <!-- 全局 DAU -->
    <el-card class="section-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>全局 DAU</span>
        </div>
      </template>
      <div class="dau-row">
        <el-date-picker v-model="dauDate" type="date" placeholder="选择日期" format="YYYYMMDD" value-format="YYYYMMDD" style="width: 180px" />
        <el-button type="primary" :loading="dauLoading" @click="fetchDau">查询</el-button>
        <el-statistic v-if="dauValue !== null" title="DAU" :value="dauValue" class="dau-stat" />
      </div>
    </el-card>

    <!-- App 业务指标 -->
    <el-card class="section-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>App 业务指标汇总</span>
        </div>
      </template>
      <div class="query-row">
        <el-input-number v-model="queryAppId" :min="1" :controls="false" placeholder="App ID" style="width: 180px" />
        <el-date-picker v-model="queryDate" type="date" placeholder="DAU 日期（可选）" format="YYYYMMDD" value-format="YYYYMMDD" style="width: 180px" />
        <el-button type="primary" :loading="statsLoading" @click="fetchStats">查询</el-button>
      </div>

      <el-row v-if="stats" :gutter="16" class="stats-cards">
        <el-col :span="4">
          <el-statistic title="安装数" :value="stats.installCount ?? 0" />
        </el-col>
        <el-col :span="4">
          <el-statistic title="订单数" :value="stats.orderCount ?? 0" />
        </el-col>
        <el-col :span="4">
          <el-statistic title="收入" :value="Number((stats.revenue ?? 0).toFixed(2))" />
        </el-col>
        <el-col :span="4">
          <el-statistic title="使用时长">
            <template #default>
              <span>{{ (stats.usageMinutes ?? 0).toFixed(2) }} 分钟</span>
            </template>
          </el-statistic>
        </el-col>
        <el-col :span="4">
          <el-statistic title="DAU" :value="stats.dau ?? 0" />
        </el-col>
      </el-row>

      <el-descriptions v-if="stats" :column="2" border class="stats-detail">
        <el-descriptions-item label="App ID">{{ stats.appId }}</el-descriptions-item>
        <el-descriptions-item label="安装数">{{ stats.installCount ?? 0 }}</el-descriptions-item>
        <el-descriptions-item label="订单数">{{ stats.orderCount ?? 0 }}</el-descriptions-item>
        <el-descriptions-item label="收入">{{ (stats.revenue ?? 0).toFixed(4) }}</el-descriptions-item>
        <el-descriptions-item label="使用时长（分钟）">{{ (stats.usageMinutes ?? 0).toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="DAU">{{ stats.dau ?? 0 }}</el-descriptions-item>
      </el-descriptions>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getDau, getAppStats } from '@/api/meter'
import type { AppStatsVO } from '@/types/meter'

// ---- DAU ----
const dauDate = ref('')
const dauLoading = ref(false)
const dauValue = ref<number | null>(null)

const fetchDau = async () => {
  dauLoading.value = true
  try {
    const res = await getDau(dauDate.value || undefined)
    dauValue.value = res.data ?? 0
  } catch {
    ElMessage.error('获取 DAU 失败')
  } finally {
    dauLoading.value = false
  }
}

// ---- App Stats ----
const queryAppId = ref<number>()
const queryDate = ref('')
const statsLoading = ref(false)
const stats = ref<AppStatsVO | null>(null)

const fetchStats = async () => {
  if (!queryAppId.value) {
    ElMessage.warning('请输入 App ID')
    return
  }
  statsLoading.value = true
  try {
    const res = await getAppStats(queryAppId.value, queryDate.value || undefined)
    stats.value = res.data || null
  } catch {
    ElMessage.error('获取业务指标失败')
  } finally {
    statsLoading.value = false
  }
}
</script>

<style scoped>
.meter-stats-page { padding: 16px; }
.header { margin-bottom: 16px; }
.section-card { margin-bottom: 24px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.dau-row { display: flex; align-items: center; gap: 16px; }
.dau-stat { margin-left: 24px; }
.query-row { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
.stats-cards { margin-bottom: 20px; }
.stats-cards .el-statistic { background: var(--el-bg-color-page); border-radius: 8px; padding: 16px; }
.stats-detail { margin-top: 8px; }
</style>
