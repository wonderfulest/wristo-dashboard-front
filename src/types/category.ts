import type { ImageVO } from '@/types/image'

export interface Category {
  id: number
  name: string
  slug: string
  bannerId?: number | null
  banner?: ImageVO | null
  heroId?: number | null
  hero?: ImageVO | null
  sort: number
  isActive: number
}

export interface CategoryPageQuery {
  pageNum: number
  pageSize: number
  orderBy?: string
}

export interface CategoryPageData {
  pageNum: number
  pageSize: number
  total: number
  pages: number
  list: Category[]
}

export interface CreateCategoryDto {
  name: string
  slug: string
  heroId?: number | null
  bannerId?: number | null
}