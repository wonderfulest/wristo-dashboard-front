
import instance from '@/config/axios'
import type { ApiResponse } from '@/types/api'

const SYS_PUBLIC_BASE = '/public/system'


// System public APIs
export function fetchSystemLanguages(): Promise<ApiResponse<string[]>> {
  return instance.get(`${SYS_PUBLIC_BASE}/languages`)
}

// Generate slug from a given name/title
export function slugifyPublic(name: string): Promise<ApiResponse<string>> {
  return instance.get(`${SYS_PUBLIC_BASE}/slugify`, { params: { name } })
}