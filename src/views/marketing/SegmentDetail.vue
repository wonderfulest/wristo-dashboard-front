<template>
  <div class="segment-detail" v-loading="loading">
    <div class="page-header">
      <el-button @click="$router.push('/marketing/segments')">返回客群列表</el-button>
      <el-button v-if="segment" type="primary" :loading="refreshing" :disabled="loading" @click="refreshMembers">刷新客群</el-button>
    </div>

    <el-result v-if="error" icon="error" title="无法加载客群" :sub-title="error">
      <template #extra><el-button @click="loadSegment">重试</el-button></template>
    </el-result>
    <template v-else-if="segment">
      <el-card shadow="never">
        <div class="summary">
          <div>
            <h2>{{ segment.name }}</h2>
            <p>{{ segment.description || '暂无描述' }}</p>
            <el-tag :type="segment.status === 1 ? 'success' : 'info'">{{ segment.status === 1 ? '启用' : '停用' }}</el-tag>
          </div>
          <el-statistic title="客群用户总数" :value="segmentTotal" />
        </div>
        <p class="hint">成员基于最近一次客群刷新结果，已删除用户不计入。客群更新时间：{{ formatDateTime(segment.updatedAt) }}</p>
      </el-card>

      <el-card shadow="never">
        <form class="filters" @submit.prevent="searchMembers">
          <el-input v-model="keyword" placeholder="搜索用户 ID、用户名、昵称或邮箱" clearable :maxlength="200" @clear="searchMembers" />
          <el-button type="primary" native-type="submit" :disabled="refreshing">搜索</el-button>
          <el-button :disabled="refreshing" @click="resetSearch">重置</el-button>
        </form>
        <p class="hint">{{ appliedKeyword ? '匹配用户' : '全部用户' }}：{{ total }} 人</p>
        <el-alert v-if="membersError" :title="membersError" type="error" :closable="false" show-icon>
          <el-button link type="primary" @click="fetchMembers">重试</el-button>
        </el-alert>
        <el-table v-else v-loading="membersLoading" :data="members" :empty-text="appliedKeyword ? '没有匹配的用户' : '该客群暂无用户'">
          <el-table-column prop="userId" label="用户 ID" min-width="160" />
          <el-table-column prop="username" label="用户名" min-width="150">
            <template #default="{ row }">{{ row.username || '—' }}</template>
          </el-table-column>
          <el-table-column prop="nickname" label="昵称" min-width="140">
            <template #default="{ row }">{{ row.nickname || '—' }}</template>
          </el-table-column>
          <el-table-column prop="email" label="邮箱" min-width="220">
            <template #default="{ row }">{{ row.email || '—' }}</template>
          </el-table-column>
          <el-table-column prop="createdAt" label="注册时间" min-width="180">
            <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
          </el-table-column>
        </el-table>
        <el-pagination
          class="pagination" background layout="total, sizes, prev, pager, next, jumper"
          :current-page="pageNum" :page-size="pageSize" :total="total"
          :page-sizes="[10, 20, 50, 100]" :disabled="refreshing"
          @current-change="changePage" @size-change="changeSize"
        />
      </el-card>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getSegment, pageSegmentMembers, refreshSegment, type SegmentVO, type SegmentMemberVO } from '@/api/segment'
import { formatDateTime } from '@/utils/date'

const route = useRoute()
const segment = ref<SegmentVO | null>(null)
const members = ref<SegmentMemberVO[]>([])
const segmentTotal = ref(0)
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(20)
const keyword = ref('')
const appliedKeyword = ref('')
const loading = ref(false)
const membersLoading = ref(false)
const refreshing = ref(false)
const error = ref('')
const membersError = ref('')
let segmentRequest = 0
let memberRequest = 0

async function fetchMembers() {
  if (!segment.value) return
  const request = ++memberRequest
  const id = segment.value.id
  membersLoading.value = true
  membersError.value = ''
  try {
    const res = await pageSegmentMembers(id, { pageNum: pageNum.value, pageSize: pageSize.value, keyword: appliedKeyword.value || undefined })
    if (request !== memberRequest) return
    if (res.code !== 0 || !res.data) throw new Error(res.msg || '获取客群用户失败')
    members.value = res.data.list
    total.value = res.data.total
    segmentTotal.value = Number(res.data.meta?.segmentTotal ?? res.data.total)
  } catch {
    if (request !== memberRequest) return
    members.value = []
    total.value = 0
    membersError.value = '获取客群用户失败，请重试'
  } finally {
    if (request === memberRequest) membersLoading.value = false
  }
}

async function loadSegment() {
  const request = ++segmentRequest
  ++memberRequest
  segment.value = null
  members.value = []
  segmentTotal.value = 0
  total.value = 0
  error.value = ''
  loading.value = true
  const id = Number(route.params.id)
  try {
    if (!Number.isSafeInteger(id) || id <= 0) throw new Error('客群 ID 无效')
    const res = await getSegment(id)
    if (request !== segmentRequest) return
    if (res.code !== 0 || !res.data) throw new Error('客群不存在或已被删除')
    segment.value = res.data
    await fetchMembers()
  } catch (e) {
    if (request === segmentRequest) error.value = e instanceof Error ? e.message : '获取客群失败，请重试'
  } finally {
    if (request === segmentRequest) loading.value = false
  }
}

function searchMembers() {
  appliedKeyword.value = keyword.value.trim()
  pageNum.value = 1
  void fetchMembers()
}
function resetSearch() {
  keyword.value = ''
  searchMembers()
}
function changePage(page: number) {
  pageNum.value = page
  void fetchMembers()
}
function changeSize(size: number) {
  pageSize.value = size
  pageNum.value = 1
  void fetchMembers()
}
async function refreshMembers() {
  if (!segment.value) return
  const id = segment.value.id
  const request = segmentRequest
  refreshing.value = true
  try {
    await refreshSegment(id)
    if (request !== segmentRequest) return
    ElMessage.success('客群已刷新')
    pageNum.value = 1
    await loadSegment()
  } catch {
    // The shared request interceptor displays the server error.
  } finally {
    refreshing.value = false
  }
}

watch(() => route.params.id, () => {
  keyword.value = ''
  appliedKeyword.value = ''
  pageNum.value = 1
  void loadSegment()
}, { immediate: true })
onBeforeUnmount(() => { ++segmentRequest; ++memberRequest })
</script>

<style scoped>
.segment-detail { padding: 20px; display: flex; flex-direction: column; gap: 20px; }
.page-header, .summary { display: flex; justify-content: space-between; align-items: center; gap: 20px; }
h2 { margin: 0 0 12px; }
.hint { color: var(--el-text-color-secondary); font-size: 13px; }
.filters { display: flex; gap: 12px; flex-wrap: wrap; }
.filters .el-input { width: 360px; max-width: 100%; }
.pagination { margin-top: 20px; overflow-x: auto; }
@media (max-width: 600px) { .summary { align-items: flex-start; flex-direction: column; } }
</style>
