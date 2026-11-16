<template>
  <div class="diagnostics-page">
    <h2>用户错误日志上传</h2>
    <p>统一收集 iOS App 与微信小程序用户主动上传的错误日志、接口请求、安装与蓝牙诊断信息，保留30天。时间为 UTC。</p>
    <ListSearchPanel>
        <el-form label-position="top" class="list-search-form" inline @submit.prevent="search">
      <el-form-item label="反馈编号"><el-input v-model="reportNo" placeholder="粘贴 WR- 开头的完整编号" clearable style="width: 380px" /></el-form-item>
      <el-form-item label="来源"><el-select v-model="platform" style="width: 160px"><el-option label="全部来源" value="" /><el-option label="iOS App" value="ios" /><el-option label="微信小程序" value="miniapp" /></el-select></el-form-item>
      <el-form-item label="用户 ID"><el-input v-model="userId" placeholder="输入用户 ID" clearable style="width: 180px" /></el-form-item>
      <el-button type="primary" :loading="loading" @click="search">查询</el-button>
    </el-form>
      </ListSearchPanel>
    <el-alert v-if="error" :title="error" type="error" :closable="false" show-icon />
    <el-table :data="rows" v-loading="loading" border>
      <TableActionColumn><template #default="{ row }"><el-button link type="primary" @click="open(row.reportNo)">查看报告</el-button></template></TableActionColumn>

      <el-table-column prop="reportNo" label="反馈编号" min-width="310" />
      <el-table-column label="来源" width="130"><template #default="{ row }">{{ row.platform === 'ios' ? 'iOS App' : '微信小程序' }}</template></el-table-column>
      <el-table-column prop="userId" label="用户 ID" width="110" />
      <el-table-column prop="description" label="问题描述" min-width="250" show-overflow-tooltip />
      <el-table-column prop="createdAt" label="提交时间（UTC）" width="210" />
    </el-table>
    <div class="paging"><el-button :disabled="page === 1 || loading" @click="changePage(-1)">上一页</el-button><span>第 {{ page }} 页</span><el-button :disabled="!hasNext || loading" @click="changePage(1)">下一页</el-button></div>
    <el-dialog v-model="visible" title="用户错误日志详情" width="min(1000px, 94vw)">
      <div v-loading="detailLoading">
        <template v-if="detail">
          <p><strong>{{ detail.reportNo }}</strong> · 用户 {{ detail.userId }} · {{ detail.createdAt }} UTC</p>
          <p class="description">{{ detail.description }}</p>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="上传来源">{{ parsed.sessions?.[0]?.kind === 'ios' ? 'iOS App' : '微信小程序' }}</el-descriptions-item>
            <el-descriptions-item v-for="(value, key) in environment" :key="key" :label="String(key)">{{ value }}</el-descriptions-item>
          </el-descriptions>
          <h3>运行事件（按发生时间）</h3>
          <el-table :data="events" max-height="460" border empty-text="没有运行事件">
            <el-table-column prop="time" label="时间（UTC）" width="210" />
            <el-table-column prop="kind" label="会话" width="110" />
            <el-table-column prop="name" label="事件" min-width="180" />
            <el-table-column label="详情" min-width="360"><template #default="{ row }"><span class="event-data">{{ row.data }}</span></template></el-table-column>
          </el-table>
          <el-collapse class="raw-report"><el-collapse-item title="完整诊断日志" name="raw"><pre>{{ formatted }}</pre></el-collapse-item></el-collapse>
        </template>
      </div>
    </el-dialog>
  </div>
</template>
<script setup lang="ts">
import ListSearchPanel from '@/components/common/ListSearchPanel.vue'
import TableActionColumn from '@/components/common/TableActionColumn.vue'
import { computed, onMounted, ref } from 'vue'
import instance from '@/config/axios'
import type { ApiResponse } from '@/types/api'
import { diagnosticEvents } from './diagnosticEvents.mjs'
interface Summary { reportNo: string; userId: number; description: string; createdAt: string; platform: string }
interface Detail extends Summary { diagnostics: string }
const platform = ref(''), userId = ref('')
const reportNo = ref(''), page = ref(1), rows = ref<Summary[]>([]), hasNext = ref(false), loading = ref(false), error = ref('')
const visible = ref(false), detailLoading = ref(false), detail = ref<Detail | null>(null)
let listRun = 0, detailRun = 0
const parsed = computed(() => {
  try { const value = JSON.parse(detail.value?.diagnostics || '{}'); return value && typeof value === 'object' ? value : {} } catch { return {} }
})
const environment = computed(() => parsed.value.environment && typeof parsed.value.environment === 'object' ? parsed.value.environment : {})
const events = computed(() => diagnosticEvents(parsed.value))
const formatted = computed(() => { try { return JSON.stringify(JSON.parse(detail.value?.diagnostics || '{}'), null, 2) } catch { return detail.value?.diagnostics || '' } })
async function load() {
  const run = ++listRun; loading.value = true; error.value = ''
  try {
    const result = await instance.get<never, ApiResponse<Summary[]>>('/admin/diagnostics', { params: { reportNo: reportNo.value.trim(), page: page.value, platform: platform.value, userId: userId.value.trim() || undefined } })
    if (run !== listRun) return
    if (!Array.isArray(result.data)) throw new Error('Invalid response')
    rows.value = result.data.slice(0, 20); hasNext.value = result.data.length > 20
  } catch { if (run === listRun) { rows.value = []; hasNext.value = false; error.value = '查询失败，请重试。' } }
  finally { if (run === listRun) loading.value = false }
}
function search() {
  if (userId.value.trim() && !/^[1-9]\d*$/.test(userId.value.trim())) { error.value = '请输入有效的用户 ID'; return }
  page.value = 1; void load()
}
function changePage(delta: number) { page.value += delta; void load() }
async function open(number: string) {
  const run = ++detailRun; visible.value = true; detail.value = null; detailLoading.value = true
  try {
    const result = await instance.get<never, ApiResponse<Detail>>(`/admin/diagnostics/${encodeURIComponent(number)}`)
    if (!result.data) throw new Error('Invalid response')
    if (run === detailRun) detail.value = result.data
  } catch { if (run === detailRun) { visible.value = false; error.value = '无法读取报告，报告可能已过期。' } }
  finally { if (run === detailRun) detailLoading.value = false }
}
onMounted(load)
</script>
<style scoped>
.diagnostics-page { padding: 24px; }
.paging { display: flex; gap: 16px; align-items: center; margin-top: 20px; }
.event-data { white-space: pre-wrap; overflow-wrap: anywhere; font-family: monospace; }
.raw-report { margin-top: 20px; }
.description { white-space: pre-wrap; overflow-wrap: anywhere; }
pre { padding: 16px; border-radius: 8px; background: var(--el-fill-color-light); max-height: 60vh; overflow: auto; white-space: pre-wrap; overflow-wrap: anywhere; font-size: 12px; }
</style>
