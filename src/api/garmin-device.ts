import instance from '@/config/axios'
import type { ApiResponse } from '@/types/api'
import type { GarminDeviceVO, GarminDeviceCreateDTO, GarminDeviceUpdateDTO, GarminDevicePageQueryDTO } from '@/types/garmin-device'

const BASE = '/admin/products/garmin-devices'

export function createGarminDevice(dto: GarminDeviceCreateDTO) {
  return instance.post<ApiResponse<GarminDeviceVO>>(`${BASE}/create`, dto)
}

export function updateGarminDevice(id: number, dto: GarminDeviceUpdateDTO) {
  return instance.post<ApiResponse<GarminDeviceVO>>(`${BASE}/update/${id}`, dto)
}

export function deleteGarminDevice(id: number) {
  return instance.post<ApiResponse<boolean>>(`${BASE}/delete/${id}`)
}

export function getGarminDevice(id: number) {
  return instance.get<ApiResponse<GarminDeviceVO>>(`${BASE}/${id}`)
}

export function pageGarminDevices(dto: GarminDevicePageQueryDTO) {
  return instance.post<ApiResponse<{ list: GarminDeviceVO[]; total: number }>>(`${BASE}/page`, dto)
}
