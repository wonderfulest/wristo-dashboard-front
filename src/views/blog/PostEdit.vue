<template>
  <div class="page">
    <div class="page-header">
      <div class="title">编辑文章</div>
      <div class="actions">
        <el-tabs v-if="availableLangs.length" v-model="activeLang" type="card" size="small">
          <el-tab-pane v-for="l in availableLangs" :key="l" :name="l">
            <template #label>
              <span class="tab-label">
                <span class="lang-code">{{ l }}</span>
                <el-dropdown v-if="availableLangs.length > 1" trigger="hover" @command="(cmd: string) => onTabCommand(cmd, l)">
                  <span class="tab-actions" @click.stop>⋯</span>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="delete">删除</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </span>
            </template>
          </el-tab-pane>
        </el-tabs>
        <el-select v-if="addableLangs.length" v-model="addLangSelect" placeholder="添加语言" size="small" style="width: 140px; margin-left: 8px;" @change="addLanguage">
          <el-option v-for="l in addableLangs" :key="l" :label="l" :value="l" />
        </el-select>
        <el-link type="primary" style="margin-left: 8px;" @click="showMeta = !showMeta">{{ showMeta ? '收起元数据' : '展开元数据' }}</el-link>
        <router-link class="btn" to="/blog/posts">返回列表</router-link>
      </div>
    </div>

    <el-card v-if="showMeta" class="card">
      <el-form label-width="100px">
        <el-form-item label="分类">
          <el-select v-model="post.categoryId" placeholder="选择分类（可选）" clearable filterable style="min-width: 260px;">
            <el-option
              v-for="c in categories"
              :key="c.id"
              :label="c.name || c.slug || ('分类#' + c.id)"
              :value="c.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="作者ID">
          <el-input-number v-model="post.authorId" :min="0" :controls="false" placeholder="可选" />
        </el-form-item>
        <el-form-item label="封面图URL">
          <el-input v-model="post.coverImageUrl" placeholder="https://..." />
        </el-form-item>
        <el-form-item label="发布状态">
          <el-select v-model="post.isPublished" placeholder="选择状态" style="width: 200px;">
            <el-option :value="0" label="未发布" />
            <el-option :value="1" label="已发布" />
          </el-select>
        </el-form-item>
        <el-form-item label="发布时间">
          <el-date-picker
            v-model="post.publishedAt"
            type="datetime"
            placeholder="YYYY-MM-DD HH:mm:ss"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 260px;"
          />
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="card">
      <el-form label-width="40px">
        <el-form-item label="Slug">
          <el-input v-model="trans.slug" placeholder="文章短链（必填）" />
        </el-form-item>
        <el-form-item label="标题">
          <el-input v-model="trans.title" placeholder="标题（必填）" />
        </el-form-item>
        <el-form-item label="摘要">
          <el-input v-model="trans.summary" placeholder="摘要" />
        </el-form-item>

        <el-form-item label="正文">
          <!-- <ContentEditorQuill v-model="contentHtml" /> -->
          <ContentEditor v-model="contentHtml" />
        </el-form-item>
      </el-form>
    </el-card>

    <div class="footer-actions">
      <el-button type="primary" @click="submit" :loading="submitting">提交</el-button>
      <router-link to="/blog/posts"><el-button>取消</el-button></router-link>
      <el-text v-if="error" type="danger">{{ error }}</el-text>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import type { BlogPostCreateDTO, BlogPostTranslationCreateDTO, BlogPostTranslationUpdateDTO, BlogCategoryVO, BlogPostUpdateDTO, BlogUpdateDTO } from '@/types/blog'
import { fetchCategoryList, fetchBlogPostDetail, fetchSystemLanguages, updateBlogCombined, deletePostTranslation } from '@/api/blog'
import { ElMessageBox, ElMessage } from 'element-plus'
import ContentEditor from '@/components/ContentEditor.vue'

const router = useRouter()
const route = useRoute()

const submitting = ref(false)
const error = ref<string | null>(null)

const post = ref<BlogPostCreateDTO>({
  categoryId: undefined,
  authorId: undefined,
  coverImageUrl: '',
  isPublished: 0,
  publishedAt: '',
  lang: 'zh',
  title: '',
  slug: ''
})

const trans = ref<BlogPostTranslationCreateDTO>({
  lang: 'zh',
  slug: '',
  title: '',
  summary: '',
  contentMd: '',
  contentHtml: ''
})

const contentHtml = ref('')
const categories = ref<BlogCategoryVO[]>([])
const editId = ref<number | null>(null)
const isEdit = () => !!editId.value
const translationId = ref<number | null>(null)
const languages = ref<string[]>([])
const availableLangs = ref<string[]>([])
const activeLang = ref<string>('')
const postDetail = ref<any | null>(null)
const addLangSelect = ref<string | undefined>(undefined)
const addableLangs = computed(() => languages.value.filter(l => !availableLangs.value.includes(l)))
const showMeta = ref(false)

