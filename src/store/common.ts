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
  }
})
