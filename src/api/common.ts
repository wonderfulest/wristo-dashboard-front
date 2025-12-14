import instance from '@/config/axios'
import type { ApiResponse } from '@/types/api'

export interface EnumOption {
  name: string
  value: string
  category?: string
  description?: string
}

let enumNameMapPromise: Promise<Record<string, string>> | null = null

export function listEnumNames() {
  return instance.get<ApiResponse<EnumOption[]>>('/public/common/enums/names')
}

async function ensureEnumNameMap(): Promise<Record<string, string>> {
  if (enumNameMapPromise) return enumNameMapPromise
  enumNameMapPromise = (async () => {
    try {
      const resp = (await listEnumNames()) as any
      const list: EnumOption[] = resp?.data?.data || resp?.data || []
      const map: Record<string, string> = {}
      for (const it of list || []) {
        if (it?.name && it?.value) {
          map[it.name] = it.value
        }
      }
      return map
    } catch {
      return {}
    }
  })()
  return enumNameMapPromise
}

export function listEnumOptions(name: string) {
  return (async () => {
    let enumClassName = name
    if (name && !name.includes('.')) {
      const map = await ensureEnumNameMap()
      enumClassName = map[name] || name
    }
    return instance.get<ApiResponse<EnumOption[]>>('/public/common/enums/options', { params: { name: enumClassName } })
  })()
}
