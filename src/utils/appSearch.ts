import type { Product, ProductBase } from '@/types/product'

type AppSearchResult = Product | ProductBase

interface AppSearchResponse<T> {
  code: number
  data?: T | null
}

interface AppSearchDependencies {
  getByAppId: (appId: number) => Promise<AppSearchResponse<Product>>
  searchByName: (
    keyword: string,
    pageNum: number,
    pageSize: number
  ) => Promise<AppSearchResponse<{ list?: ProductBase[] }>>
}

export const searchApps = async (
  query: string,
  dependencies: AppSearchDependencies
): Promise<AppSearchResult[]> => {
  const keyword = query.trim()
  if (!keyword) return []

  if (/^\d+$/.test(keyword)) {
    const appId = Number(keyword)
    if (!Number.isSafeInteger(appId) || appId <= 0) return []

    const response = await dependencies.getByAppId(appId)
    return response.code === 0 && response.data ? [response.data] : []
  }

  const response = await dependencies.searchByName(keyword, 1, 20)
  return response.code === 0 ? response.data?.list || [] : []
}
