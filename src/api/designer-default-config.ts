import instance from '@/config/axios'
import type { ApiResponse } from '@/types/api'
import type { DesignerDefaultConfigVO } from '@/types/designer-default-config'

const BASE = '/admin/design/designer-default-config'

export function getDesignerDefaultConfigByUser(userId: number): Promise<ApiResponse<DesignerDefaultConfigVO | null>> {
  return instance.get(`${BASE}/by-user/${userId}`)
}
