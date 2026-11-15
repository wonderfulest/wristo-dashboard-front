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
  ) => Promise<AppSearchResponse<{ list?: AppSearchResult[] }>>
}

/** Shared by list filters and remote application selectors. Invalid numeric IDs never broaden a query. */
export const appSearchParams = (query: string): { appId?: number; name?: string } => {
  const keyword = query.trim()
  if (!keyword) return {}
  if (/^\d+$/.test(keyword)) {
    const appId = Number(keyword)
    return { appId: Number.isSafeInteger(appId) && appId > 0 ? appId : 0 }
  }
  return { name: keyword }
}

export const searchApps = async (
  query: string,
  dependencies: AppSearchDependencies
): Promise<AppSearchResult[]> => {
  const { appId, name } = appSearchParams(query)
  if (appId !== undefined) {
    if (!appId) return []

    const response = await dependencies.getByAppId(appId)
    return response.code === 0 && response.data ? [response.data] : []
  }

  if (!name) return []
  const response = await dependencies.searchByName(name, 1, 20)
  return response.code === 0 ? response.data?.list || [] : []
}
