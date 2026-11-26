<template>
  <section class="applications">
    <MembershipSimulation />
    <h2>推广员申请审核</h2>
    <el-radio-group v-model="status" aria-label="审核状态" @change="changeStatus">
      <el-radio-button v-for="(label, value) in labels" :key="value" :value="value">{{ label }}</el-radio-button>
    </el-radio-group>
    <el-alert v-if="failed" type="error" :closable="false">
      加载申请失败 <el-button link @click="load">重试</el-button>
    </el-alert>
    <el-table v-else v-loading="loading" :data="records" empty-text="暂无申请">
      <el-table-column prop="id" label="申请编号" width="110" />
      <el-table-column prop="userId" label="用户 ID" width="110" />
      <el-table-column prop="email" label="邮箱" min-width="200" />
      <el-table-column prop="createdAt" label="申请时间" min-width="180" />
      <el-table-column label="审核状态" width="110">
        <template #default="{ row }">{{ labels[(row as PromoterApplication).status] }}</template>
      </el-table-column>
      <el-table-column prop="reason" label="审核说明" min-width="160" />
      <el-table-column v-if="status === 'pending'" label="操作" width="150">
        <template #default="{ row }">
          <el-button type="primary" link @click="openReview(row, true)">通过</el-button>
          <el-button type="danger" link @click="openReview(row, false)">驳回</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination
      v-if="!failed" v-model:current-page="page" :page-size="pageSize" :total="total"
      layout="total, prev, pager, next" @current-change="load"
    />
    <el-dialog v-model="visible" :title="approved ? '通过推广员申请' : '驳回推广员申请'" width="440px"
      :show-close="!saving" :close-on-click-modal="!saving" :close-on-press-escape="!saving">
      <p>申请人 {{ selected?.email || selected?.userId }}</p>
      <el-input v-if="!approved" v-model="reason" type="textarea" maxlength="500" show-word-limit aria-label="驳回原因" placeholder="请输入驳回原因" />
      <template #footer>
        <el-button :disabled="saving" @click="visible = false">取消</el-button>
        <el-button :type="approved ? 'primary' : 'danger'" :loading="saving"
          :disabled="!approved && !reason.trim()" @click="submit">
          {{ approved ? '确认通过' : '确认驳回' }}
        </el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import MembershipSimulation from './MembershipSimulation.vue'
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getApplications, reviewApplication, type PromoterApplication, type ReviewStatus } from '@/api/promoter-applications'

const labels: Record<ReviewStatus, string> = { pending: '待审核', approved: '已通过', rejected: '已驳回' }
const pageSize = 20
const status = ref<ReviewStatus>('pending')
const page = ref(1)
const records = ref<PromoterApplication[]>([])
const total = ref(0)
const loading = ref(false)
const failed = ref(false)
const visible = ref(false)
const saving = ref(false)
const selected = ref<PromoterApplication>()
const approved = ref(false)
const reason = ref('')
let latestRequest = 0

async function load() {
  const request = ++latestRequest
  loading.value = true
  failed.value = false
  records.value = []
  try {
    const { data } = await getApplications(page.value, pageSize, status.value)
    if (request !== latestRequest) return
    if (!data) throw new Error('缺少申请列表')
    total.value = data.total
    records.value = data.records
  } catch {
    if (request === latestRequest) failed.value = true
  } finally {
    if (request === latestRequest) loading.value = false
  }
}

function changeStatus() {
  page.value = 1
  load()
}

function openReview(row: PromoterApplication, decision: boolean) {
  selected.value = row
  approved.value = decision
  reason.value = ''
  visible.value = true
}

async function submit() {
  if (!selected.value || saving.value || (!approved.value && !reason.value.trim())) return
  saving.value = true
  try {
    await reviewApplication(selected.value.id, approved.value, reason.value.trim())
    ElMessage.success(approved.value ? '已通过申请' : '已驳回申请')
    visible.value = false
    if (page.value > 1 && records.value.length === 1) page.value--
    await load()
  } catch {
    // The shared API client displays the server's error and the dialog stays open for retry.
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.applications { display: grid; gap: 16px; }
.applications h2 { margin: 0; }
</style>
