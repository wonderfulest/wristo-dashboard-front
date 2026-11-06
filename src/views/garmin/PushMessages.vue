<template>
  <div class="push-messages">
    <div class="heading"><div><h2>佳明推送消息</h2><p>查看 Garmin Connect 推送的接收记录和处理状态</p></div><el-button :loading="loading" @click="load">刷新</el-button></div>
    <el-alert title="记录保留 7 天；处理成功后原文自动清理。历史记录可能没有消息摘要，按类型筛选时不会包含这些记录。相同报文重试会去重。" type="info" :closable="false" show-icon />
    <el-card class="content" shadow="never">
      <el-form inline @submit.prevent="search">
        <el-form-item label="处理状态"><el-select v-model="status" clearable placeholder="全部状态" style="width: 150px"><el-option v-for="(label, key) in statuses" :key="key" :label="label" :value="key" /></el-select></el-form-item>
        <el-form-item label="消息类型"><el-select v-model="type" filterable clearable placeholder="全部类型" style="width: 230px"><el-option v-for="item in types" :key="item" :label="item" :value="item" /></el-select></el-form-item>
        <el-form-item label="接收时间"><el-date-picker v-model="range" type="datetimerange" start-placeholder="开始时间" end-placeholder="结束时间" /></el-form-item>
        <el-form-item><el-button type="primary" native-type="submit">查询</el-button><el-button @click="reset">重置</el-button></el-form-item>
      </el-form>
      <el-alert v-if="error" :title="error" type="error" :closable="false" />
      <el-table v-loading="loading" :data="rows" empty-text="暂无符合条件的推送消息">
        <el-table-column prop="id" label="ID" width="95" />
        <el-table-column label="接收时间" min-width="175"><template #default="{ row }">{{ date(row.receivedAt) }}</template></el-table-column>
        <el-table-column label="消息摘要" min-width="280"><template #default="{ row }"><span v-if="row.summary === null">摘要未记录</span><span v-else-if="!Object.keys(row.summary).length">无已知消息类型</span><el-tag v-for="(count, kind) in row.summary" :key="kind" class="summary">{{ kind }} · {{ count }} 条</el-tag></template></el-table-column>
        <el-table-column label="状态" width="110"><template #default="{ row }"><el-tag :type="row.status === 'DONE' ? 'success' : row.status === 'FAILED' ? 'danger' : 'warning'">{{ statuses[row.status] || row.status }}</el-tag></template></el-table-column>
        <el-table-column prop="attempts" label="延后重试次数" width="125" />
        <el-table-column label="原文" width="100"><template #default="{ row }">{{ row.payloadAvailable ? '可查看' : '已清理' }}</template></el-table-column>
        <el-table-column label="操作" width="90"><template #default="{ row }"><el-button link type="primary" @click="open(row.id)">详情</el-button></template></el-table-column>
      </el-table>
      <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[20, 50, 100]" layout="total, sizes, prev, pager, next" @current-change="load" @size-change="search" />
    </el-card>
    <el-drawer v-model="drawer" title="推送消息详情" size="65%">
      <div v-loading="detailLoading">
        <el-alert v-if="detailError" :title="detailError" type="error" :closable="false" />
        <template v-if="detail">
          <el-descriptions :column="1" border>
            <el-descriptions-item label="消息 ID">{{ detail.message.id }}</el-descriptions-item>
            <el-descriptions-item label="接收时间">{{ date(detail.message.receivedAt) }}</el-descriptions-item>
            <el-descriptions-item label="处理状态">{{ statuses[detail.message.status] || detail.message.status }}</el-descriptions-item>
            <el-descriptions-item label="延后重试次数">{{ detail.message.attempts }}</el-descriptions-item>
            <el-descriptions-item v-if="detail.message.status === 'PENDING'" label="下次可处理时间">{{ date(detail.message.availableAt) }}</el-descriptions-item>
          </el-descriptions>
          <h3>消息摘要</h3><pre>{{ detail.message.summary === null ? '摘要未记录' : JSON.stringify(detail.message.summary, null, 2) }}</pre>
          <h3>原始消息</h3>
          <pre v-if="detail.payloadState === 'AVAILABLE'">{{ pretty(detail.payload) }}</pre>
          <el-alert v-else :title="detail.payloadState === 'CLEARED' ? '原文已清理，无法恢复' : '原文暂时无法解密，请检查服务端配置'" :type="detail.payloadState === 'CLEARED' ? 'info' : 'error'" :closable="false" />
        </template>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getGarminPush, pageGarminPush, type GarminPushDetail, type GarminPushMessage } from '@/api/garmin-push'

const statuses: Record<string, string> = { PENDING: '待处理', DONE: '已处理', FAILED: '处理失败' }
const types = ['activities', 'activityDetails', 'manuallyUpdatedActivities', 'moveIQActivities', 'dailies', 'epochs', 'sleeps', 'bodyComps', 'stressDetails', 'userMetrics', 'pulseox', 'allDayRespiration', 'healthSnapshot', 'hrv', 'bloodPressures', 'skinTemp', 'nutrition', 'hydration', 'breathingVariations', 'deregistrations', 'userPermissionsChange']
const rows = ref<GarminPushMessage[]>([])
const status = ref('')
const type = ref('')
const range = ref<[Date, Date] | null>(null)
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const loading = ref(false)
const error = ref('')
const drawer = ref(false)
const detail = ref<GarminPushDetail | null>(null)
const detailLoading = ref(false)
const detailError = ref('')
let listRequest = 0
let detailRequest = 0
const date = (value: string) => new Date(value).toLocaleString('zh-CN', { hour12: false })
function pretty(value: string | null) {
  try { return JSON.stringify(JSON.parse(value || ''), null, 2) } catch { return value }
}
async function load() {
  const request = ++listRequest
  loading.value = true
  error.value = ''
  try {
    const response = await pageGarminPush({ page: page.value, pageSize: pageSize.value, status: status.value || undefined, type: type.value || undefined, from: range.value?.[0].toISOString(), to: range.value?.[1].toISOString() })
    if (request !== listRequest) return
    if (!response.data) throw new Error("Missing message list")
    rows.value = response.data.list
    total.value = response.data.total
  } catch {
    if (request === listRequest) { rows.value = []; total.value = 0; error.value = '消息加载失败，请重试' }
  } finally { if (request === listRequest) loading.value = false }
}
function search() { page.value = 1; void load() }
function reset() { status.value = ''; type.value = ''; range.value = null; search() }
async function open(id: number) {
  const request = ++detailRequest
  drawer.value = true
  detail.value = null
  detailError.value = ''
  detailLoading.value = true
  try {
    const response = await getGarminPush(id)
    if (!response.data) throw new Error("Missing message detail")
    if (request === detailRequest) detail.value = response.data
  } catch { if (request === detailRequest) detailError.value = '详情加载失败，消息可能已过期清理，请刷新列表' }
  finally { if (request === detailRequest) detailLoading.value = false }
}
onMounted(load)
</script>

<style scoped>
.push-messages { padding: 24px; }
.heading { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
h2 { margin: 0 0 8px; }
.heading p { margin: 0; color: #909399; }
.content { margin-top: 20px; }
.summary { margin: 3px 6px 3px 0; }
.el-pagination { margin-top: 20px; justify-content: flex-end; }
pre { white-space: pre-wrap; overflow-wrap: anywhere; background: #f5f7fa; padding: 16px; border-radius: 6px; max-height: 60vh; overflow: auto; }
</style>
