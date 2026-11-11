import instance from '@/config/axios'
import axios from 'axios'
import { useUserStore } from '@/store/user'
import type { ApiResponse } from '@/types/api'
export interface CustomOrder {
  id: string; userId: number; planCode: string; priceCents: number; currency: string;
  email: string; deviceModel: string; requirements: string; assetName: string; previewName: string | null;
  transactionId: string | null; paymentStatus: string; workStatus: string; adminNote: string | null; createdAt: string;
}
export interface CustomOrderPage { list: CustomOrder[]; total: number; pageNum: number; pageSize: number }
export const pageCustomOrders = (params: Record<string, unknown>): Promise<ApiResponse<CustomOrderPage>> => instance.get('/admin/custom-watchface-orders', { params })
export const updateCustomOrder = (id: string, data: { workStatus: string; adminNote: string }): Promise<ApiResponse<CustomOrder>> => instance.put(`/admin/custom-watchface-orders/${id}`, data)
export const syncCustomOrder = (id: string): Promise<ApiResponse<CustomOrder>> => instance.post(`/admin/custom-watchface-orders/${id}/sync`)
export async function customOrderAttachment(id: string, kind: 'assets' | 'preview'): Promise<Blob> {
  const response = await axios.get(`/api/admin/custom-watchface-orders/${id}/attachments/${kind}`, {
    headers: { Authorization: `Bearer ${useUserStore().token}` }, withCredentials: true, responseType: 'blob', timeout: 180000,
  })
  return response.data
}
