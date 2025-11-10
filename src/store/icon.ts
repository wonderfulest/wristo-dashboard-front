import { defineStore } from 'pinia'
import { listIconLibrary } from '@/api/icon-library'
import type { IconLibraryVO } from '@/types/icon-library'

export const useIconStore = defineStore('icon', {
  state: () => ({
    icons: [] as IconLibraryVO[],
    loaded: false,
    loading: false,
    error: null as string | null
  }),
  getters: {
    byCategory: (state) => {
      return (category?: string) => {
        if (!category) return state.icons
        return state.icons.filter((it) => it?.category === category)
      }
    },
    idLabelMap: (state): Record<number, string> => {
      const map: Record<number, string> = {}
      for (const it of state.icons) {
        if (typeof it?.id === 'number' && typeof it?.label === 'string') {
          map[it.id] = it.label
        }
      }
      return map
    }
  },
  actions: {
    async ensureLoaded() {
      if (this.loaded || this.loading) return
      this.loading = true
      this.error = null
      try {
        const resp = (await listIconLibrary()) as any
        const list: IconLibraryVO[] = resp?.data?.data || resp?.data || []
        this.icons = Array.isArray(list) ? list : []
        this.loaded = true
      } catch (e: any) {
        this.error = e?.message || 'Failed to load icon library'
      } finally {
        this.loading = false
      }
    }
  }
})
