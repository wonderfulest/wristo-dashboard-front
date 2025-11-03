import instance from '@/config/axios'
import type { ApiResponse, PageResponse } from '@/types/api'
import type {
  BlogPostVO,
  BlogPostPageQueryDTO,
  BlogPostCreateDTO,
  BlogCategoryVO,
  BlogCategoryPageQueryDTO,
  BlogCategoryCreateDTO,
  BlogCategoryUpdateDTO,
  BlogUpdateDTO,
  BlogTagVO,
  BlogTagPageQueryDTO,
  BlogTagCreateDTO,
  BlogTagUpdateDTO,
  BlogTagTranslationVO,
  BlogTagTranslationDTO,
  BlogPostTocItemVO,
  BlogPostTocItemCreateDTO,
  BlogPostTocItemUpdateDTO,
  BlogPostTocItemTreeQueryDTO,
  BlogPostSearchDTO,
  BlogPostTocBindDTO,
  BlogPostTocItemTranslationVO
} from '@/types/blog'


export function fetchBlogPostPage(dto: BlogPostPageQueryDTO): Promise<ApiResponse<PageResponse<BlogPostVO>>> {
  return instance.post(`/admin/blog/posts/page?populate=translations,category,author`, dto)
}

export function createBlogPost(dto: BlogPostCreateDTO): Promise<ApiResponse<BlogPostVO>> {
  return instance.post(`/admin/blog/posts/create`, dto)
}

export function deleteBlogPost(id: number): Promise<ApiResponse<boolean>> {
  return instance.post(`/admin/blog/posts/delete`, { id })
}

export function fetchBlogPostDetail(id: number): Promise<ApiResponse<BlogPostVO>> {
  return instance.get(`/admin/blog/posts/detail?populate=*`, { params: { id } })
}

// Combined update (post + translation)
export function updateBlogCombined(dto: BlogUpdateDTO): Promise<ApiResponse<any>> {
  return instance.post(`/admin/blog/posts/update`, dto)
}

// Delete a specific translation by language
export function deletePostTranslation(postId: number, lang: string): Promise<ApiResponse<boolean>> {
  return instance.post(`/admin/blog/posts/delete/translation`, null, { params: { id: postId, lang } })
}

// Update publish status for a post (partial update via combined update endpoint)
export function updatePostIsPublished(id: number, isPublished: number): Promise<ApiResponse<boolean>> {
  // Backend is expected to accept a payload with only the 'post' object for partial update
  return instance.post(`/admin/blog/posts/update`, { post: { id, isPublished } } as any)
}

// Category APIs
const CAT_BASE = '/admin/blog/categories'

export function fetchCategoryPage(dto: BlogCategoryPageQueryDTO): Promise<ApiResponse<PageResponse<BlogCategoryVO>>> {
  return instance.post(`${CAT_BASE}/page`, dto)
}

export function createCategory(dto: BlogCategoryCreateDTO, langCode?: string): Promise<ApiResponse<BlogCategoryVO>> {
  return instance.post(`${CAT_BASE}/create`, dto, { params: langCode ? { langCode } : undefined })
}

export function updateCategory(id: number, dto: BlogCategoryUpdateDTO, langCode?: string): Promise<ApiResponse<BlogCategoryVO>> {
  return instance.post(`${CAT_BASE}/update/${id}`, dto, { params: langCode ? { langCode } : undefined })
}

export function deleteCategory(id: number): Promise<ApiResponse<boolean>> {
  return instance.post(`${CAT_BASE}/delete/${id}`)
}

export function fetchCategoryList(): Promise<ApiResponse<BlogCategoryVO[]>> {
  return instance.get(`${CAT_BASE}/list`)
}

// Tag APIs
const TAG_BASE = '/admin/blog/tags'

export function fetchTagPage(dto: BlogTagPageQueryDTO, lang?: string): Promise<ApiResponse<PageResponse<BlogTagVO>>> {
  const params = lang ? { lang } : undefined
  return instance.post(`${TAG_BASE}/page?populate=translations`, dto, { params })
}

