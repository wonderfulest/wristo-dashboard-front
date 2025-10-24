import type { PageResponse, ApiResponse, PageQueryDTO } from '@/types/api'

export interface GarminDeviceVO {
  id: number
  deviceId: string
  partNumber: string
  deviceFamily: string
  deviceGroup: string
  deviceVersion: string
  displayName: string
  displayType: string
  enhancedGraphicSupport: boolean
  hardwarePartNumber: string
  imageUrl: string
  pixelFormat: string
  resolutionHeight: number
  resolutionWidth: number
  screenRotationSupport: boolean
  createdAt?: string
}

export interface GarminDeviceCreateDTO {
  deviceId?: string
  partNumber?: string
  deviceFamily?: string
  deviceGroup?: string
  deviceVersion?: string
  displayName?: string
  displayType?: string
  enhancedGraphicSupport?: boolean
  hardwarePartNumber?: string
  imageUrl?: string
  pixelFormat?: string
  resolutionHeight?: number
  resolutionWidth?: number
  screenRotationSupport?: boolean
}

export interface GarminDeviceUpdateDTO extends GarminDeviceCreateDTO {}

export interface GarminDevicePageQueryDTO extends PageQueryDTO {
  keyword?: string
}

export type GarminDevicePageResp = ApiResponse<PageResponse<GarminDeviceVO>>
export type GarminDeviceResp = ApiResponse<GarminDeviceVO>
