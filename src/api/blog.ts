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
  BlogPostTocItemVO,
  BlogPostTocItemCreateDTO,
  BlogPostTocItemUpdateDTO,
  BlogPostTocItemTreeQueryDTO,
  BlogPostSearchDTO,
  BlogPostTocBindDTO
} from '@/types/blog'

const BASE = '/admin/blog/posts'
const SYS_PUBLIC_BASE = '/public/system'

export function fetchBlogPostPage(dto: BlogPostPageQueryDTO): Promise<ApiResponse<PageResponse<BlogPostVO>>> {
  return instance.post(`${BASE}/page?populate=translations,category,author`, dto)
}

export function createBlogPost(dto: BlogPostCreateDTO): Promise<ApiResponse<BlogPostVO>> {
  return instance.post(`${BASE}/create`, dto)
}

export function deleteBlogPost(id: number): Promise<ApiResponse<boolean>> {
  return instance.post(`${BASE}/delete`, { id })
}

export function fetchBlogPostDetail(id: number): Promise<ApiResponse<BlogPostVO>> {
  return instance.get(`${BASE}/detail?populate=*`, { params: { id } })
}

// Combined update (post + translation)
export function updateBlogCombined(dto: BlogUpdateDTO): Promise<ApiResponse<any>> {
  return instance.post(`${BASE}/update`, dto)
}

// Delete a specific translation by language
export function deletePostTranslation(postId: number, lang: string): Promise<ApiResponse<boolean>> {
  return instance.post(`${BASE}/delete/translation`, null, { params: { id: postId, lang } })
}

// Update publish status for a post (partial update via combined update endpoint)
export function updatePostIsPublished(id: number, isPublished: number): Promise<ApiResponse<boolean>> {
  // Backend is expected to accept a payload with only the 'post' object for partial update
  return instance.post(`${BASE}/update`, { post: { id, isPublished } } as any)
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

// System public APIs
export function fetchSystemLanguages(): Promise<ApiResponse<string[]>> {
  return instance.get(`${SYS_PUBLIC_BASE}/languages`)
}

// Blog TOC item APIs
const TOC_BASE = '/admin/blog/toc-items'

export function fetchTocTree(dto: BlogPostTocItemTreeQueryDTO): Promise<ApiResponse<BlogPostTocItemVO[]>> {
  return instance.post(`${TOC_BASE}/tree?populate=post,translations,category,author`, dto)
}

export function createTocItem(dto: BlogPostTocItemCreateDTO): Promise<ApiResponse<BlogPostTocItemVO>> {
  return instance.post(`${TOC_BASE}/create`, dto)
}

export function updateTocItem(dto: BlogPostTocItemUpdateDTO): Promise<ApiResponse<BlogPostTocItemVO>> {
  return instance.post(`${TOC_BASE}/update`, dto)
}

export function deleteTocItem(id: number): Promise<ApiResponse<boolean>> {
  return instance.post(`${TOC_BASE}/delete`, { id })
}

// Search posts
export function searchBlogPosts(dto: BlogPostSearchDTO): Promise<ApiResponse<BlogPostVO[]>> {
  return instance.post(`${BASE}/search`, dto)
}

// Bind toc item to post
export function bindTocItemPost(dto: BlogPostTocBindDTO): Promise<ApiResponse<boolean>> {
  return instance.post(`/admin/blog/toc-items/bind`, dto)
}
