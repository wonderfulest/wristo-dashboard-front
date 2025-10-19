import instance from '@/config/axios'
import type { ApiResponse, PageResponse } from '@/types/api'
import type {
  EmailTemplate,
  EmailTemplateCreateDTO,
  EmailTemplateUpdateDTO,
  EmailTemplateHtmlUpdateDTO,
  EmailTemplatePageParams
} from '@/types/email-template'

export function createEmailTemplate(data: EmailTemplateCreateDTO): Promise<ApiResponse<EmailTemplate>> {
  return instance.post('/admin/contact/email-template/create', data)
}

export function getEmailTemplateById(id: number): Promise<ApiResponse<EmailTemplate>> {
  return instance.get(`/admin/contact/email-template/${id}`)
}

export function updateEmailTemplate(id: number, data: EmailTemplateUpdateDTO): Promise<ApiResponse<EmailTemplate>> {
  return instance.post(`/admin/contact/email-template/update/${id}`, data)
}

export function deleteEmailTemplate(id: number): Promise<ApiResponse<void>> {
  return instance.post(`/admin/contact/email-template/delete/${id}`)
}

export function fetchEmailTemplatePage(
  params: EmailTemplatePageParams
): Promise<ApiResponse<PageResponse<EmailTemplate>>> {
  return instance.post('/admin/contact/email-template/page', params)
}

export function previewEmailTemplateJson(
  id: number,
  variablesJson?: string
): Promise<ApiResponse<string>> {
  let body: any = undefined
  if (variablesJson && variablesJson.trim()) {
    try { body = JSON.parse(variablesJson) } catch { body = undefined }
  }
  return instance.post(`/admin/contact/email-template/${id}/preview`, body)
}

// Note: preview is POST now; this helper no longer reflects server behavior for direct links.
export function previewEmailTemplateHtmlUrl(id: number, _variablesJson?: string): string {
  return `/api/admin/contact/email-template/${id}/preview`
}

export function updateEmailTemplateHtml(
  id: number,
  data: EmailTemplateHtmlUpdateDTO
): Promise<ApiResponse<EmailTemplate>> {
  return instance.post(`/admin/contact/email-template/${id}/update-html`, data)
}

export function activateEmailTemplate(id: number): Promise<ApiResponse<EmailTemplate>> {
  return instance.post(`/admin/contact/email-template/${id}/activate`)
}

export function deactivateEmailTemplate(id: number): Promise<ApiResponse<EmailTemplate>> {
  return instance.post(`/admin/contact/email-template/${id}/deactivate`)
}

export function testSendEmailTemplate(
  id: number,
  toEmail: string,
  variablesJson?: string
): Promise<ApiResponse<string>> {
  return instance.post(`/admin/contact/email-template/${id}/test-send`, null, {
    params: { toEmail, variablesJson }
  })
}
