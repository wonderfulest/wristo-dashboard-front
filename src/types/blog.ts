export interface BlogPostVO {
  id: number
  categoryId?: number | null
  authorId?: number | null
  coverImageUrl?: string | null
  isPublished?: number | null
  publishedAt?: string | null
  viewCount?: number | null
  createdAt?: string | null
  updatedAt?: string | null
  translations?: BlogPostTranslationVO[]
  author?: UserBaseVO | null
  category?: BlogCategoryVO | null
  tags?: BlogTagVO[]
}

export interface BlogPostPageQueryDTO {
  pageNum: number
  pageSize: number
  categoryId?: number | null
  authorId?: number | null
  isPublished?: number | null
  isActive?: number | null
  startTime?: string | null
  endTime?: string | null
  keyword?: string | null
}

export interface BlogPostCreateDTO {
  categoryId?: number | null
  authorId?: number | null
  coverImageUrl?: string | null
  isPublished?: number | null
  publishedAt?: string | null
  // default translation metadata for initial creation
  lang: string
  title: string
  slug: string
}

export interface BlogPostUpdateDTO {
  id: number
  categoryId?: number | null
  authorId?: number | null
  coverImageUrl?: string | null
  isPublished?: number | null
  publishedAt?: string | null
  isActive?: number | null
}

export interface BlogPostTranslationCreateDTO {
  postId?: number | null
  lang: string
  slug: string
  title: string
  summary?: string | null
  contentMd?: string | null
  contentHtml?: string | null
  metaTitle?: string | null
  metaDescription?: string | null
  metaKeywords?: string | null
}

export interface BlogPostTranslationUpdateDTO extends BlogPostTranslationCreateDTO {
  id: number
  isActive?: number | null
}

export interface CombinedBlogPostTranslationUpdateDTO {
  postId?: number | null
  lang: string
  slug: string
  title: string
  summary?: string | null
  contentMd?: string | null
  contentHtml?: string | null
  metaTitle?: string | null
  metaDescription?: string | null
  metaKeywords?: string | null
  isActive?: number | null
}

export interface BlogUpdateDTO {
  post: BlogPostUpdateDTO
  translation: CombinedBlogPostTranslationUpdateDTO
}

export interface BlogPostTranslationVO {
  lang: string
  slug: string
  title: string
  summary?: string | null
  contentHtml?: string | null
}

// Category types
export interface BlogCategoryVO {
  id: number
  slug: string
  isActive?: number | null
  createdAt?: string | null
  updatedAt?: string | null
  // translation fields
  lang?: string | null
  name?: string | null
  description?: string | null
}

export interface BlogCategoryCreateDTO {
  slug: string
}

export interface BlogCategoryUpdateDTO {
  id: number
  slug: string
  isActive?: number | null
}

export interface BlogCategoryPageQueryDTO {
  pageNum: number
  pageSize: number
  keyword?: string | null
  isActive?: number | null
  lang?: string | null
}

export interface BlogTagVO {
  id: number
  slug: string
  isActive?: number | null
  createdAt?: string | null
  updatedAt?: string | null
}

export interface UserBaseVO {
  id: number
  username?: string | null
  nickname?: string | null
}
