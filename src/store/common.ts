import { defineStore } from 'pinia'
import { listEnumOptions, type EnumOption } from '@/api/common'

interface EnumState {
  options: Record<string, EnumOption[]>
  loading: Record<string, boolean>
  loaded: Record<string, boolean>
  error: Record<string, string | null>
}

// ===== Typed helpers for specific enums =====
export const ANALOG_ASSET_TYPE_ENUM_NAME = 'AnalogAssetType'
export const IMAGE_ASPECT_ENUM_NAME = 'ImageAspectEnum'
export const DESIGN_FONT_TYPE_ENUM_NAME = 'DesignFontType'
export const DISPLAY_TYPE_ENUM_NAME = 'DisplayType'
export const ICON_CATEGORY_ENUM_NAME = 'IconCategory'
export const DATA_TYPE_CATEGORY_ENUM_NAME = 'DataTypeCategory'
export const WEBSITE_BANNER_LINK_TYPE_ENUM_NAME = 'com.wukong.face.modules.website.enums.BannerLinkType'
export const GA_SHORT_LINK_STATUS_ENUM_NAME = 'com.wukong.face.modules.ga.enums.ShortLinkStatus'
export const GA_SHORT_LINK_CHANNEL_ENUM_NAME = 'com.wukong.face.modules.ga.enums.ShortLinkChannel'
export const GA_SHORT_LINK_PLATFORM_ENUM_NAME = 'com.wukong.face.modules.ga.enums.ShortLinkPlatform'

// ===== Store =====
export const useEnumStore = defineStore('enum', {
  state: (): EnumState => ({
    options: {},
    loading: {},
    loaded: {},
    error: {}
  }),
  getters: {
    getOptions: (state) => {
      return (name: string): EnumOption[] => state.options[name] || []
    }
  },
  actions: {
    async getEnumOptions(name: string): Promise<EnumOption[]> {
      await this.ensureOptions(name)
      return this.getOptions(name)
    },
    async ensureOptions(name: string) {
      if (this.loaded[name] || this.loading[name]) return
      this.loading[name] = true
      this.error[name] = null
      try {
        const resp = (await listEnumOptions(name)) as any
        const list: EnumOption[] = resp?.data?.data || resp?.data || []
        this.options[name] = Array.isArray(list) ? list : []
        this.loaded[name] = true
      } catch (e: any) {
        this.error[name] = e?.message || 'Failed to load enum options'
      } finally {
        this.loading[name] = false
      }
    }
  },
  persist: {
    key: 'wristo-enums',
    storage: sessionStorage,
    pick: ['options', 'loaded']
  }
})