onMounted(async () => {
  try {
    // 加载系统语言列表
    try {
      const langRes = await fetchSystemLanguages()
      if ((langRes as any)?.code === 0 && Array.isArray((langRes as any)?.data)) {
        languages.value = (langRes as any).data as string[]
      }
    } catch {}

    // 加载分类列表（可选）
    try {
      const catRes = await fetchCategoryList()
      if ((catRes as any)?.code === 0 && Array.isArray((catRes as any)?.data)) {
        categories.value = (catRes as any).data as BlogCategoryVO[]
      }
    } catch {}

    // 解析编辑模式：支持 params.id 或 query.editId
    const paramId = route.params?.id as string | undefined
    const queryId = route.query?.editId as string | undefined
    const idStr = paramId || queryId
    if (idStr && !Number.isNaN(Number(idStr))) {
      editId.value = Number(idStr)
      // 预加载详情（包含 translations 数组）
      try {
        const baseRes = await fetchBlogPostDetail(editId.value)
        const base = (baseRes as any)?.data
        if (base) {
          postDetail.value = base
          post.value = {
            categoryId: base.categoryId ?? undefined,
            authorId: base.authorId ?? undefined,
            coverImageUrl: base.coverImageUrl ?? '',
            isPublished: base.isPublished ?? 0,
            publishedAt: base.publishedAt ?? '',
            // 从首个翻译回填必需字段，便于更新接口传参
            lang: base.translations?.[0]?.lang || 'zh',
            title: base.translations?.[0]?.title || '',
            slug: base.translations?.[0]?.slug || ''
          }
          const first = base.translations?.[0]
          if (first) {
            trans.value.lang = first.lang || trans.value.lang
            trans.value.slug = first.slug || ''
            trans.value.title = first.title || ''
            trans.value.summary = first.summary || ''
            contentHtml.value = first.contentHtml || ''
            activeLang.value = first.lang || 'zh'
          }
          availableLangs.value = Array.isArray(base.translations) ? (base.translations.map((t: any) => t?.lang).filter((x: any) => !!x)) : []
        }
      } catch {}
    }

    // ContentEditor 使用 v-model 绑定，不需要手动初始化
  } catch (e: any) {
    error.value = e?.message || '编辑器初始化失败'
  }
})

onBeforeUnmount(() => {})

// 切换语言：不重新请求，直接使用已加载的 translations
watch(activeLang, (lang) => {
  if (!postDetail.value || !Array.isArray(postDetail.value.translations)) return
  const t = postDetail.value.translations.find((x: any) => x?.lang === lang) || postDetail.value.translations[0]
  if (!t) return
  trans.value.lang = t.lang || (lang as string)
  trans.value.slug = t.slug || ''
  trans.value.title = t.title || ''
  trans.value.summary = t.summary || ''
  contentHtml.value = t.contentHtml || ''
})

// 添加新语言：加入 tabs 并切换到该语言
const addLanguage = (lang: string) => {
  if (!lang) return
  if (!availableLangs.value.includes(lang)) {
    availableLangs.value.push(lang)
  }
  // 在本地详情中补上一条空翻译，便于编辑
  if (postDetail.value) {
    const exists = Array.isArray(postDetail.value.translations) && postDetail.value.translations.find((x: any) => x?.lang === lang)
    if (!exists) {
      if (!Array.isArray(postDetail.value.translations)) postDetail.value.translations = []
      postDetail.value.translations.push({ lang, slug: '', title: '', summary: '', contentHtml: '' })
    }
  }
  activeLang.value = lang
  addLangSelect.value = undefined
}

// 删除指定语言翻译
const onDeleteLang = async (lang: string) => {
  try {
    if (!isEdit() || !editId.value) return
    await ElMessageBox.confirm(`确定删除语言 “${lang}” 的内容吗？`, '删除确认', { type: 'warning' })
    const res = await deletePostTranslation(editId.value, lang)
    const ok = (res as any)?.code === 0 || (res as any)?.data === true || (res as any) === true
    if (!ok) throw new Error((res as any)?.msg || '删除失败')
    // 本地移除
    availableLangs.value = availableLangs.value.filter(x => x !== lang)
    if (postDetail.value && Array.isArray(postDetail.value.translations)) {
      postDetail.value.translations = postDetail.value.translations.filter((x: any) => x?.lang !== lang)
    }
    // 切换到剩余第一个
    if (availableLangs.value.length) {
      activeLang.value = availableLangs.value[0]
    }
    ElMessage.success('删除成功')
  } catch (e: any) {
    if (e === 'cancel') return
    ElMessage.error(e?.message || '删除失败')
  }
}

