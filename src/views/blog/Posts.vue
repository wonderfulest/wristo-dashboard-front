<template>
  <div class="page">
    <div class="page-header">
      <div class="title">文章列表</div>
      <div class="actions">
        <el-button type="primary" @click="openCreateDialog">新建文章</el-button>
      </div>
    </div>

    <el-card>
      <el-form inline label-width="88px">
        <el-form-item label="关键词">
          <el-input v-model="keyword" placeholder="标题/Slug" clearable @keyup.enter="search(1)" style="min-width: 240px;" />
        </el-form-item>
        <el-form-item label="发布状态">
          <el-select v-model="isPublished" placeholder="全部" clearable style="min-width: 160px;">
            <el-option :value="1" label="已发布" />
            <el-option :value="0" label="未发布" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="search(1)">搜索</el-button>
          <el-button :loading="loading" @click="reset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-alert v-if="error" :title="error" type="error" show-icon style="margin-top: 12px;" />

    <el-card class="card" style="margin-top: 12px;">
      <el-table :data="pageData.list" v-loading="loading" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="标题">
          <template #default="{ row }">
            <div class="title-line">{{ (row.translations && row.translations[0]?.title) || '—' }}</div>
            <div class="muted">{{ (row.translations && row.translations[0]?.summary) || '' }}</div>
          </template>
        </el-table-column>
        <el-table-column label="Slug" width="160">
          <template #default="{ row }">{{ (row.translations && row.translations[0]?.slug) || '—' }}</template>
        </el-table-column>
        <el-table-column label="语言" width="110">
          <template #default="{ row }">{{ (row.translations && row.translations[0]?.lang) || '—' }}</template>
        </el-table-column>
        <el-table-column label="发布" width="110">
          <template #default="{ row }">
            <el-tag :type="row.isPublished === 1 ? 'success' : 'info'">{{ row.isPublished === 1 ? '已发布' : '未发布' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="发布时间" width="180">
          <template #default="{ row }">{{ fmtDate(row.publishedAt) }}</template>
        </el-table-column>
        <el-table-column prop="viewCount" label="浏览" width="120" />
        <el-table-column label="更新时间" width="200">
          <template #default="{ row }">{{ fmtDate(row.updatedAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div style="display: flex; justify-content: center; padding: 12px 0;" v-if="pageData.pages > 1">
        <el-pagination
          layout="prev, pager, next, jumper"
          :total="pageData.total"
          :page-size="pageData.pageSize"
          :current-page="pageData.pageNum"
          @current-change="changePage"
        />
      </div>
    </el-card>
    <!-- Create Post Dialog -->
    <el-dialog v-model="createDialogVisible" title="新建文章" width="640px" :destroy-on-close="true">
      <el-form label-width="100px">
        <el-form-item label="分类">
          <el-select v-model="createForm.categoryId" placeholder="选择分类（可选）" clearable filterable style="min-width: 260px;">
            <el-option v-for="c in categories" :key="c.id" :label="c.name || c.slug || ('分类#' + c.id)" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="作者ID">
          <el-input-number v-model="createForm.authorId" :min="0" :controls="false" placeholder="可选" />
        </el-form-item>
        <el-form-item label="封面图URL">
          <el-input v-model="createForm.coverImageUrl" placeholder="https://..." />
        </el-form-item>
        <el-form-item label="发布状态">
          <el-select v-model="createForm.isPublished" placeholder="选择状态" style="width: 200px;">
            <el-option :value="0" label="未发布" />
            <el-option :value="1" label="已发布" />
          </el-select>
        </el-form-item>
        <el-form-item label="发布时间">
          <el-date-picker
            v-model="createForm.publishedAt"
            type="datetime"
            placeholder="YYYY-MM-DDTHH:mm:ss"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DDTHH:mm:ss"
            style="width: 260px;"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span>
          <el-button @click="createDialogVisible = false">取 消</el-button>
          <el-button type="primary" :loading="creating" @click="saveCreate">创 建</el-button>
        </span>
      </template>
    </el-dialog>
  </div>

</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import type { PageResponse, ApiResponse } from '@/types/api'
import type { BlogPostVO, BlogPostPageQueryDTO } from '@/types/blog'
import { fetchBlogPostPage, deleteBlogPost, createBlogPost, fetchCategoryList } from '@/api/blog'
import { ElMessageBox, ElMessage } from 'element-plus'

const router = useRouter()
const loading = ref(true)
const error = ref<string | null>(null)

const pageData = ref<PageResponse<BlogPostVO>>({ pageNum: 1, pageSize: 10, total: 0, pages: 0, list: [] })

const keyword = ref<string>('')
const isPublished = ref<number | undefined>(undefined)

const fmtDate = (v?: string | null) => {
  if (!v) return '—'
  const d = new Date(v)
  return isNaN(d.getTime()) ? '—' : d.toLocaleString('zh')
}

const search = async (pageNum = 1) => {
  try {
    loading.value = true
    error.value = null

    const dto: BlogPostPageQueryDTO = {
      pageNum,
      pageSize: pageData.value.pageSize,
      keyword: keyword.value || null,
      isPublished: typeof isPublished.value === 'number' ? isPublished.value : null
    }

    const res: ApiResponse<PageResponse<BlogPostVO>> = await fetchBlogPostPage(dto)
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

const handleEdit = (row: BlogPostVO) => {
  // 跳到编辑页并带上 editId（使用命名路由），编辑页据此加载详情
  console.log(row)
  router.push({ name: 'BlogPostEdit', params: { id: String(row.id) } })
}

const handleDelete = async (row: BlogPostVO) => {
  try {
    await ElMessageBox.confirm(`确定要删除文章 #${row.id} 吗？`, '删除确认', { type: 'warning' })
    const res = await deleteBlogPost(row.id)
    if ((res as any)?.code === 0 || (res as any) === true || (res as any)?.data === true) {
      ElMessage.success('删除成功')
      // 重新加载当前页
      await search(pageData.value.pageNum)
    } else {
      ElMessage.error((res as any)?.msg || '删除失败')
    }
  } catch (e: any) {
    if (e === 'cancel') return
    ElMessage.error(e?.message || '操作失败')
  }
}

const reset = () => {
  keyword.value = ''
  isPublished.value = undefined
  search(1)
}

onMounted(() => search(1))

// Create dialog state
const createDialogVisible = ref(false)
const creating = ref(false)
const createForm = ref<{ categoryId?: number | null; authorId?: number | null; coverImageUrl?: string | null; isPublished?: number | null; publishedAt?: string | null; lang: string; title: string; slug: string }>({
  categoryId: undefined,
  authorId: undefined,
  coverImageUrl: '',
  isPublished: 0,
  publishedAt: '',
  lang: 'zh',
  title: '',
  slug: ''
})
const categories = ref<Array<{ id: number; name?: string | null; slug: string }>>([])

const openCreateDialog = async () => {
  createForm.value = { categoryId: undefined, authorId: undefined, coverImageUrl: '', isPublished: 0, publishedAt: '', lang: 'zh', title: '', slug: '' }
  createDialogVisible.value = true
  try {
    const res = await fetchCategoryList()
    if ((res as any)?.code === 0 && Array.isArray((res as any)?.data)) categories.value = (res as any).data
  } catch {}
}

const formatToT = (s?: string | null) => {
  if (!s) return undefined
  const x = s.replace(' ', 'T')
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(x)) return x
  const d = new Date(s)
  if (isNaN(d.getTime())) return s
  const pad = (n: number) => String(n).padStart(2, '0')
  const y = d.getFullYear(); const m = pad(d.getMonth()+1); const day = pad(d.getDate()); const hh = pad(d.getHours()); const mm = pad(d.getMinutes()); const ss = pad(d.getSeconds())
  return `${y}-${m}-${day}T${hh}:${mm}:${ss}`
}

const saveCreate = async () => {
  try {
    creating.value = true
    const dto = {
      ...createForm.value,
      publishedAt: formatToT(createForm.value.publishedAt || undefined)
    }
    const res = await createBlogPost(dto as any)
    const newId = (res as any)?.data?.id
    if (newId) {
      ElMessage.success('创建成功')
      createDialogVisible.value = false
      // 跳转到 PostEdit 页面继续完善翻译和正文
      router.push({ path: '/blog/posts/create', query: { editId: String(newId) } })
    } else {
      ElMessage.error((res as any)?.msg || '创建失败')
    }
  } catch (e: any) {
    ElMessage.error(e?.message || '创建失败')
  } finally {
    creating.value = false
  }
}
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 12px; }
.page-header { display: flex; justify-content: space-between; align-items: center; }
.title { font-size: 20px; font-weight: 600; }
.actions { display: flex; gap: 8px; }
.muted { color: #909399; font-size: 12px; margin-top: 2px; }
</style>
