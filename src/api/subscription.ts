import instance from '@/config/axios'
import type { ApiResponse } from '@/types/api'
import type { SubscriptionPlan, SubscriptionPlanDTO } from '@/types/subscription'

/**
 * 创建订阅计划
 * @param data 订阅计划数据
 */
export const createSubscriptionPlan = (data: SubscriptionPlanDTO): Promise<ApiResponse<SubscriptionPlan>> => {
  return instance.post('/admin/subscription/plans/create', data)
}

/**
 * 更新订阅计划
 * @param data 订阅计划数据
 */
export const updateSubscriptionPlan = (data: SubscriptionPlanDTO): Promise<ApiResponse<SubscriptionPlan>> => {
  return instance.post('/admin/subscription/plans/update', data)
}

/**
 * 根据编码获取订阅计划
 * @param planCode 计划编码
 */
export const getSubscriptionPlanByCode = (planCode: string): Promise<ApiResponse<SubscriptionPlan>> => {
  return instance.get(`/admin/subscription/plans/code/${planCode}`)
}

/**
 * 获取所有订阅计划列表
 */
export const getAllSubscriptionPlans = (): Promise<ApiResponse<SubscriptionPlan[]>> => {
  return instance.get('/admin/subscription/plans/list')
}

/**
 * 删除订阅计划
 * @param id 订阅计划ID
 */
export const deleteSubscriptionPlan = (id: number): Promise<ApiResponse<boolean>> => {
  return instance.post(`/admin/subscription/plans/delete/${id}`)
}
