<template>
  <div class="looks-reviews">
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
          <el-option value="pending" label="待审核" /><el-option value="visible" label="已通过" /><el-option value="rejected" label="已拒绝" />
        </el-select>
      </div>
      <template #query><el-button type="primary" :loading="loading" :disabled="saving" @click="load(1)">刷新</el-button></template>
    </ListSearchPanel>
    <p v-if="state === 'pending'">待审核内容按提交时间从早到晚排列，审核通过后才会公开展示。</p>
    <el-alert v-if="error" :title="error" type="error" :closable="false" />
    <el-table v-loading="loading" :data="items" border empty-text="暂无内容">
      <TableActionColumn><template #default="{ row }"><el-button link type="primary" :disabled="loading || saving" @click="openDetail(row)">查看审核</el-button></template></TableActionColumn>
      <el-table-column prop="id" label="ID" width="90" />
      <el-table-column label="作者" min-width="160"><template #default="{ row }">{{ row.author_name || '用户' }} (#{{ row.user_id }})</template></el-table-column>
      <el-table-column label="内容" min-width="240" show-overflow-tooltip><template #default="{ row }">{{ row.body || row.caption || '无文字' }}</template></el-table-column>
      <el-table-column label="状态" width="110"><template #default="{ row }">{{ stateLabel(row.state) }}</template></el-table-column>
      <el-table-column prop="created_at" label="提交时间 (UTC)" width="210" />
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
            <el-descriptions-item v-if="current.reviewed_by != null" label="审核记录">管理员 #{{ current.reviewed_by }} · {{ current.reviewed_at }} UTC</el-descriptions-item>
            <el-descriptions-item v-if="current.review_reason" label="拒绝原因"><div class="content-text">{{ current.review_reason }}</div></el-descriptions-item>
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
import { ElMessage } from 'element-plus'
import ListSearchPanel from '@/components/common/ListSearchPanel.vue'
import TableActionColumn from '@/components/common/TableActionColumn.vue'
import { listLookReviews, getLookReview, decideLookReview, getLookReviewMedia, type LookReview, type LookReviewType, type LookReviewState } from '@/api/looks'
const type = ref<LookReviewType>('posts'), state = ref<LookReviewState>('pending'), detailType = ref<LookReviewType>('posts')
const items = ref<LookReview[]>([]), current = ref<LookReview | null>(null)
const page = ref(1), hasMore = ref(false), loading = ref(false), saving = ref(false), visible = ref(false)
const error = ref(''), detailError = ref(''), mediaError = ref(''), reason = ref('')
const detailLoading = ref(false), mediaLoading = ref(false), imageUrl = ref(''), videoUrl = ref('')
let listRevision = 0, detailRevision = 0
let mediaController: AbortController | undefined
let objectUrls: string[] = []
const stateLabel = (value: string) => ({ pending: '待审核', visible: '已通过', rejected: '已拒绝', hidden: '已隐藏', deleted: '已删除' }[value] || value)
function safeMedia(value?: string) {
  try { const url = new URL(value || ''); return url.protocol === 'https:' ? url.href : '' } catch { return '' }
}
function releaseMedia() {
  mediaController?.abort(); mediaController = undefined
  objectUrls.forEach(url => URL.revokeObjectURL(url)); objectUrls = []
  imageUrl.value = ''; videoUrl.value = ''; mediaLoading.value = false
}
async function load(next = 1) {
  const revision = ++listRevision
  loading.value = true; error.value = ''; items.value = []; hasMore.value = false
  try {
    const result = await listLookReviews(type.value, state.value, next)
    if (!result.data) throw new Error('Missing page')
    if (revision !== listRevision) return
    items.value = result.data.items; page.value = result.data.page; hasMore.value = result.data.hasMore
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
  imageUrl.value = safeMedia(review.image_url); videoUrl.value = safeMedia(review.video_url)
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
    const result = await decideLookReview(detailType.value, current.value.id, approved, approved ? '' : trimmed)
    if (result.data !== true) throw new Error('Decision not saved')
    ElMessage.success(approved ? '审核通过' : '已拒绝'); visible.value = false
    await load(page.value)
  } catch { detailError.value = '审核失败，内容可能已被其他管理员处理，请关闭后重新查看。' }
  finally { saving.value = false }
}
watch(visible, value => { if (!value) { ++detailRevision; releaseMedia(); current.value = null; detailLoading.value = false } })
onBeforeUnmount(() => { ++listRevision; ++detailRevision; releaseMedia() })
onMounted(() => load())
</script>

<style scoped>
.looks-reviews { padding: 20px; }
.pagination { display: flex; align-items: center; justify-content: flex-end; gap: 12px; margin-top: 16px; }
.preview { margin: 16px 0; min-height: 20px; }
.media { display: block; max-width: 100%; max-height: 420px; margin: auto; }
.content-text { white-space: pre-wrap; overflow-wrap: anywhere; }
</style>