const onTabCommand = (cmd: string, lang: string) => {
  if (cmd === 'delete') onDeleteLang(lang)
}

// ensure publishedAt has seconds with 'T' separator, e.g., 2025-10-27T15:47:26
const normalizeDateTime = (s?: string | null): string | undefined => {
  if (!s) return undefined
  // Accept: 'YYYY-MM-DD HH:mm', 'YYYY-MM-DD HH:mm:ss', 'YYYY-MM-DDTHH:mm', 'YYYY-MM-DDTHH:mm:ss'
  const s2 = s.replace(' ', 'T')
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s2)) return `${s2}:00`
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(s2)) return s2
  // fallback: try to parse and format
  const d = new Date(s2)
  if (isNaN(d.getTime())) return s
  const pad = (n: number) => String(n).padStart(2, '0')
  const y = d.getFullYear()
  const m = pad(d.getMonth() + 1)
  const day = pad(d.getDate())
  const hh = pad(d.getHours())
  const mm = pad(d.getMinutes())
  const ss = pad(d.getSeconds())
  return `${y}-${m}-${day}T${hh}:${mm}:${ss}`
}

const validate = (): string | null => {
  if (!trans.value.slug?.trim()) return '请填写 Slug'
  if (!trans.value.title?.trim()) return '请填写标题'
  return null
}

const submit = async () => {
  const v = validate()
  if (v) { error.value = v; return }
  try {
    submitting.value = true
    error.value = null
    if (isEdit() && editId.value) {
      // 编辑：使用合并接口一次性更新文章与翻译
      const postDto: BlogPostUpdateDTO = {
        id: editId.value,
        categoryId: post.value.categoryId ?? undefined,
        authorId: post.value.authorId ?? undefined,
        coverImageUrl: post.value.coverImageUrl ?? undefined,
        isPublished: post.value.isPublished ?? undefined,
        publishedAt: normalizeDateTime(post.value.publishedAt || undefined),
        isActive: 1
      }
      const translationDto: BlogPostTranslationUpdateDTO = {
        id: translationId.value || 0,
        postId: editId.value,
        lang: trans.value.lang,
        slug: trans.value.slug,
        title: trans.value.title,
        summary: trans.value.summary || null,
        contentMd: trans.value.contentMd || null,
        contentHtml: contentHtml.value || '',
        metaTitle: (trans.value as any).metaTitle || null,
        metaDescription: (trans.value as any).metaDescription || null,
        metaKeywords: (trans.value as any).metaKeywords || null,
        isActive: 1
      }
      const payload: BlogUpdateDTO = {
        post: postDto,
        translation: {
          // combined endpoint accepts translation without id; omit id if we don't have one
          postId: translationDto.postId,
          lang: translationDto.lang,
          slug: translationDto.slug,
          title: translationDto.title,
          summary: translationDto.summary || null,
          contentMd: translationDto.contentMd || null,
          contentHtml: translationDto.contentHtml || '',
          metaTitle: translationDto.metaTitle || null,
          metaDescription: translationDto.metaDescription || null,
          metaKeywords: translationDto.metaKeywords || null,
          isActive: translationDto.isActive || 1
        }
      }
      await updateBlogCombined(payload)
      router.push('/blog/posts')
    }
  } catch (e: any) {
    error.value = e?.msg || e?.message || '提交失败'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 16px; }
.page-header { display: flex; justify-content: space-between; align-items: center; }
.title { font-size: 20px; font-weight: 600; }
.actions { display: flex; gap: 8px; }
.card { background: #fff; border: 1px solid #ebeef5; border-radius: 8px; padding: 12px; }
.form { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 16px; }
.form-row { display: flex; flex-direction: column; gap: 6px; }
.form-row label { color: #606266; font-size: 12px; }
.input, .select { padding: 6px 10px; border: 1px solid #dcdfe6; border-radius: 6px; }
.editor { display: flex; flex-direction: column; gap: 6px; margin-top: 12px; }
.footer-actions { display: flex; align-items: center; gap: 12px; }
.btn { padding: 6px 12px; border: 1px solid #dcdfe6; background: #fff; border-radius: 6px; cursor: pointer; }
.btn.primary { background: #409eff; color: #fff; border-color: #409eff; }
.error { color: #f56c6c; }

/* Language tabs: widen and show actions only on hover */
.tab-label { display: inline-flex; align-items: center; gap: 6px; padding-right: 6px; }
.tab-actions { opacity: 0; transition: opacity .15s ease; cursor: pointer; user-select: none; }
.tab-label:hover .tab-actions { opacity: 0.9; }

/* Adjust element-plus tab item spacing */
:deep(.el-tabs__item) { padding: 0 18px; }
</style>
