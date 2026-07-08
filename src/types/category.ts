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
  appCount?: number | null
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

export type ProductTagGroup = 'style' | 'function' | 'scene' | 'seasonal' | 'device' | 'meta' | string

export interface ProductTag {
  id: number
  name: string
  slug: string
  tagGroup: ProductTagGroup
  sort: number
  status: number
  description?: string | null
  appCount?: number | null
  createdAt?: string | null
  updatedAt?: string | null
}

export interface ProductTagPageQuery {
  pageNum: number
  pageSize: number
  orderBy?: string
  keyword?: string
  tagGroup?: string
  status?: number
}

export interface ProductTagPageData {
  pageNum: number
  pageSize: number
  total: number
  pages: number
  list: ProductTag[]
}

export interface ProductTagMutationPayload {
  name: string
  slug: string
  tagGroup: string
  sort?: number
  status?: number
  description?: string
}
