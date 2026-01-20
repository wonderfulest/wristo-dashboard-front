import instance from '@/config/axios'
import type { ApiResponse, PageResponse } from '@/types/api'
import type { Product, ProductPackagingLogQuery, ProductPackagingLogVO, ProductPageQuery } from '@/types/product'

// 根据设备型号,分页查询未支持的应用列表,默认按下载量倒序
export interface UnSupportDevicePageQueryDTO {
  deviceId?: number
  pageNum: number
  pageSize: number
  orderBy?: string // e.g. 'download:desc'
}

export const fetchUnSupportByDevicePage = (
  params: UnSupportDevicePageQueryDTO
): Promise<ApiResponse<PageResponse<Product>>> => {
  return instance.post('/admin/products/page/device-un-support?populate=*', params)
}

export const fetchProductPage = (params: ProductPageQuery): Promise<ApiResponse<PageResponse<Product>>> => {
  return instance.post('/admin/products/page?populate=*', params)
}

// 分页查询打包日志
export const getProductPackagingLogsPage = (params: ProductPackagingLogQuery): Promise<ApiResponse<PageResponse<ProductPackagingLogVO>>> => {
  return instance.post('/admin/products/packaging-log/page?populate=*', params)
} 

// 重新提交打包任务到队列
export const requeueProductPackagingLog = (
  id: number,
  priority: number
): Promise<ApiResponse<void>> => {
  return instance.post(`/admin/product-packaging-logs/${id}/requeue`, null, {
    params: { priority }
  })
}

// 手动清理打包任务队列锁
export const clearProductPackagingQueueLock = (): Promise<ApiResponse<void>> => {
  return instance.delete('/admin/product-packaging-logs/queue/lock')
}

// 设置打包任务队列暂停开关
export const setProductPackagingQueuePause = (paused: boolean): Promise<ApiResponse<void>> => {
  return instance.post('/admin/product-packaging-logs/queue/pause', null, {
    params: { paused }
  })
}

// 获取打包任务队列列表
export const getProductPackagingQueue = (
  populate: string = '*'
): Promise<ApiResponse<ProductPackagingLogVO[]>> => {
  return instance.get('/admin/product-packaging-logs/queue', {
    params: { populate }
  })
}

// 获取当前正在打包中的任务（基于队列锁标记）
export const getLockedProductPackagingTask = (
  populate: string = '*'
): Promise<ApiResponse<ProductPackagingLogVO | null>> => {
  return instance.get('/admin/product-packaging-logs/queue/locked', {
    params: { populate }
  })
}

// 从打包任务队列中移除任务
export const removeProductPackagingQueueItem = (
  id: number
): Promise<ApiResponse<void>> => {
  return instance.delete(`/admin/product-packaging-logs/queue/${id}`)
}

// 更新打包任务优先级
export const updateProductPackagingQueuePriority = (
  id: number,
  priority: number
): Promise<ApiResponse<void>> => {
  return instance.post(`/admin/product-packaging-logs/queue/${id}/priority`, null, {
    params: { priority }
  })
}

// 查询单个产品
export const getProduct = (appId: number): Promise<ApiResponse<Product>> => {
  return instance.get(`/admin/products/${appId}`)
}

// 更新产品
export const updateProduct = (appId: number, data: Partial<Product>): Promise<ApiResponse<Product>> => {
  return instance.post(`/admin/products/update/${appId}`, data)
}

// 更新产品状态
export const updateProductStatus = (appId: number, isActive: number): Promise<ApiResponse<Product>> => {
  return instance.post(`/admin/products/active/${appId}/${isActive}`)
}

// 切换产品上架/下架状态
export const toggleProductStatus = (appId: number, status: number): Promise<ApiResponse<boolean>> => {
  return instance.post(`/admin/products/status/${appId}/${status}`)
}

// 更新产品分类
export const updateProductCategories = (appId: number, categoryIds: number[]): Promise<ApiResponse<Product>> => {
  return instance.post(`/admin/products/category/${appId}`, { categoryIds })
}

// 添加分类
export const addProductCategory = (appId: number, categoryId: number): Promise<ApiResponse<Product>> => {
  return instance.post(`/admin/products/category/${appId}/add?categoryId=${categoryId}`)
}

// 删除分类
export const deleteProductCategory = (appId: number, categoryId: number): Promise<ApiResponse<Product>> => {
  return instance.post(`/admin/products/category/${appId}/delete?categoryId=${categoryId}`)
}

// 从佳明应用商城删除，同步清理 uuid 和 store url
export const deleteProductFromGarmin = (appId: number): Promise<ApiResponse<boolean>> => {
  return instance.post('/admin/products/delete-from-garmin', null, {
    params: { appId }
  })
}

// 一键下线某个设计师的所有产品
export const downAllProductsByUser = (userId: number): Promise<ApiResponse<boolean>> => {
  return instance.post(`/admin/products/down/${userId}`)
}

// 一键上架某个设计师的所有产品
export const upAllProductsByUser = (userId: number): Promise<ApiResponse<boolean>> => {
  return instance.post(`/admin/products/up/${userId}`)
}
