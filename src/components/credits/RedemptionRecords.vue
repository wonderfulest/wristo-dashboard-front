<template>
  <div class="operations-page redemption-records">
    <el-alert title="小程序记录保留兑换时的商品名称与积分；国内桥接记录仅证明已扣点，不代表权益发放完成。" type="info" :closable="false" show-icon />
    <el-card shadow="never">
      <el-form inline @submit.prevent="search">
        <el-form-item label="日期"><el-date-picker v-model="dates" type="daterange" value-format="YYYY-MM-DD" :clearable="false" start-placeholder="开始日期" end-placeholder="结束日期" /></el-form-item>
        <el-form-item label="用户"><UserSelect :model-value="numericUserId" placeholder="搜索用户名或邮箱" @update:model-value="setUser" /></el-form-item>
        <el-form-item label="来源"><el-select v-model="filters.source" clearable placeholder="全部来源"><el-option label="小程序" value="MINIAPP" /><el-option label="国内站桥接" value="CN_BRIDGE" /></el-select></el-form-item>
        <el-form-item label="兑换类型"><el-select v-model="filters.kind" clearable placeholder="全部类型"><el-option label="表盘" value="WATCHFACE" /><el-option label="资源" value="RESOURCE" /></el-select></el-form-item>
        <el-form-item label="关键词"><el-input v-model="filters.keyword" clearable maxlength="100" placeholder="兑换编号或名称" /></el-form-item>
        <el-form-item label="兑换编号"><el-input v-model="filters.id" clearable maxlength="35" placeholder="精确匹配兑换编号" /></el-form-item>
        <el-form-item><el-button type="primary" native-type="submit" :loading="loading">查询</el-button><el-button @click="reset">重置</el-button></el-form-item>
      </el-form>
      <div class="operations-hint"><el-button size="small" @click="quickRange(1)">今天</el-button><el-button size="small" @click="quickRange(7)">近 7 天</el-button><el-button size="small" @click="quickRange(30)">近 30 天</el-button><span>北京时间，含结束日期；每次最多 366 天。</span></div>
      <el-alert v-if="validation" :title="validation" type="warning" :closable="false" show-icon />
    </el-card>
    <el-alert v-if="error" :title="error" type="error" :closable="false" show-icon><el-button link type="primary" @click="retry">重试当前查询</el-button></el-alert>
    <el-card shadow="never">
      <div class="operations-heading"><strong>兑换记录 · {{ result ? result.total.toLocaleString('zh-CN') : '—' }} 条</strong><span v-if="applied" class="muted">{{ applied.from }} 至 {{ applied.to }}<template v-if="applied.userId"> · 用户 {{ applied.userId }}</template></span></div>
      <el-table :data="result?.items || []" v-loading="loading" :row-key="rowKey" :empty-text="error || validation ? '查询未完成，请处理提示后重试' : '所选条件下暂无兑换记录'">
        <el-table-column label="时间 / 编号" min-width="215"><template #default="{ row }">{{ time(row.createdAt) }}<div class="event-key">{{ row.id }}</div></template></el-table-column>
        <el-table-column label="用户" min-width="180"><template #default="{ row }"><el-button link type="primary" @click="$router.push({ path: '/ops/points-accounts', query: { userId: row.userId } })">{{ row.username || `用户 ${row.userId}` }}</el-button><div class="muted">{{ row.email || '邮箱未记录' }} · {{ row.userId }}</div></template></el-table-column>
        <el-table-column label="兑换内容" min-width="200"><template #default="{ row }"><strong>{{ row.name }}</strong><div class="muted">{{ row.kind === 'WATCHFACE' ? '表盘' : '资源' }}<template v-if="row.appId"> · 应用 {{ row.appId }}</template></div></template></el-table-column>
        <el-table-column label="消耗奖励积分" width="135" align="right"><template #default="{ row }">{{ Number(row.points).toLocaleString('zh-CN') }}</template></el-table-column>
        <el-table-column label="来源 / 状态" min-width="170"><template #default="{ row }"><div>{{ row.source === 'MINIAPP' ? '小程序' : '国内站桥接' }}</div><el-tag :type="row.status === 'COMPLETED' ? 'success' : 'warning'" size="small">{{ row.status === 'COMPLETED' ? '已完成兑换' : '已记录扣点' }}</el-tag><div v-if="!row.detailAvailable" class="muted">未保存完整兑换详情</div></template></el-table-column>
        <el-table-column label="关联业务" min-width="200"><template #default="{ row }"><BusinessReferences :references="row.references" :user-id="row.userId" /><el-button v-if="row.eventKey" link type="primary" @click="$router.push({ path: '/ops/points-ledger', query: redemptionLedgerQuery(row) })">对应扣点流水</el-button></template></el-table-column>
      </el-table>
      <div class="operations-footer"><span class="muted">兑换额度显示历史实际值，不受当前兑换规则修改影响。</span><el-pagination v-if="result" :current-page="applied?.page || 1" :page-size="applied?.pageSize || 20" :page-sizes="[20, 50, 100]" :total="result?.total || 0" layout="total, sizes, prev, pager, next" :disabled="loading || !!validation" @current-change="changePage" @size-change="changePageSize" /></div>
    </el-card>
  </div>
</template>
<script setup lang="ts">
import UserSelect from '@/components/users/UserSelect.vue'
import BusinessReferences from './BusinessReferences.vue'
import { getPointsRedemptions, type RedemptionEntry } from '@/api/pointsOperations'
import { usePointsOperations } from '@/composables/usePointsOperations'
import { redemptionLedgerQuery } from '@/utils/pointsOperationsQuery'
const { filters, dates, applied, result, loading, error, validation, numericUserId, setUser, search, reset, changePage, changePageSize, quickRange, retry } = usePointsOperations('redemptions', getPointsRedemptions)
const rowKey = (row: RedemptionEntry) => `${row.source}:${row.id}`
const time = (value: string) => new Date(value).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false })
</script>
<style scoped>.redemption-records { display: grid; gap: 16px; }</style>
