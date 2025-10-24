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

// Multipart versions for new backend (ModelAttribute + Multipart)
export function createGarminDeviceForm(params: {
  deviceId: string
  simulatorFile?: File
  compilerFile?: File
  devicePngFile?: File
}) {
  const form = new FormData()
  form.append('deviceId', params.deviceId)
  if (params.simulatorFile) form.append('simulator', params.simulatorFile)
  if (params.compilerFile) form.append('compiler', params.compilerFile)
  if (params.devicePngFile) form.append('devicePngFile', params.devicePngFile)
  return instance.post<ApiResponse<GarminDeviceVO>>(`${BASE}/create`, form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export function updateGarminDeviceForm(params: {
  deviceId: string
  simulatorFile?: File
  compilerFile?: File
  devicePngFile?: File
}) {
  const form = new FormData()
  form.append('deviceId', params.deviceId)
  if (params.simulatorFile) form.append('simulator', params.simulatorFile)
  if (params.compilerFile) form.append('compiler', params.compilerFile)
  if (params.devicePngFile) form.append('devicePngFile', params.devicePngFile)
  return instance.post<ApiResponse<GarminDeviceVO>>(`${BASE}/update`, form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}
