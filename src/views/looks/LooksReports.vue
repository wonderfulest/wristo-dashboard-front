<template>
  <div class="looks-reports">
    <ListSearchPanel>
      <div class="list-search-field">
        <span class="list-search-label">举报状态</span>
        <el-select v-model="status" @change="load(1)" aria-label="举报状态" style="width: 180px" :disabled="loading || saving">
          <el-option value="open" label="待处理" />
          <el-option value="resolved" label="已移除内容" />
          <el-option value="dismissed" label="未发现违规" />
          <el-option value="" label="全部" />
        </el-select>
      </div>
      <template #query><el-button type="primary" :disabled="saving" :loading="loading" @click="load(1)">查询</el-button></template>
    </ListSearchPanel>
    <el-alert v-if="error" :title="error" type="error" :closable="false" show-icon />
    <el-table v-loading="loading" :data="items" border empty-text="暂无举报">
      <el-table-column label="操作" width="100" fixed="left">
        <template #default="{ row }"><el-button link type="primary" :disabled="saving" @click="openDetail(row)">查看处理</el-button></template>
      </el-table-column>
      <el-table-column prop="id" label="举报 ID" width="95" />
      <el-table-column label="举报对象" width="160">
        <template #default="{ row }">作品 #{{ row.post_id }}<br v-if="row.comment_id != null" /><span v-if="row.comment_id != null">评论 #{{ row.comment_id }}</span></template>
      </el-table-column>
      <el-table-column label="举报人" min-width="160"><template #default="{ row }">{{ row.reporter_name || '用户' }} (#{{ row.user_id }})</template></el-table-column>
      <el-table-column prop="reason" label="举报原因" min-width="280" />
      <el-table-column label="状态" width="130"><template #default="{ row }"><el-tag :type="row.status === 'open' ? 'warning' : 'info'">{{ statusLabel(row.status) }}</el-tag></template></el-table-column>
      <el-table-column prop="created_at" label="举报时间 (UTC)" width="210" />
      <el-table-column prop="reviewed_by" label="处理人 ID" width="110" />
      <el-table-column prop="reviewed_at" label="处理时间 (UTC)" width="210" />
    </el-table>
    <div class="pagination">
      <el-button :disabled="page <= 1 || loading || saving" @click="load(page - 1)">上一页</el-button>
      <span>第 {{ page }} 页</span>
      <el-button :disabled="!hasMore || loading || saving" @click="load(page + 1)">下一页</el-button>
    </div>
    <el-dialog v-model="visible" title="Looks 举报详情" width="760px" :close-on-click-modal="!saving" :close-on-press-escape="!saving" :show-close="!saving">
      <div v-loading="detailLoading">
        <el-alert v-if="detailError" :title="detailError" type="error" :closable="false" />
        <template v-if="current">
          <el-descriptions :column="1" border>
            <el-descriptions-item label="举报原因">{{ current.reason }}</el-descriptions-item>
            <el-descriptions-item label="举报人">{{ current.reporter_name || '用户' }} (#{{ current.user_id }})</el-descriptions-item>
            <el-descriptions-item label="作品作者">{{ current.author_name || '用户' }} (#{{ current.author_id }})</el-descriptions-item>
            <el-descriptions-item label="作品">#{{ current.post_id }} · 表盘 #{{ current.app_id }} · {{ current.device_name }}</el-descriptions-item>
            <el-descriptions-item label="作品状态">{{ current.post_state || '已不存在' }}</el-descriptions-item>
            <el-descriptions-item label="作品文字"><div class="content-text">{{ current.caption || '无文字' }}</div></el-descriptions-item>
            <template v-if="current.comment_id != null">
              <el-descriptions-item label="被举报评论">#{{ current.comment_id }} · {{ current.comment_author_name }} (#{{ current.comment_author_id }})</el-descriptions-item>
              <el-descriptions-item label="评论状态">{{ current.comment_state || '已不存在' }}</el-descriptions-item>
              <el-descriptions-item label="评论内容"><div class="content-text">{{ current.comment_body || '内容已不存在' }}</div></el-descriptions-item>
            </template>
            <el-descriptions-item label="处理状态">{{ statusLabel(current.status) }}</el-descriptions-item>
            <el-descriptions-item v-if="current.reviewed_by" label="处理记录">管理员 #{{ current.reviewed_by }} · {{ current.reviewed_at }} UTC</el-descriptions-item>
          </el-descriptions>
          <video v-if="current.media_type === 'video' && safeMedia(current.video_url)" :key="current.id" class="media" :src="safeMedia(current.video_url)" :poster="safeMedia(current.image_url)" controls preload="metadata" />
          <img v-else-if="safeMedia(current.image_url)" class="media" :src="safeMedia(current.image_url)" alt="被举报作品" />
        </template>
      </div>
      <template #footer>
        <el-button :disabled="saving" @click="visible = false">关闭</el-button>
        <template v-if="current?.status === 'open'">
          <el-button :disabled="saving || detailLoading" @click="process(false)">未发现违规，关闭举报</el-button>
          <el-button type="danger" :loading="saving" :disabled="detailLoading" @click="process(true)">{{ current.comment_id != null ? '移除评论及回复' : '隐藏作品' }}</el-button>
        </template>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import ListSearchPanel from '@/components/common/ListSearchPanel.vue'
import { listLookReports, getLookReport, dismissLookReport, moderateLookReport, type LookReport } from '@/api/looks'
const status = ref('open')
const items = ref<LookReport[]>([])
const page = ref(1)
const hasMore = ref(false)
const loading = ref(false)
const error = ref('')
const visible = ref(false)
const detailLoading = ref(false)
const detailError = ref('')
const current = ref<LookReport | null>(null)
const saving = ref(false)
let detailRevision = 0
const statusLabel = (value: string) => ({ open: '待处理', resolved: '已移除内容', dismissed: '未发现违规' }[value] || value)
function safeMedia(value?: string) {
  try { const url = new URL(value || ''); return url.protocol === 'https:' ? url.href : undefined } catch { return undefined }
}
async function load(next = 1) {
  if (loading.value) return
  loading.value = true; error.value = ''
  try {
    const result = await listLookReports(next, status.value)
    if (!result.data) throw new Error('Missing report page')
    items.value = result.data.items; page.value = result.data.page; hasMore.value = result.data.hasMore
  } catch { error.value = '举报列表加载失败，请重试。' }
  finally { loading.value = false }
}
async function openDetail(row: LookReport) {
  const revision = ++detailRevision
  visible.value = true; current.value = null; detailError.value = ''; detailLoading.value = true
  try {
    const result = await getLookReport(row.id)
    if (!result.data) throw new Error('Missing report detail')
    if (revision === detailRevision) current.value = result.data
  } catch { if (revision === detailRevision) detailError.value = '举报详情加载失败，请关闭后重试。' }
  finally { if (revision === detailRevision) detailLoading.value = false }
}
async function process(remove: boolean) {
  if (!current.value || saving.value) return
  const report = current.value
  saving.value = true
  try {
    await ElMessageBox.confirm(remove
      ? (report.comment_id != null ? '将隐藏该评论及全部回复，并处理对应待处理举报。是否继续？' : '将隐藏整条作品，并处理该作品的全部待处理举报。是否继续？')
      : '确认未发现违规？内容将保留，举报会记录为已处理。', '处理举报', { type: remove ? 'warning' : 'info', confirmButtonText: '确认', cancelButtonText: '取消' })
    if (remove) await moderateLookReport(report)
    else await dismissLookReport(report.id)
    ElMessage.success('举报已处理')
    visible.value = false
    await load(page.value)
  } catch (err) {
    if (err !== 'cancel' && err !== 'close') { detailError.value = '处理失败，可能已由其他管理员处理，请重新加载详情。' }
  } finally { saving.value = false }
}
watch(visible, value => { if (!value) { ++detailRevision; current.value = null; detailLoading.value = false } })
onMounted(() => load())
</script>

<style scoped>
.looks-reports { padding: 20px; }
.pagination { display: flex; align-items: center; justify-content: flex-end; gap: 12px; margin-top: 16px; }
.media { display: block; max-width: 100%; max-height: 420px; margin: 16px auto 0; }
.content-text { white-space: pre-wrap; overflow-wrap: anywhere; }
</style>
