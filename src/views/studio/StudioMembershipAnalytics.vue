<template>
  <div class="studio-membership-page">
    <div class="page-header">
      <div>
        <h2>Studio 会员</h2>
        <p>按当前权益统计创建过 Studio 应用的用户</p>
      </div>
      <el-button type="primary" :loading="summaryLoading || tableLoading" @click="refreshAll">
        刷新
      </el-button>
    </div>

    <div class="metric-grid">
      <div class="metric-item">
        <span class="metric-label">会员总数</span>
        <strong>{{ totals.memberCount }}</strong>
      </div>
      <div class="metric-item">
        <span class="metric-label">应用总数</span>
        <strong>{{ totals.designCount }}</strong>
      </div>
      <div class="metric-item">
        <span class="metric-label">付费/授权</span>
        <strong>{{ totals.paidMemberCount }}</strong>
      </div>
      <div class="metric-item">
        <span class="metric-label">Free</span>
        <strong>{{ totals.freeMemberCount }}</strong>
      </div>
    </div>

    <el-table :data="summaryRows" v-loading="summaryLoading" class="summary-table" style="width: 100%">
      <el-table-column label="权益" min-width="160">
        <template #default="{ row }">
          <el-tag :type="levelTagType(row.level)" effect="light">{{ levelLabel(row.level) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="roleCode" label="角色编码" min-width="220" />
      <el-table-column prop="memberCount" label="会员人数" width="120" sortable />
      <el-table-column prop="designCount" label="创建应用数" width="130" sortable />
      <el-table-column label="人均应用数" width="130">
        <template #default="{ row }">{{ formatAverage(row.avgDesignCount) }}</template>
      </el-table-column>
      <el-table-column label="创建上限" width="120">
        <template #default="{ row }">{{ row.maxDesigns ?? '不限' }}</template>
      </el-table-column>
    </el-table>

    <div class="section-header">
      <h3>会员列表</h3>
      <span>{{ total }} 人</span>
    </div>

    <div class="filters">
      <el-select v-model="query.level" clearable placeholder="按权益筛选" style="width: 180px" @change="handleSearch">
        <el-option v-for="item in levelOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
      <UserSelect v-model="searchUserId" placeholder="按用户搜索" style="width: 240px" @change="handleUserChange" />
      <el-input
        v-model="query.email"
        clearable
        placeholder="按邮箱搜索"
        style="width: 260px"
        @keyup.enter.native="handleSearch"
        @clear="handleSearch"
      />
      <el-select v-model="query.orderBy" placeholder="排序方式" style="width: 190px" @change="handleSearch">
        <el-option label="注册时间倒序" value="created_at:desc" />
        <el-option label="注册时间升序" value="created_at:asc" />
        <el-option label="应用数倒序" value="design_count:desc" />
        <el-option label="应用数升序" value="design_count:asc" />
        <el-option label="最近登录倒序" value="last_login_time:desc" />
      </el-select>
      <el-button type="primary" @click="handleSearch">查询</el-button>
      <el-button @click="handleReset">重置</el-button>
    </div>

    <el-table :data="members" v-loading="tableLoading" style="width: 100%">
      <el-table-column prop="userId" label="用户ID" width="90" />
      <el-table-column label="用户" min-width="220">
        <template #default="{ row }">
          <div class="user-cell">
            <strong>{{ row.username || '-' }}</strong>
            <span>{{ row.email || '-' }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="权益" width="130">
        <template #default="{ row }">
          <el-tag :type="levelTagType(row.level)" effect="light">{{ levelLabel(row.level) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="来源" width="120">
        <template #default="{ row }">{{ sourceLabel(row.source) }}</template>
      </el-table-column>
      <el-table-column label="订阅状态" min-width="170">
        <template #default="{ row }">
          <div v-if="hasSubscription(row)" class="subscription-status-cell">
            <el-tag :type="subscriptionStatusTagType(row)" effect="plain">
              {{ subscriptionStatusLabel(row) }}
            </el-tag>
            <span v-if="isSubscriptionCancelScheduled(row) && row.scheduledChangeEffectiveAt">
              生效：{{ formatTime(row.scheduledChangeEffectiveAt) }}
            </span>
          </div>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="designCount" label="应用数" width="100" sortable />
      <el-table-column label="创建权限" width="120">
        <template #default="{ row }">
          <el-tag :type="row.canCreateDesign ? 'success' : 'danger'" effect="plain">
            {{ row.canCreateDesign ? '可创建' : '已达上限' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="订阅有效期" min-width="240">
        <template #default="{ row }">
          <span v-if="row.subscriptionStartTime || row.subscriptionEndTime">
            {{ formatTime(row.subscriptionStartTime) || '-' }} 至 {{ formatTime(row.subscriptionEndTime) || '长期' }}
          </span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="注册时间" width="170">
        <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="最近登录" width="170">
        <template #default="{ row }">{{ formatTime(row.lastLoginTime) || '-' }}</template>
      </el-table-column>
    </el-table>

    <div class="pagination">
      <el-pagination
        background
        layout="total, sizes, prev, pager, next, jumper"
        :current-page="query.pageNum"
        :page-size="query.pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchStudioMembershipPage, fetchStudioMembershipSummary } from '@/api/studio-membership'
import UserSelect from '@/components/users/UserSelect.vue'
import { formatDateTime } from '@/utils/date'
import type {
  StudioMembershipLevel,
  StudioMembershipMember,
  StudioMembershipPageQuery,
  StudioMembershipSummaryItem,
} from '@/types/studio-membership'

const levelOptions: Array<{ label: string; value: StudioMembershipLevel }> = [
  { label: 'Free', value: 'free' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Quarterly', value: 'quarterly' },
  { label: 'Semiannual', value: 'semiannual' },
  { label: 'Annual', value: 'annual' },
  { label: 'Premium 30D', value: 'premium_30d' },
]

const summaryRows = ref<StudioMembershipSummaryItem[]>([])
const members = ref<StudioMembershipMember[]>([])
const total = ref(0)
const summaryLoading = ref(false)
const tableLoading = ref(false)
const searchUserId = ref<number | undefined>(undefined)

const query = reactive<StudioMembershipPageQuery>({
  pageNum: 1,
  pageSize: 10,
  orderBy: 'created_at:desc',
})

const totals = computed(() => {
  return summaryRows.value.reduce(
    (acc, row) => {
      acc.memberCount += Number(row.memberCount || 0)
      acc.designCount += Number(row.designCount || 0)
      if (row.level === 'free') {
        acc.freeMemberCount += Number(row.memberCount || 0)
      } else {
        acc.paidMemberCount += Number(row.memberCount || 0)
      }
      return acc
    },
    { memberCount: 0, designCount: 0, paidMemberCount: 0, freeMemberCount: 0 }
  )
})

const levelLabel = (level: StudioMembershipLevel) => {
  return levelOptions.find((item) => item.value === level)?.label || level
}

const levelTagType = (level: StudioMembershipLevel) => {
  if (level === 'free') return 'info'
  if (level === 'annual') return 'success'
  if (level === 'premium_30d') return 'warning'
  return 'primary'
}

const sourceLabel = (source: StudioMembershipMember['source']) => {
  if (source === 'role') return '角色授权'
  if (source === 'subscription') return '订阅'
  return '默认 Free'
}

const hasSubscription = (row: StudioMembershipMember) => {
  return row.source === 'subscription'
    || Boolean(row.subscriptionStartTime || row.subscriptionEndTime || row.scheduledChangeAction || row.scheduledChangeEffectiveAt)
}

const isSubscriptionCancelScheduled = (row: StudioMembershipMember) => {
  return row.cancelScheduled === true || row.scheduledChangeAction?.toLowerCase() === 'cancel'
}

const subscriptionStatusLabel = (row: StudioMembershipMember) => {
  return isSubscriptionCancelScheduled(row) ? '已取消自动订阅' : '正在订阅中'
}

const subscriptionStatusTagType = (row: StudioMembershipMember) => {
  return isSubscriptionCancelScheduled(row) ? 'warning' : 'success'
}

const formatAverage = (value: number) => Number(value || 0).toFixed(2)

const formatTime = (value?: string | null) => (value ? formatDateTime(value) : '')

const fetchSummary = async () => {
  summaryLoading.value = true
  try {
    const res = await fetchStudioMembershipSummary()
    if (res.code === 0 && res.data) {
      summaryRows.value = res.data
    } else {
      ElMessage.error(res.msg || '获取 Studio 会员统计失败')
    }
  } catch {
    ElMessage.error('获取 Studio 会员统计失败')
  } finally {
    summaryLoading.value = false
  }
}

const fetchMembers = async () => {
  tableLoading.value = true
  try {
    const res = await fetchStudioMembershipPage({
      ...query,
      email: query.email || undefined,
      level: query.level || undefined,
      userId: query.userId,
    })
    if (res.code === 0 && res.data) {
      members.value = res.data.list || []
      total.value = res.data.total || 0
    } else {
      ElMessage.error(res.msg || '获取 Studio 会员列表失败')
    }
  } catch {
    ElMessage.error('获取 Studio 会员列表失败')
  } finally {
    tableLoading.value = false
  }
}

const refreshAll = () => {
  fetchSummary()
  fetchMembers()
}

const handleSearch = () => {
  query.pageNum = 1
  fetchMembers()
}

const handleReset = () => {
  searchUserId.value = undefined
  query.pageNum = 1
  query.pageSize = 10
  query.orderBy = 'created_at:desc'
  query.userId = undefined
  query.email = undefined
  query.level = undefined
  fetchMembers()
}

const handleUserChange = (value?: number) => {
  query.userId = value
  handleSearch()
}

const handlePageChange = (page: number) => {
  query.pageNum = page
  fetchMembers()
}

const handleSizeChange = (size: number) => {
  query.pageSize = size
  query.pageNum = 1
  fetchMembers()
}

onMounted(() => {
  refreshAll()
})
</script>

<style scoped>
.studio-membership-page {
  padding: 20px;
}

.page-header,
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.page-header h2,
.section-header h3 {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
}

.page-header p,
.section-header span {
  margin: 6px 0 0;
  color: #6b7280;
  font-size: 13px;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}

.metric-item {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 14px 16px;
  background: #fff;
}

.metric-label {
  display: block;
  color: #6b7280;
  font-size: 13px;
  margin-bottom: 8px;
}

.metric-item strong {
  font-size: 26px;
  line-height: 1;
  color: #111827;
}

.summary-table {
  margin-bottom: 24px;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.user-cell {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.user-cell strong {
  font-weight: 600;
  color: #111827;
}

.user-cell span {
  color: #6b7280;
  font-size: 12px;
}

.subscription-status-cell {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.subscription-status-cell span {
  color: #6b7280;
  font-size: 12px;
  line-height: 1.3;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 18px;
}

@media (max-width: 960px) {
  .metric-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .metric-grid {
    grid-template-columns: 1fr;
  }

  .page-header,
  .section-header {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