export function createTag(dto: BlogTagCreateDTO): Promise<ApiResponse<BlogTagVO>> {
  return instance.post(`${TAG_BASE}/create`, dto)
}

export function updateTag(id: number, dto: BlogTagUpdateDTO): Promise<ApiResponse<BlogTagVO>> {
  return instance.post(`${TAG_BASE}/update/${id}`, dto)
}

export function deleteTag(id: number): Promise<ApiResponse<boolean>> {
  return instance.post(`${TAG_BASE}/delete/${id}`)
}

// Tag Translation APIs
export function createTagTranslation(tagId: number, dto: BlogTagTranslationDTO): Promise<ApiResponse<BlogTagTranslationVO>> {
  return instance.post(`${TAG_BASE}/${tagId}/translations`, dto)
}

export function updateTagTranslation(tagId: number, lang: string, dto: BlogTagTranslationDTO): Promise<ApiResponse<BlogTagTranslationVO>> {
  return instance.put(`${TAG_BASE}/${tagId}/translations/${lang}`, dto)
}

export function deleteTagTranslation(tagId: number, lang: string): Promise<ApiResponse<boolean>> {
  return instance.delete(`${TAG_BASE}/${tagId}/translations/${lang}`)
}

export function fetchTagTranslations(tagId: number): Promise<ApiResponse<BlogTagTranslationVO[]>> {
  return instance.get(`${TAG_BASE}/${tagId}/translations`)
}

export function fetchTagTranslation(tagId: number, lang: string): Promise<ApiResponse<BlogTagTranslationVO>> {
  return instance.get(`${TAG_BASE}/${tagId}/translations/${lang}`)
}

export function saveTagTranslations(tagId: number, translations: BlogTagTranslationDTO[]): Promise<ApiResponse<boolean>> {
  return instance.post(`${TAG_BASE}/${tagId}/translations/batch`, translations)
}

// Public Tag APIs
const TAG_PUBLIC_BASE = '/public/blog/tags'

// Fetch all tags (names localized by optional lang)
export function fetchPublicAllTags(lang?: string): Promise<ApiResponse<BlogTagVO[]>> {
  return instance.get(`${TAG_PUBLIC_BASE}/all`, { params: lang ? { lang } : undefined })
}


// Blog TOC item APIs
const TOC_BASE = '/admin/blog/toc'

export function fetchTocTree(dto: BlogPostTocItemTreeQueryDTO, lang?: string): Promise<ApiResponse<BlogPostTocItemVO[]>> {
  return instance.post(
    `${TOC_BASE}/tree?populate=post,translations,category,author`,
    dto,
    { params: lang ? { lang } : undefined }
  )
}

export function createTocItem(dto: BlogPostTocItemCreateDTO): Promise<ApiResponse<BlogPostTocItemVO>> {
  return instance.post(`${TOC_BASE}/create`, dto)
}

export function updateTocItem(dto: BlogPostTocItemUpdateDTO): Promise<ApiResponse<BlogPostTocItemVO>> {
  return instance.post(`${TOC_BASE}/update`, dto)
}

export function deleteTocItem(id: number): Promise<ApiResponse<boolean>> {
  return instance.post(`${TOC_BASE}/delete/${id}`)
}

// Fetch a single toc item detail (with translations)
export function fetchTocItemDetail(id: number): Promise<ApiResponse<BlogPostTocItemVO>> {
  return instance.get(`${TOC_BASE}/detail/${id}`)
}

// Fetch translations for a toc item
export function fetchTocItemTranslations(id: number): Promise<ApiResponse<BlogPostTocItemTranslationVO[]>> {
  return instance.get(`${TOC_BASE}/translations/${id}`)
}

// Search posts
export function searchBlogPosts(dto: BlogPostSearchDTO): Promise<ApiResponse<BlogPostVO[]>> {
  return instance.post(`/admin/blog/posts/search`, dto)
}

// Bind toc item to post
export function bindTocItemPost(dto: BlogPostTocBindDTO): Promise<ApiResponse<boolean>> {
  return instance.post(`/admin/blog/toc/bind`, dto)
}
