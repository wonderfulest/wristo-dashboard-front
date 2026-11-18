<template>
  <div class="looks-reviews">
    <div class="auto-review-setting">
      <span>超过 24 小时自动审核</span>
      <el-switch v-model="autoReviewEnabled" :disabled="!autoReviewReady" :loading="autoReviewSaving" :before-change="toggleAutoReview" aria-label="自动审核开关" />
      <span v-if="autoReviewError">{{ autoReviewError }}</span>
      <el-button v-if="autoReviewError" link @click="loadAutoReview">重试</el-button>
    </div>
    <ListSearchPanel>
      <div class="list-search-field">
        <span class="list-search-label">内容类型</span>
        <el-select v-model="type" aria-label="内容类型" style="width: 150px" :disabled="saving" @change="load(1)">
          <el-option value="posts" label="作品（图片 / 视频）" /><el-option value="comments" label="评论 / 回复" />
        </el-select>
      </div>
      <div class="list-search-field">
        <span class="list-search-label">审核状态</span>
        <el-select v-model="state" aria-label="审核状态" style="width: 150px" :disabled="saving" @change="load(1)">
          <el-option value="all" label="全部状态" /><el-option value="unlisted" label="已下架 / 隐藏" /><el-option value="hidden" label="举报隐藏" /><el-option value="deleted" label="已删除" />
          <el-option value="pending" label="待审核" /><el-option value="visible" label="已通过" /><el-option value="rejected" label="已拒绝" />
        </el-select>
      </div>
      <div class="list-search-field">
        <span class="list-search-label">审核方式</span>
        <el-select v-model="method" aria-label="审核方式" style="width: 150px" :disabled="saving" @change="changeMethod">
          <el-option value="all" label="全部方式" /><el-option value="auto" label="自动通过" /><el-option value="manual" label="人工审核" />
        </el-select>
      </div>
      <div class="list-search-field">
        <span class="list-search-label">发布者</span>
        <UserSelect v-model="publisherId" placeholder="搜索用户名或邮箱" aria-label="发布者" style="width: 260px" :disabled="saving" @change="load(1)" />
      </div>
      <div class="list-search-field">
        <span class="list-search-label">应用</span>
        <AppSearchSelect v-model="appId" aria-label="应用" width="260px" :disabled="saving" @change="load(1)" />
      </div>
      <template #query><el-button type="primary" :loading="loading" :disabled="saving" @click="load(1)">刷新</el-button></template>
    </ListSearchPanel>
    <p v-if="state === 'pending'">待审核内容按提交时间从早到晚排列，审核通过后才会公开展示。</p>
    <el-alert v-if="error" :title="error" type="error" :closable="false" />
    <div class="batch-actions">
      <span>已选择 {{ selected.length }} 条（仅当前页待审核内容）</span>
      <el-button type="primary" :disabled="!selected.length || loading || saving" @click="decideBatch(true)">批量通过</el-button>
      <el-button type="danger" :disabled="!selected.length || loading || saving" @click="decideBatch(false)">批量拒绝</el-button>
      <span v-if="saving && batchTotal">正在处理 {{ batchCompleted }} / {{ batchTotal }}</span>
    </div>
    <el-alert v-if="batchResult" :type="batchResult.failed.length ? 'warning' : 'success'" :closable="false" class="batch-result">
      <template #title>批量{{ batchResult.approved ? '通过' : '拒绝' }}：成功 {{ batchResult.succeeded }} 条，失败 {{ batchResult.failed.length }} 条</template>
      <p v-if="batchResult.failed.length">失败条目：{{ batchResult.failed.map(id => `#${id}`).join('、') }}。内容可能已变更或请求失败，请刷新并查看当前状态后重试。</p>
    </el-alert>
    <el-table ref="reviewTable" v-loading="loading" :data="items" row-key="id" border empty-text="暂无内容" @selection-change="selectionChanged">
      <TableActionColumn><template #default="{ row }"><el-button link type="primary" :disabled="loading || saving" @click="openDetail(row)">查看审核</el-button></template></TableActionColumn>
      <el-table-column type="selection" width="48" :selectable="canSelect" />
      <el-table-column prop="id" label="ID" width="90" />
      <el-table-column v-if="type === 'posts'" label="图片 / 视频封面" width="150">
        <template #default="{ row }">
          <div v-loading="thumbnails[row.id]?.loading" class="list-preview">
            <img v-if="thumbnails[row.id]?.url" :src="thumbnails[row.id].url" :alt="row.media_type === 'video' ? '视频封面' : '作品图片'" @error="thumbnailFailed(row.id)" />
            <span v-else>{{ thumbnails[row.id]?.loading ? '加载中' : '暂无预览' }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="内容形式" width="110">
        <template #default="{ row }"><el-tag :type="type === 'posts' && row.media_type === 'video' ? 'warning' : 'info'">{{ type === 'comments' ? (row.parent_id != null ? '回复' : '评论') : (row.media_type === 'video' ? '视频' : '图片') }}</el-tag></template>
      </el-table-column>
      <el-table-column label="作者" min-width="160"><template #default="{ row }">{{ row.author_name || '用户' }} (#{{ row.user_id }})</template></el-table-column>
      <el-table-column label="内容" min-width="240" show-overflow-tooltip><template #default="{ row }">{{ row.body || row.caption || '无文字' }}</template></el-table-column>
      <el-table-column label="状态" width="110"><template #default="{ row }">{{ stateLabel(row.state) }}</template></el-table-column>
      <el-table-column prop="created_at" label="提交时间 (UTC)" width="210" />
      <el-table-column label="审核方式" width="110"><template #default="{ row }">{{ methodLabel(row) }}</template></el-table-column>
      <el-table-column prop="reviewed_by" label="审核人 ID" width="110" />
      <el-table-column prop="reviewed_at" label="审核时间 (UTC)" width="210" />
    </el-table>
    <div class="pagination"><el-button :disabled="page <= 1 || loading || saving" @click="load(page - 1)">上一页</el-button><span>第 {{ page }} 页</span><el-button :disabled="!hasMore || loading || saving" @click="load(page + 1)">下一页</el-button></div>
    <el-dialog v-model="visible" title="Looks 内容审核" width="760px" :close-on-click-modal="!saving" :close-on-press-escape="!saving" :show-close="!saving" destroy-on-close>
      <div v-loading="detailLoading">
        <el-alert v-if="detailError" :title="detailError" type="error" :closable="false" />
        <template v-if="current">
          <el-descriptions :column="1" border>
            <el-descriptions-item label="作者">{{ current.author_name || '用户' }} (#{{ current.user_id }})</el-descriptions-item>
            <el-descriptions-item label="作品">#{{ current.post_id || current.id }} · 表盘 #{{ current.app_id || '—' }} · {{ current.device_name || '未提供设备' }}</el-descriptions-item>
            <el-descriptions-item label="作品文字"><div class="content-text">{{ current.post_caption || current.caption || '无文字' }}</div></el-descriptions-item>
            <template v-if="detailType === 'comments'">
              <el-descriptions-item label="作品状态">{{ stateLabel(current.post_state || '未知') }}</el-descriptions-item>
              <el-descriptions-item label="评论内容"><div class="content-text">{{ current.body }}</div></el-descriptions-item>
              <el-descriptions-item v-if="current.parent_id != null" label="回复的评论"><div class="content-text">#{{ current.parent_id }} · {{ current.parent_body || '内容已不存在' }}</div></el-descriptions-item>
            </template>
            <el-descriptions-item label="提交时间">{{ current.created_at }} UTC</el-descriptions-item>
            <el-descriptions-item label="审核状态">{{ stateLabel(current.state) }}</el-descriptions-item>
            <el-descriptions-item label="审核方式">{{ methodLabel(current) }}</el-descriptions-item>
            <el-descriptions-item v-if="current.reviewed_at" label="审核时间">{{ current.reviewed_at }} UTC</el-descriptions-item>
            <el-descriptions-item v-if="current.reviewed_by != null" label="审核记录">管理员 #{{ current.reviewed_by }}</el-descriptions-item>
            <el-descriptions-item v-if="current.review_reason" label="审核说明"><div class="content-text">{{ current.review_reason }}</div></el-descriptions-item>
          </el-descriptions>
          <div v-loading="mediaLoading" class="preview">
            <el-alert v-if="mediaError" :title="mediaError" type="error" :closable="false" />
            <video v-if="videoUrl" :key="videoUrl" class="media" :src="videoUrl" :poster="imageUrl" controls preload="metadata" @error="mediaError = '视频无法播放，请重新打开详情重试。'" />
            <img v-else-if="imageUrl" class="media" :src="imageUrl" alt="待审核作品" @error="mediaError = '图片加载失败，请重新打开详情重试。'" />
          </div>
          <el-input v-if="current.state === 'pending'" v-model="reason" type="textarea" :rows="3" maxlength="500" show-word-limit placeholder="拒绝时必须填写原因（最多 500 字）" aria-label="拒绝原因" :disabled="saving" />
        </template>
      </div>
      <template #footer>
        <el-button :disabled="saving" @click="visible = false">关闭</el-button>
        <el-button v-if="current?.state === 'visible'" :disabled="saving" @click="setVisibility('unlisted')">{{ detailType === 'posts' ? '下架作品' : '隐藏评论' }}</el-button>
        <el-button v-if="current?.state === 'unlisted'" :disabled="saving" @click="setVisibility('visible')">恢复展示</el-button>
        <el-button v-if="current && ['visible','unlisted','hidden','rejected'].includes(current.state)" type="danger" :disabled="saving" @click="setVisibility('deleted')">删除</el-button>
        <template v-if="current?.state === 'pending'">
          <el-button type="danger" :disabled="saving || detailLoading || !reason.trim()" @click="decide(false)">拒绝</el-button>
          <el-button type="primary" :loading="saving" :disabled="detailLoading || mediaLoading || !!mediaError || !!detailError" @click="decide(true)">审核通过</el-button>
        </template>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import UserSelect from '@/components/users/UserSelect.vue'
import AppSearchSelect from '@/components/common/AppSearchSelect.vue'
import ListSearchPanel from '@/components/common/ListSearchPanel.vue'
import TableActionColumn from '@/components/common/TableActionColumn.vue'
import { getLookAutoReview, saveLookAutoReview, changeLookVisibility, type LookReviewMethod, listLookReviews, getLookReview, decideLookReview, getLookReviewMedia, type LookReview, type LookReviewType, type LookReviewState } from '@/api/looks'
const autoReviewEnabled = ref(false), autoReviewReady = ref(false), autoReviewSaving = ref(false), autoReviewError = ref('')
async function loadAutoReview() {
  autoReviewReady.value = false
  try {
    const result = await getLookAutoReview()
    if (typeof result.data?.enabled !== 'boolean') throw new Error()
    autoReviewEnabled.value = result.data.enabled
    autoReviewReady.value = true
    autoReviewError.value = ''
  } catch { autoReviewError.value = '自动审核设置加载失败' }
}
async function toggleAutoReview() {
  if (autoReviewSaving.value) return false
  autoReviewSaving.value = true
  try {
    const target = !autoReviewEnabled.value
    const result = await saveLookAutoReview(target)
    if (result.data?.enabled !== target) throw new Error()
    autoReviewError.value = ''
    ElMessage.success(target ? '自动审核已开启' : '自动审核已关闭')
    return true
  } catch { autoReviewError.value = '保存失败，请重试'; return false }
  finally { autoReviewSaving.value = false }
}
const publisherId = ref<number | undefined>(), appId = ref<number | undefined>()
const type = ref<LookReviewType>('posts'), state = ref<LookReviewState>('pending'), detailType = ref<LookReviewType>('posts')
const items = ref<LookReview[]>([]), current = ref<LookReview | null>(null)
const page = ref(1), hasMore = ref(false), loading = ref(false), saving = ref(false), visible = ref(false)
const reviewTable = ref<{ clearSelection: () => void } | null>(null)
const selected = ref<LookReview[]>([])
const batchTotal = ref(0), batchCompleted = ref(0)
const batchResult = ref<{ approved: boolean; succeeded: number; failed: number[] } | null>(null)
function canSelect(row: LookReview) { return row.state === 'pending' && !loading.value && !saving.value }
function selectionChanged(rows: LookReview[]) { selected.value = rows.filter(row => row.state === 'pending') }
async function decideBatch(approved: boolean) {
  if (saving.value || loading.value || !selected.value.length) return
  const rows = selected.value.filter(row => row.state === 'pending').map(row => ({ ...row }))
  if (!rows.length) return
  const reviewType = type.value
  saving.value = true
  batchTotal.value = 0
  try {
    let rejectionReason = ''
    try {
      if (approved) {
        await ElMessageBox.confirm(`确定通过所选的 ${rows.length} 条内容？通过后将公开展示。`, '批量审核通过', { type: 'warning', confirmButtonText: '确认通过', cancelButtonText: '取消' })
      } else {
        const input = await ElMessageBox.prompt(`将拒绝所选的 ${rows.length} 条内容，请填写统一拒绝原因。`, '批量拒绝', {
          inputType: 'textarea', confirmButtonText: '确认拒绝', cancelButtonText: '取消',
          inputValidator: (value: string) => !!value?.trim() && value.trim().length <= 500 || '请填写 1 至 500 字的拒绝原因。',
        })
        rejectionReason = input.value.trim()
        if (!rejectionReason || rejectionReason.length > 500) return
      }
    } catch { return }
    batchResult.value = null
    batchTotal.value = rows.length
    batchCompleted.value = 0
    const result = { approved, succeeded: 0, failed: [] as number[] }
    for (const row of rows) {
      try {
        // Never review a newer post submission than the one selected in the list.
        if (reviewType === 'posts' && !row.submission_version) throw new Error('Missing submission version')
        const response = await decideLookReview(reviewType, row.id, approved, rejectionReason, row.submission_version)
        if (response.data !== true) throw new Error('Decision not saved')
        result.succeeded++
      } catch { result.failed.push(row.id) }
      batchCompleted.value++
    }
    await load(page.value)
    batchResult.value = result
  } finally { saving.value = false; batchTotal.value = 0 }
}
const error = ref(''), detailError = ref(''), mediaError = ref(''), reason = ref('')
const detailLoading = ref(false), mediaLoading = ref(false), imageUrl = ref(''), videoUrl = ref('')
const thumbnails = ref<Record<number, { url: string; loading: boolean }>>({})
let thumbnailController: AbortController | undefined
let thumbnailObjectUrls: string[] = []
let listRevision = 0, detailRevision = 0
let mediaController: AbortController | undefined
let objectUrls: string[] = []
const stateLabel = (value: string) => ({ pending: '待审核', visible: '已通过', rejected: '已拒绝', unlisted: '已下架 / 隐藏', hidden: '举报隐藏', deleted: '已删除' }[value] || value)
const method = ref<LookReviewMethod>('all')
const methodLabel = (row: LookReview) => row.reviewed_by != null ? '人工审核' : row.reviewed_at ? '自动通过' : '未审核'
function changeMethod() {
  if (state.value === 'pending' && method.value !== 'all') state.value = 'all'
  void load(1)
}
async function setVisibility(target: 'visible' | 'unlisted' | 'deleted') {
  const row = current.value
  if (!row || saving.value) return
  saving.value = true
  try {
    if (target === 'deleted') {
      try { await ElMessageBox.confirm('删除后无法恢复展示，确定删除这条内容？', '删除内容', { type: 'warning' }) }
      catch { return }
    }
    const result = await changeLookVisibility(detailType.value, row.id, row.state, target)
    if (result.data !== true) throw new Error()
    visible.value = false
    ElMessage.success(stateLabel(target))
    await load(page.value)
  } catch { detailError.value = '操作失败，请关闭并重新查看当前状态。' }
  finally { saving.value = false }
}
function safeMedia(value?: string) {
  try { const url = new URL(value || ''); return url.protocol === 'https:' ? url.href : '' } catch { return '' }
}
function releaseMedia() {
  mediaController?.abort(); mediaController = undefined
  objectUrls.forEach(url => URL.revokeObjectURL(url)); objectUrls = []
  imageUrl.value = ''; videoUrl.value = ''; mediaLoading.value = false
}
function releaseThumbnails() {
  thumbnailController?.abort(); thumbnailController = undefined
  thumbnailObjectUrls.forEach(url => URL.revokeObjectURL(url)); thumbnailObjectUrls = []
  thumbnails.value = {}
}
function thumbnailFailed(id: number) {
  if (thumbnails.value[id]) thumbnails.value[id] = { url: '', loading: false }
}
async function loadThumbnails(rows: LookReview[], revision: number) {
  const controller = new AbortController(); thumbnailController = controller
  await Promise.all(rows.map(async row => {
    const publicUrl = row.state === 'visible' ? safeMedia(row.image_url) : ''
    thumbnails.value[row.id] = { url: publicUrl, loading: !publicUrl && !!row.media_id }
    if (publicUrl || !row.media_id) return
    try {
      const blob = await getLookReviewMedia(row.media_id, true, controller.signal)
      if (controller.signal.aborted || revision !== listRevision) return
      const url = URL.createObjectURL(blob); thumbnailObjectUrls.push(url)
      thumbnails.value[row.id] = { url, loading: false }
    } catch {
      if (!controller.signal.aborted && revision === listRevision) thumbnailFailed(row.id)
    }
  }))
}
async function load(next = 1) {
  const revision = ++listRevision
  selected.value = []; reviewTable.value?.clearSelection(); batchResult.value = null
  releaseThumbnails()
  loading.value = true; error.value = ''; items.value = []; hasMore.value = false
  try {
    const result = await listLookReviews(type.value, state.value, next, method.value, publisherId.value, appId.value)
    if (!result.data) throw new Error('Missing page')
    if (revision !== listRevision) return
    items.value = result.data.items; page.value = result.data.page; hasMore.value = result.data.hasMore
    if (type.value === 'posts') void loadThumbnails(items.value, revision)
  } catch { if (revision === listRevision) error.value = '列表加载失败，请刷新重试。' }
  finally { if (revision === listRevision) loading.value = false }
}
async function openDetail(row: LookReview) {
  if (saving.value) return
  const revision = ++detailRevision
  releaseMedia(); detailType.value = type.value
  visible.value = true; current.value = null; reason.value = ''; detailError.value = ''; mediaError.value = ''; detailLoading.value = true
  try {
    const result = await getLookReview(detailType.value, row.id)
    if (!result.data) throw new Error('Missing detail')
    if (revision !== detailRevision) return
    current.value = result.data
    await loadMedia(result.data, revision)
  } catch { if (revision === detailRevision) detailError.value = '详情加载失败，请关闭后重试。' }
  finally { if (revision === detailRevision) detailLoading.value = false }
}
async function loadMedia(review: LookReview, revision: number) {
  const publiclyVisible = (review.post_state || review.state) === 'visible'
  imageUrl.value = publiclyVisible ? safeMedia(review.image_url) : ''; videoUrl.value = publiclyVisible ? safeMedia(review.video_url) : ''
  if (detailType.value !== 'posts' || (imageUrl.value && (review.media_type !== 'video' || videoUrl.value))) return
  if (!review.media_id) { mediaError.value = '作品缺少媒体，无法预览。'; return }
  const controller = new AbortController(); mediaController = controller; mediaLoading.value = true
  const fetchUrl = async (thumbnail: boolean) => {
    const blob = await getLookReviewMedia(review.media_id!, thumbnail, controller.signal)
    if (revision !== detailRevision || controller.signal.aborted) return ''
    const url = URL.createObjectURL(blob); objectUrls.push(url); return url
  }
  try {
    if (review.media_type === 'video') {
      const video = await fetchUrl(false)
      if (revision !== detailRevision) return
      videoUrl.value = video
      const thumbnail = await fetchUrl(true)
      if (revision === detailRevision) imageUrl.value = thumbnail
    } else {
      const url = await fetchUrl(false)
      if (revision === detailRevision) imageUrl.value = url
    }
  } catch { if (revision === detailRevision) mediaError.value = '媒体加载失败，请关闭后重试。' }
  finally { if (revision === detailRevision) mediaLoading.value = false }
}
async function decide(approved: boolean) {
  if (!current.value || current.value.state !== 'pending' || saving.value || detailLoading.value) return
  const trimmed = reason.value.trim()
  if (!approved && (!trimmed || trimmed.length > 500)) { detailError.value = '请填写 1 至 500 字的拒绝原因。'; return }
  saving.value = true; detailError.value = ''
  try {
    const result = await decideLookReview(detailType.value, current.value.id, approved, approved ? '' : trimmed, current.value.submission_version)
    if (result.data !== true) throw new Error('Decision not saved')
    ElMessage.success(approved ? '审核通过' : '已拒绝'); visible.value = false
    await load(page.value)
  } catch { detailError.value = '审核失败，内容可能已被其他管理员处理，请关闭后重新查看。' }
  finally { saving.value = false }
}
watch(visible, value => { if (!value) { ++detailRevision; releaseMedia(); current.value = null; detailLoading.value = false } })
onBeforeUnmount(() => { ++listRevision; ++detailRevision; releaseMedia(); releaseThumbnails() })
onMounted(() => { void load(); void loadAutoReview() })
</script>

<style scoped>
.batch-actions { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; margin: 16px 0; }
.batch-result { margin-bottom: 16px; }
.auto-review-setting { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.looks-reviews { padding: 20px; }
.pagination { display: flex; align-items: center; justify-content: flex-end; gap: 12px; margin-top: 16px; }
.preview { margin: 16px 0; min-height: 20px; }
.media { display: block; max-width: 100%; max-height: 420px; margin: auto; }
.list-preview { width: 110px; height: 90px; display: flex; align-items: center; justify-content: center; background: var(--el-fill-color-light); border-radius: 6px; overflow: hidden; color: var(--el-text-color-secondary); font-size: 12px; }
.list-preview img { width: 100%; height: 100%; object-fit: contain; }
.content-text { white-space: pre-wrap; overflow-wrap: anywhere; }
</style>
