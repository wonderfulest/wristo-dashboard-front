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
  devicePng?: string
  pixelFormat: string
  bitsPerPixel?: number
  resolutionHeight: number
  resolutionWidth: number
  screenRotationSupport: boolean
  createdAt?: string
  simulator?: SimulatorConfig
  compiler?: CompilerConfig
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
  displayName?: string
}

export type GarminDevicePageResp = ApiResponse<PageResponse<GarminDeviceVO>>
export type GarminDeviceResp = ApiResponse<GarminDeviceVO>

// ---- Simulator Config Types ----
export interface SimulatorConfig {
  appStorageCapacity?: number
  complications?: SimulatorComplications
  constellationConfiguration?: SimulatorConstellationConfiguration[]
  display?: SimulatorDisplay
  flashlightConfiguration?: SimulatorFlashlightConfiguration[]
  fontScaling?: SimulatorFontScaling
  fonts?: SimulatorFontSet[]
  glance?: SimulatorGlance
  graphicsResourcePoolSize?: number
  greenshiftSupport?: boolean
  image?: string
  keys?: SimulatorKey[]
  layouts?: any[]
  minimumRequiredSimulatorVersion?: string
  orangeshiftSupport?: boolean
  ppi?: number
  redshiftSupport?: boolean
  screenProtectionSupport?: boolean
  sensorHistory?: SimulatorSensorHistory[]
  sensorSampleRate?: SimulatorSensorSampleRate
  solarChargingSupport?: boolean
  watchdogCount?: number
  wifiExclusions?: string[]
}

export interface SimulatorComplications { time?: { showAmPm?: boolean } }

export interface SimulatorConstellationConfiguration { configuration?: string[]; name?: string }

export interface SimulatorDisplay {
  behaviors?: SimulatorDisplayBehavior[]
  isTouch?: boolean
  landscapeOrientation?: number
  location?: SimulatorDisplayLocation
  shape?: string
}

export interface SimulatorDisplayBehavior {
  gesture?: string
  id?: string
  maxDistToEdge?: number
  maxSwipeDuration?: number
  minSwipeDeltaX?: number
  minSwipeDeltaY?: number
}

export interface SimulatorDisplayLocation { height?: number; width?: number; x?: number; y?: number }

export interface SimulatorFlashlightConfiguration { colors?: string[]; name?: string }

export interface SimulatorFontScaling { fontScaleMax?: number; fontScaleMin?: number }

export interface SimulatorFontSet { fontSet?: string; fonts?: SimulatorFont[] }

export interface SimulatorFont {
  ascent?: number
  descent?: number
  filename?: string
  height?: number
  name?: string
  size?: number
  type?: string
}

export interface SimulatorGlance {
  cacheUpdate?: boolean
  contentArea?: SimulatorGlanceArea
  iconArea?: SimulatorGlanceArea
  liveUpdates?: boolean
  themes?: { area?: SimulatorGlanceArea; themes?: SimulatorGlanceTheme[] }
}

export interface SimulatorGlanceArea { height?: number; width?: number; x?: number; y?: number }

export interface SimulatorGlanceTheme { filename?: string; name?: string }

export interface SimulatorKey { behavior?: string; id?: string; isHold?: boolean; location?: SimulatorDisplayLocation }

export interface SimulatorSensorHistory { interval?: number; size?: number; type?: string }

export interface SimulatorSensorSampleRate { highFrequencyRate?: boolean; maxAccelRate?: number; maxGyroRate?: number; maxMagRate?: number }

// ---- Compiler Config Types ----
export interface CompilerConfig {
  alphaBlendingSupport?: boolean
  appTypes?: CompilerAppType[]
  bitsPerPixel?: number
  deviceFamily?: string
  deviceGroup?: string
  deviceId?: string
  deviceVersion?: string
  displayName?: string
  displayType?: string
  faceIt?: { analogHandles?: string[]; digitalFonts?: string[]; fontColors?: string[]; templates?: string[] }
  hardwarePartNumber?: string
  imageUrl?: string
  launcherIcon?: { height?: number; width?: number }
  orientation?: number
  palette?: { colors?: string[] }
  partNumbers?: CompilerPartNumber[]
  resolution?: { height?: number; width?: number }
  screenRotationSupport?: boolean
  webDocDeviceGroup?: string
  worldWidePartNumber?: string
  enhancedGraphicSupport?: boolean
}

export interface CompilerAppType { memoryLimit?: number; type?: string }

export interface CompilerLanguage { code?: string; fontSet?: string }

export interface CompilerPartNumber {
  connectIQVersion?: string
  firmwareVersion?: number | null
  languages?: CompilerLanguage[]
  number?: string
}
