<template>
  <div class="credits-page operations-page">
    <header><div><h2>全平台收支流水</h2><p>奖励积分与 AI 点数分账展示，按真实业务编号追溯来源。查询不会创建账户或发放赠送点数。</p></div><el-button @click="$router.push('/ops/points-accounts')">用户账户</el-button></header>
    <el-card shadow="never">
      <el-form inline @submit.prevent="search">
        <el-form-item label="日期"><el-date-picker v-model="dates" type="daterange" value-format="YYYY-MM-DD" :clearable="false" start-placeholder="开始日期" end-placeholder="结束日期" /></el-form-item>
        <el-form-item label="用户"><UserSelect :model-value="numericUserId" placeholder="搜索用户名或邮箱" @update:model-value="setUser" /></el-form-item>
        <el-form-item label="资产"><el-select v-model="filters.asset" clearable placeholder="全部资产"><el-option label="奖励积分" value="REWARD" /><el-option label="AI 点数" value="AI" /></el-select></el-form-item>
        <el-form-item label="方向"><el-select v-model="filters.direction" clearable placeholder="全部方向"><el-option label="增加" value="IN" /><el-option label="扣减" value="OUT" /><el-option label="零变动记录" value="ZERO" /></el-select></el-form-item>
        <el-form-item label="来源类型"><el-select v-model="filters.type" filterable allow-create default-first-option clearable placeholder="选择或输入类型"><el-option v-for="(label, value) in typeLabels" :key="value" :label="label" :value="value" /></el-select></el-form-item>
        <el-form-item label="关键词"><el-input v-model="filters.keyword" clearable maxlength="100" placeholder="业务编号或说明" /></el-form-item>
        <el-form-item label="事件编号"><el-input v-model="filters.eventKey" clearable maxlength="191" placeholder="精确匹配业务事件编号" /></el-form-item>
        <el-form-item><el-button type="primary" native-type="submit" :loading="loading">查询</el-button><el-button @click="reset">重置</el-button></el-form-item>
      </el-form>
      <div class="operations-hint"><el-button size="small" @click="quickRange(1)">今天</el-button><el-button size="small" @click="quickRange(7)">近 7 天</el-button><el-button size="small" @click="quickRange(30)">近 30 天</el-button><span>北京时间，含结束日期；每次最多 366 天。</span></div>
      <el-alert v-if="validation" :title="validation" type="warning" :closable="false" show-icon />
    </el-card>
    <el-alert v-if="error" :title="error" type="error" :closable="false" show-icon><el-button link type="primary" @click="retry">重试当前查询</el-button></el-alert>
    <el-card shadow="never">
      <div class="operations-heading"><strong>流水记录 · {{ result ? result.total.toLocaleString('zh-CN') : '—' }} 条</strong><span v-if="applied" class="muted">{{ applied.from }} 至 {{ applied.to }}<template v-if="applied.userId"> · 用户 {{ applied.userId }}</template></span></div>
      <el-table :data="result?.items || []" v-loading="loading" row-key="id" :empty-text="error || validation ? '查询未完成，请处理提示后重试' : '所选条件下暂无流水'">
        <el-table-column label="时间 / 流水号" min-width="185"><template #default="{ row }">{{ time(row.createdAt) }}<div class="muted">{{ row.id }}</div></template></el-table-column>
        <el-table-column label="用户" min-width="180"><template #default="{ row }"><el-button link type="primary" @click="openAccount(row.userId)">{{ row.username || `用户 ${row.userId}` }}</el-button><div class="muted">{{ row.email || '邮箱未记录' }} · {{ row.userId }}</div></template></el-table-column>
        <el-table-column label="资产 / 来源" min-width="160"><template #default="{ row }"><el-tag :type="row.asset === 'AI' ? 'primary' : 'success'" size="small">{{ row.asset === 'AI' ? 'AI 点数' : '奖励积分' }}</el-tag><div>{{ typeLabels[row.type] || row.type }}</div><div v-if="row.reason" class="muted">{{ creditReasons[row.reason] || row.reason }}</div></template></el-table-column>
        <el-table-column label="变动" width="115" align="right"><template #default="{ row }"><strong :class="row.delta > 0 ? 'positive' : row.delta < 0 ? 'negative' : ''">{{ row.delta > 0 ? '+' : '' }}{{ number(row.delta) }}</strong></template></el-table-column>
        <el-table-column label="变动后余额" width="135" align="right"><template #default="{ row }"><span v-if="row.balanceAfter != null">{{ number(row.balanceAfter) }}</span><el-tooltip v-else content="该流水没有保存当时余额，不使用当前余额推算"><span class="muted">未记录</span></el-tooltip></template></el-table-column>
        <el-table-column label="说明 / 事件编号" min-width="245"><template #default="{ row }"><div>{{ row.description || '—' }}</div><div class="event-key">{{ row.eventKey }}</div></template></el-table-column>
        <el-table-column label="操作人" min-width="120"><template #default="{ row }">{{ row.operatorName || row.operatorId || '系统 / 未记录' }}</template></el-table-column>
        <el-table-column label="关联业务" min-width="200"><template #default="{ row }"><BusinessReferences :references="row.references" :user-id="row.userId" /></template></el-table-column>
      </el-table>
      <div class="operations-footer"><span class="muted">不同资产不合计；未保存余额及业务关联的历史记录保留原编号。</span><el-pagination v-if="result" :current-page="applied?.page || 1" :page-size="applied?.pageSize || 20" :page-sizes="[20, 50, 100]" :total="result?.total || 0" layout="total, sizes, prev, pager, next" :disabled="loading || !!validation" @current-change="changePage" @size-change="changePageSize" /></div>
    </el-card>
  </div>
</template>
<script setup lang="ts">
import { useRouter } from 'vue-router'
import UserSelect from '@/components/users/UserSelect.vue'
import BusinessReferences from '@/components/credits/BusinessReferences.vue'
import { getPointsLedger } from '@/api/pointsOperations'
import { usePointsOperations } from '@/composables/usePointsOperations'
import { creditReasons, creditTypes } from '@/utils/creditLabels'
const router = useRouter()
const { filters, dates, applied, result, loading, error, validation, numericUserId, setUser, search, reset, changePage, changePageSize, quickRange, retry } = usePointsOperations('ledger', getPointsLedger)
const typeLabels = { ...creditTypes, MINIAPP: '小程序任务与兑换', ADMIN_ADJUSTMENT: '奖励积分人工调整', SPEND: '奖励积分消费', CN_REWARD: '国内站奖励', CN_IMPORT: '国内历史积分导入', CN_IMPORT_RECONCILIATION: '国内历史余额调平', PURCHASE: 'AI 点数购买到账', PURCHASE_REFUND: '购买退款回收', PURCHASE_REFUND_REVERSAL: '退款回收撤销' } as Record<string, string>
const number = (value: number) => Number(value).toLocaleString('zh-CN')
const time = (value: string) => new Date(value).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false })
const openAccount = (userId: string) => router.push({ path: '/ops/points-accounts', query: { userId } })
</script>
