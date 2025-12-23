import instance from '@/config/axios'
import type { ApiResponse, PageResponse } from '@/types/api'
import type { EmailPreferencesVO, EmailPreferencesCreateDTO, EmailPreferencesUpdateDTO, EmailPreferencesPageQueryDTO } from '@/types/contact'

const BASE = '/admin/contact/email-preferences'

export const createEmailPreferences = (dto: EmailPreferencesCreateDTO): Promise<ApiResponse<EmailPreferencesVO>> => {
  return instance.post(`${BASE}/create`, dto)
}

export const getEmailPreferencesById = (id: number): Promise<ApiResponse<EmailPreferencesVO>> => {
  return instance.get(`${BASE}/getById/${id}`)
}

export const getEmailPreferencesByEmail = (email: string): Promise<ApiResponse<EmailPreferencesVO>> => {
  return instance.get(`${BASE}/getByEmail/${encodeURIComponent(email)}`)
}

export const pageEmailPreferences = (dto: EmailPreferencesPageQueryDTO): Promise<ApiResponse<PageResponse<EmailPreferencesVO>>> => {
  return instance.post(`${BASE}/page`, dto)
}

export const updateEmailPreferencesById = (id: number, dto: EmailPreferencesUpdateDTO): Promise<ApiResponse<EmailPreferencesVO>> => {
  return instance.post(`${BASE}/updateById/${id}`, dto)
}

export const deleteEmailPreferencesById = (id: number): Promise<ApiResponse<void>> => {
  return instance.post(`${BASE}/deleteById/${id}`)
}

export const unsubscribeAllByEmail = (email: string, updatedBy?: string): Promise<ApiResponse<EmailPreferencesVO>> => {
  return instance.post(`${BASE}/${encodeURIComponent(email)}/unsubscribe-all`, null, { params: { updatedBy } })
}

export const subscribeAllByEmail = (email: string, updatedBy?: string): Promise<ApiResponse<EmailPreferencesVO>> => {
  return instance.post(`${BASE}/${encodeURIComponent(email)}/subscribe-all`, null, { params: { updatedBy } })
}
