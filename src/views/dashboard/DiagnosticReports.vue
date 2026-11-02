<template>
  <div class="diagnostics-page">
    <h2>小程序诊断报告</h2>
    <p>用户主动提交的安装与蓝牙诊断信息，保留30天。时间为 UTC。</p>
    <el-form inline @submit.prevent="search">
      <el-form-item label="反馈编号"><el-input v-model="reportNo" placeholder="粘贴 WR- 开头的完整编号" clearable style="width: 380px" /></el-form-item>
      <el-button type="primary" :loading="loading" @click="search">查询</el-button>
    </el-form>
    <el-alert v-if="error" :title="error" type="error" :closable="false" show-icon />
    <el-table :data="rows" v-loading="loading" border>
      <el-table-column prop="reportNo" label="反馈编号" min-width="310" />
      <el-table-column prop="userId" label="用户 ID" width="110" />
      <el-table-column prop="description" label="问题描述" min-width="250" show-overflow-tooltip />
      <el-table-column prop="createdAt" label="提交时间（UTC）" width="210" />
      <el-table-column label="操作" width="100"><template #default="{ row }"><el-button link type="primary" @click="open(row.reportNo)">查看报告</el-button></template></el-table-column>
    </el-table>
    <div class="paging"><el-button :disabled="page === 1 || loading" @click="changePage(-1)">上一页</el-button><span>第 {{ page }} 页</span><el-button :disabled="!hasNext || loading" @click="changePage(1)">下一页</el-button></div>
    <el-dialog v-model="visible" title="诊断报告" width="min(1000px, 94vw)">
      <div v-loading="detailLoading">
        <template v-if="detail">
          <p><strong>{{ detail.reportNo }}</strong> · 用户 {{ detail.userId }} · {{ detail.createdAt }} UTC</p>
          <p class="description">{{ detail.description }}</p>
          <pre>{{ formatted }}</pre>
        </template>
      </div>
    </el-dialog>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import instance from '@/config/axios'
import type { ApiResponse } from '@/types/api'
interface Summary { reportNo: string; userId: number; description: string; createdAt: string }
interface Detail extends Summary { diagnostics: string }
const reportNo = ref(''), page = ref(1), rows = ref<Summary[]>([]), hasNext = ref(false), loading = ref(false), error = ref('')
const visible = ref(false), detailLoading = ref(false), detail = ref<Detail | null>(null)
let listRun = 0, detailRun = 0
const formatted = computed(() => { try { return JSON.stringify(JSON.parse(detail.value?.diagnostics || '{}'), null, 2) } catch { return detail.value?.diagnostics || '' } })
async function load() {
  const run = ++listRun; loading.value = true; error.value = ''
  try {
    const result = await instance.get<never, ApiResponse<Summary[]>>('/admin/diagnostics', { params: { reportNo: reportNo.value.trim(), page: page.value } })
    if (run !== listRun) return
    if (!Array.isArray(result.data)) throw new Error('Invalid response')
    rows.value = result.data.slice(0, 20); hasNext.value = result.data.length > 20
  } catch { if (run === listRun) { rows.value = []; hasNext.value = false; error.value = '查询失败，请重试。' } }
  finally { if (run === listRun) loading.value = false }
}
function search() { page.value = 1; void load() }
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
.description { white-space: pre-wrap; overflow-wrap: anywhere; }
pre { padding: 16px; border-radius: 8px; background: var(--el-fill-color-light); max-height: 60vh; overflow: auto; white-space: pre-wrap; overflow-wrap: anywhere; font-size: 12px; }
</style>
