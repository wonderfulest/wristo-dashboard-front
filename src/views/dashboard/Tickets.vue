<template>
  <div class="tickets-page">
    <div class="filters">
      <el-select
        v-model="statusesSelected"
        placeholder="Status"
        clearable
        multiple
        filterable
        style="width: 300px"
      >
        <el-option v-for="s in statuses" :key="s" :label="formatEnumLabel(s)" :value="s" />
      </el-select>
      <el-select
        v-model="prioritiesSelected"
        placeholder="Priority"
        clearable
        multiple
        filterable
        style="width: 240px"
      >
        <el-option v-for="p in priorities" :key="p" :label="formatEnumLabel(p)" :value="p" />
      </el-select>
      <el-date-picker
        v-model="dateRange"
        type="datetimerange"
        start-placeholder="Begin at"
        end-placeholder="End at"
        value-format="YYYY-MM-DD HH:mm:ss"
      />
      <el-select v-model="orderBy" placeholder="Sort" clearable style="width: 180px" @change="onSortChange">
        <el-option label="Created desc" value="id:desc" />
        <el-option label="Created asc" value="id:asc" />
      </el-select>
      <el-button type="primary" @click="search(1)">Search</el-button>
      <el-button @click="reset">Reset</el-button>
    </div>

    <div v-if="loading" class="loading">Loading tickets...</div>
    <div v-else-if="error" class="error">{{ error }}</div>

    <div v-else class="table-container">
      <el-table :data="pageData.list" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="Title" min-width="240">
          <template #default="{ row }">
            <div class="title-cell" @click="openDetail(row)" style="cursor: pointer;">
              <div class="title-text">{{ row.title }}</div>
              <div v-if="row.description" class="desc-text">{{ row.description }}</div>
              <div class="tags-wrap" v-if="(row.tags || '').trim().length > 0">
                <el-tag
                  v-for="t in parseTags(row.tags)"
                  :key="t"
                  size="small"
                  type="info"
                  effect="plain"
                  class="tag-item"
                >{{ t }}</el-tag>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Product" min-width="320">
          <template #default="{ row }">
            <div class="product-info">
              <el-image
                v-if="row.product?.garminImageUrl || row.product?.heroImages?.[0]?.url"
                :src="row.product?.garminImageUrl || row.product?.heroImages?.[0]?.url"
                :preview-src-list="[row.product?.garminImageUrl || row.product?.heroImages?.[0]?.url].filter(Boolean) as string[]"
                :z-index="5000"
                :preview-teleported="true"
                fit="cover"
                class="product-thumb"
                style="width: 44px; height: 44px"
              />
              <div class="product-meta">
                <div class="product-name">
                  <a
                    v-if="row.product?.garminStoreUrl"
                    :href="row.product?.garminStoreUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                  >{{ row.product?.name }}</a>
                  <span v-else>{{ row.product?.name || '-' }}</span>
                  <el-tooltip content="Edit Product" placement="top">
                    <el-button
                      class="edit-icon-btn"
                      :disabled="!row.product?.designId"
                      link
                      circle
                      size="small"
                      @click.stop="navigateToDesign(row)"
                    >
                      <el-icon><Edit /></el-icon>
                    </el-button>
                  </el-tooltip>
                </div>
                <div class="product-details">
                  <span>appId: {{ row.product?.appId ?? '-' }}</span>
                  <span>Design ID: {{ row.product?.designId ?? '-' }}</span>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="优先级" width="120">
          <template #default="{ row }">
            <span class="tag" :class="priorityClass(row.priority)">{{ row.priority || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <span class="badge" :class="statusClass(row.status)">{{ row.status }}</span>
          </template>
        </el-table-column>
        <el-table-column label="指派人" width="140">
          <template #default="{ row }">{{ row.assignee?.username || '—' }}</template>
        </el-table-column>
        <el-table-column label="创建人" width="140">
          <template #default="{ row }">{{ row.creator?.username || '—' }}</template>
        </el-table-column>
        <el-table-column prop="dueDate" label="截止日期" width="180">
          <template #default="{ row }">{{ fmtDate(row.dueDate) }}</template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">{{ fmtDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="320" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="openDetail(row)">查看</el-button>
            <el-divider direction="vertical" />
            <el-button type="warning" link @click="openStatusDialog(row)">状态</el-button>
            <el-divider direction="vertical" />
            <el-button type="info" link @click="openComment(row)">评论</el-button>
            <el-divider direction="vertical" />
            <el-button
              type="danger"
              link
              :disabled="row.status === 'closed' || closingIds.has(row.id)"
              @click="closeRow(row)"
            >关闭</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination" v-if="pageData.total > 0">
        <el-pagination
          v-model:current-page="pageData.pageNum"
          v-model:page-size="pageData.pageSize"
          :total="pageData.total"
          layout="total, prev, pager, next"
          @current-change="changePage"
        />
      </div>
    </div>

    <el-dialog v-model="detailVisible" title="工单详情" width="800px">
      <template v-if="current">
        <el-descriptions :column="2" size="small" border>
          <el-descriptions-item label="ID">{{ current.id }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ current.status }}</el-descriptions-item>
          <el-descriptions-item label="标题" :span="2">{{ current.title }}</el-descriptions-item>
          <el-descriptions-item label="优先级">{{ current.priority }}</el-descriptions-item>
          <el-descriptions-item label="指派人">{{ current.assignee?.username || '—' }}</el-descriptions-item>
          <el-descriptions-item label="创建人">{{ current.creator?.username || '—' }}</el-descriptions-item>
          <el-descriptions-item label="截止日期">{{ fmtDate(current.dueDate) }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ fmtDate(current.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="描述" :span="2"><div class="multiline">{{ current.description || '—' }}</div></el-descriptions-item>
          <el-descriptions-item label="标签" :span="2">{{ current.tags || '—' }}</el-descriptions-item>
        </el-descriptions>

        <el-divider content-position="left">评论</el-divider>
        <div v-if="comments.length" class="comments">
          <div v-for="c in comments" :key="c.id" class="comment-item">
            <div class="comment-meta">
              <span>用户: {{ c.user?.username || c.userId || '—' }}</span>
              <span>时间: {{ fmtDate(c.createdAt) }}</span>
            </div>
            <div class="comment-content multiline">{{ c.content }}</div>
          </div>
        </div>
        <div v-else class="empty-sub">暂无评论</div>

        <el-divider content-position="left">历史</el-divider>
        <div v-if="history.length" class="history">
          <div v-for="h in history" :key="h.id" class="history-item">
            <div class="history-meta">
              <span>{{ fmtDate(h.createdAt) }}</span>
              <span>操作人: {{ h.operator?.username || h.operatorId || '—' }}</span>
            </div>
            <div class="history-content">{{ h.action }}: {{ h.fromValue || '—' }} → {{ h.toValue || '—' }}</div>
          </div>
        </div>
        <div v-else class="empty-sub">暂无历史</div>
      </template>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="detailVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 评论弹窗 -->
    <el-dialog v-model="commentDialogVisible" title="添加评论" width="520px">
      <div v-if="commentDialogComments.length" class="comments" style="max-height: 240px; overflow:auto; margin-bottom: 12px;">
        <div v-for="c in commentDialogComments" :key="c.id" class="comment-item">
          <div class="comment-meta">
            <span>用户: {{ c.user?.username || c.userId || '—' }}</span>
            <span>时间: {{ fmtDate(c.createdAt) }}</span>
          </div>
          <div class="comment-content multiline">{{ c.content }}</div>
        </div>
      </div>
      <el-form label-width="90px">
        <el-form-item label="内容">
          <el-input v-model="commentContent" type="textarea" rows="4" placeholder="请输入评论内容" />
        </el-form-item>
        <el-form-item label="附件(JSON)">
          <el-input v-model="commentAttachments" placeholder='可选，如: {"images":["url1","url2"]}' />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="commentDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="commentSubmitting" @click="submitComment">提交</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 状态变更弹窗（不允许设置为 closed） -->
    <el-dialog v-model="statusDialogVisible" title="变更状态" width="420px">
      <el-form label-width="90px">
        <el-form-item label="当前状态">
          <el-tag type="info">{{ formatEnumLabel(statusTicket?.status || '') }}</el-tag>
        </el-form-item>
        <el-form-item label="目标状态">
          <el-select v-model="statusNext" placeholder="选择状态" style="width: 220px">
            <el-option v-for="s in statusOptions" :key="s" :label="formatEnumLabel(s)" :value="s" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="statusDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="statusSubmitting" @click="submitStatus">确认</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { fetchTicketPage, getTicketDetail, fetchTicketComments, fetchTicketHistory, closeTicket, updateTicketStatus, addTicketComment } from '@/api/ticket'
import { useUserStore } from '@/store/user'
import { Edit } from '@element-plus/icons-vue'
import type { TicketVO, TicketQueryDTO, PageResponse, TicketComment, TicketHistory } from '@/types/api'

const loading = ref(true)
const error = ref<string | null>(null)

const pageData = ref<PageResponse<TicketVO>>({ pageNum: 1, pageSize: 10, total: 0, pages: 0, list: [] })

// filter options (enums)
const statuses = ref<string[]>(['open', 'resolved', 'closed'])
const priorities = ref<string[]>(['low', 'medium', 'high', 'urgent'])

// UI state
const statusesSelected = ref<string[]>(['open', 'resolved'])
const prioritiesSelected = ref<string[]>([])
const dateRange = ref<[string, string] | null>(null)
const orderBy = ref<string>('createdAt:desc')

const query = reactive<TicketQueryDTO>({ pageNum: 1, pageSize: 10, status: undefined, priority: undefined, assigneeId: undefined, orderBy: 'createdAt:desc', beginAt: undefined, endAt: undefined })

const detailVisible = ref(false)
const current = ref<TicketVO | null>(null)
const comments = ref<TicketComment[]>([])
const history = ref<TicketHistory[]>([])
const userStore = useUserStore()
const closingIds = ref<Set<number>>(new Set())

// comment dialog state
const commentDialogVisible = ref(false)
const commentingTicket = ref<TicketVO | null>(null)
const commentContent = ref('')
const commentAttachments = ref('')
const commentSubmitting = ref(false)
const commentDialogComments = ref<TicketComment[]>([])

// status dialog state
const statusDialogVisible = ref(false)
const statusTicket = ref<TicketVO | null>(null)
const statusNext = ref<string | undefined>(undefined)
const statusOptions = computed(() => statuses.value.filter(s => s !== 'closed'))
const statusSubmitting = ref(false)

const fmtDate = (v?: string | null) => {
  if (!v) return '—'
  const d = new Date(v)
  return isNaN(d.getTime()) ? '—' : d.toLocaleString('zh-CN')
}

const formatEnumLabel = (val: string) => {
  if (!val) return ''
  return val.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

const onSortChange = (v: string) => {
  orderBy.value = v || 'createdAt:desc'
}

const statusClass = (s?: string | null) => {
  switch (s) {
    case 'open': return 's-open'
    case 'resolved': return 's-resolved'
    case 'closed': return 's-closed'
    default: return 's-unknown'
  }
}

const priorityClass = (p?: string | null) => {
  switch (p) {
    case 'low': return 'p-low'
    case 'medium': return 'p-medium'
    case 'high': return 'p-high'
    case 'urgent': return 'p-urgent'
    default: return 'p-unknown'
  }
}

// parse tags: JSON array string preferred, fallback to comma-separated
const parseTags = (tags?: string | null): string[] => {
  if (!tags) return []
  const s = tags.trim()
  if (!s) return []
  try {
    const arr = JSON.parse(s)
    if (Array.isArray(arr)) return arr.map(v => String(v)).filter(Boolean)
  } catch {
    // ignore JSON parse error
  }
  return s.split(',').map(t => t.trim()).filter(Boolean)
}

// navigate to product design edit by designId
const navigateToDesign = (row: TicketVO) => {
  const did = (row?.product as any)?.designId
  if (!did) {
    ElMessage.info('无可编辑的 Design ID')
    return
  }
  window.open(`http://studio.wristo.io/design?id=${encodeURIComponent(String(did))}`,'_blank')
}

const search = async (pageNum = 1) => {
  try {
    loading.value = true
    error.value = null
    query.pageNum = pageNum
    // build query from UI filters (arrays preferred)
    query.statuses = statusesSelected.value.length ? [...statusesSelected.value] : undefined
    query.status = undefined
    query.priorities = prioritiesSelected.value.length ? [...prioritiesSelected.value] : undefined
    query.priority = undefined
    query.orderBy = orderBy.value || 'createdAt:desc'
    if (dateRange.value && dateRange.value.length === 2) {
      query.beginAt = dateRange.value[0]
      query.endAt = dateRange.value[1]
    } else {
      query.beginAt = undefined
      query.endAt = undefined
    }

    const res = await fetchTicketPage(query)
    if (res.code === 0 && res.data) {
      pageData.value = res.data
    } else {
      error.value = res.msg || '加载失败'
    }
  } catch (e) {
    console.error(e)
    error.value = '网络错误'
  } finally {
    loading.value = false
  }
}

const changePage = (p: number) => {
  if (p >= 1 && p <= pageData.value.pages) search(p)
}

const openDetail = async (row: TicketVO) => {
  try {
    detailVisible.value = true
    const [d, cs, hs] = await Promise.all([
      getTicketDetail(row.id),
      fetchTicketComments(row.id),
      fetchTicketHistory(row.id)
    ])
    if (d.code === 0 && d.data) current.value = d.data
    if (cs.code === 0 && cs.data) comments.value = cs.data
    if (hs.code === 0 && hs.data) history.value = hs.data
  } catch (e) {
    ElMessage.error('加载详情失败')
  }
}

const reset = () => {
  statusesSelected.value = []
  prioritiesSelected.value = []
  dateRange.value = null
  orderBy.value = 'createdAt:desc'
  query.pageNum = 1
  search(1)
}

const closeRow = async (row: TicketVO) => {
  if (!userStore.userInfo?.id) {
    ElMessage.error('未获取到当前登录用户信息')
    return
  }
  try {
    await ElMessageBox.confirm('确认关闭该工单吗？', '提示', { type: 'warning' })
  } catch {
    return
  }
  try {
    closingIds.value.add(row.id)
    const res = await closeTicket(row.id, userStore.userInfo.id)
    if ((res as any)?.code === 0) {
      ElMessage.success('已关闭')
      // 刷新当前页
      search(pageData.value.pageNum)
    } else {
      ElMessage.error((res as any)?.msg || '关闭失败')
    }
  } catch (e) {
    ElMessage.error('关闭失败')
  } finally {
    closingIds.value.delete(row.id)
  }
}

const openStatusDialog = (row: TicketVO) => {
  statusTicket.value = row
  // 默认选择与当前不同的第一个可选状态
  const opts = statusOptions.value
  statusNext.value = opts.find(s => s !== row.status) || opts[0]
  statusDialogVisible.value = true
}

const submitStatus = async () => {
  if (!statusTicket.value || !statusNext.value) return
  if (statusNext.value === 'closed') {
    ElMessage.error('不能通过此处直接关闭，请使用“关闭”按钮')
    return
  }
  if (!userStore.userInfo?.id) {
    ElMessage.error('未获取到当前登录用户信息')
    return
  }
  try {
    statusSubmitting.value = true
    const res = await updateTicketStatus(statusTicket.value.id, { status: statusNext.value, operatorId: userStore.userInfo.id } as any)
    if ((res as any)?.code === 0) {
      ElMessage.success('状态已更新')
      statusTicket.value.status = statusNext.value as any
      statusDialogVisible.value = false
    } else {
      ElMessage.error((res as any)?.msg || '更新失败')
    }
  } catch (e) {
    ElMessage.error('更新失败')
  } finally {
    statusSubmitting.value = false
  }
}

const openComment = async (row: TicketVO) => {
  commentingTicket.value = row
  commentContent.value = ''
  commentAttachments.value = ''
  commentDialogComments.value = []
  // 拉取评论历史
  try {
    const cs = await fetchTicketComments(row.id)
    if (cs.code === 0 && cs.data) commentDialogComments.value = cs.data
  } catch {
    // ignore
  }
  commentDialogVisible.value = true
}

const submitComment = async () => {
  if (!commentingTicket.value) return
  if (!userStore.userInfo?.id) {
    ElMessage.error('未获取到当前登录用户信息')
    return
  }
  if (!commentContent.value.trim()) {
    ElMessage.error('请输入评论内容')
    return
  }
  try {
    commentSubmitting.value = true
    const dto = {
      userId: userStore.userInfo.id,
      content: commentContent.value.trim(),
      attachments: commentAttachments.value ? commentAttachments.value : undefined,
    } as any
    const res = await addTicketComment(commentingTicket.value.id, dto)
    if ((res as any)?.code === 0) {
      ElMessage.success('评论已添加')
      commentDialogVisible.value = false
      // 如果当前详情为该工单，刷新评论
      if (current.value && current.value.id === commentingTicket.value.id) {
        const cs = await fetchTicketComments(current.value.id)
        if (cs.code === 0 && cs.data) comments.value = cs.data
      }
    } else {
      ElMessage.error((res as any)?.msg || '添加失败')
    }
  } catch (e) {
    ElMessage.error('添加失败')
  } finally {
    commentSubmitting.value = false
  }
}

onMounted(() => {
  search(1)
})
</script>

<style scoped>
.tickets-page { padding: 32px; background: #fff; min-height: 300px; }
.filters { display: flex; gap: 12px; align-items: center; margin-bottom: 12px; flex-wrap: wrap; }
/* ... */
.filter-input { width: 200px; }
.filter-btn { padding: 8px 12px; border-radius: 6px; border: 1px solid #ced4da; background: #f8f9fa; cursor: pointer; }
.filter-btn.primary { background: #0d6efd; color: #fff; border-color: #0d6efd; }
.loading, .error { padding: 16px; }
.error { background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 6px; }
.table-container { margin-top: 12px; overflow-x: auto; }
.tickets-table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; }
.tickets-table th { background: #f8f9fa; padding: 10px 12px; border-bottom: 2px solid #dee2e6; font-weight: 600; color: #495057; }
.tickets-table td { padding: 10px 12px; border-bottom: 1px solid #eee; text-align: center; }
.title-cell .title { color: #0d6efd; cursor: pointer; }
.badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
.s-open { background: #e7f5ff; color: #1971c2; }
.s-progress { background: #fff4e6; color: #d9480f; }
.s-review { background: #f3f0ff; color: #5f3dc4; }
.s-resolved { background: #ebfbee; color: #2b8a3e; }
.s-closed { background: #f8f9fa; color: #495057; }
.s-unknown { background: #f1f3f5; color: #868e96; }
.tag { padding: 4px 10px; border-radius: 999px; border: 1px solid #dee2e6; font-size: 12px; }
.p-low { background: #f8f9fa; }
.p-medium { background: #e7f5ff; }
.p-high { background: #fff4e6; }
.p-urgent { background: #fff5f5; }
.p-unknown { background: #f1f3f5; }
.empty { color: #868e96; padding: 24px; }
.pagination { display: flex; gap: 12px; align-items: center; justify-content: center; padding: 16px 0; }
.page-btn { background: #0d6efd; color: #fff; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; }
.page-btn:disabled { background: #6c757d; cursor: not-allowed; }
.page-info { color: #495057; }
.multiline { white-space: pre-wrap; word-break: break-word; }
.comments .comment-item { padding: 8px 0; border-bottom: 1px dashed #e9ecef; }
.comment-meta { display: flex; gap: 12px; color: #6c757d; font-size: 12px; margin-bottom: 4px; }
.history .history-item { padding: 6px 0; border-bottom: 1px dashed #e9ecef; }
.history-meta { display: flex; gap: 12px; color: #6c757d; font-size: 12px; margin-bottom: 4px; }
.link { background: none; border: none; color: #0d6efd; cursor: pointer; }

/* title cell */
.title-cell { display: flex; flex-direction: column; gap: 4px; }
.title-text { font-weight: 600; color: #1f2937; }
.desc-text { color: #6b7280; font-size: 12px; }
.tags-wrap { display: flex; gap: 6px; flex-wrap: wrap; }
.tag-item { margin-right: 0; }

/* product cell */
.product-info { display: flex; align-items: center; gap: 12px; }
.product-thumb { border-radius: 6px; }
.product-meta { min-width: 0; }
.product-name { display: flex; align-items: center; gap: 6px; font-weight: 600; color: #333; }
.product-details { display: flex; gap: 10px; font-size: 12px; color: #666; }
.edit-icon-btn { padding: 0; }
</style>
