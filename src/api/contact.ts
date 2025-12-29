import instance from '@/config/axios'
import type { ApiResponse, PageResponse } from '@/types/api'
import type {
  EmailSendRecord,
  EmailSendRecordPageParams,
  ContactUsQueryDTO,
  ContactUsVO,
  ContactUsReplyDTO
} from '@/types/contact'

// 分页查询邮件发送记录
export function fetchEmailSendRecordPage(
  params: EmailSendRecordPageParams
): Promise<ApiResponse<PageResponse<EmailSendRecord>>> {
  return instance.post('/admin/contact/email-send-record/page', params)
}

// 重发指定邮件发送记录
export function resendEmailRecord(id: number): Promise<ApiResponse<EmailSendRecord>> {
  return instance.post(`/admin/contact/email-send-record/resend/${id}`)
}

// 用户反馈分页
export function pageContactUs(
  params: ContactUsQueryDTO
): Promise<ApiResponse<PageResponse<ContactUsVO>>> {
  return instance.post('/admin/contact-us/page', params)
}

// 用户反馈详情（id 作为 query 参数）
export function getContactUs(id: number): Promise<ApiResponse<ContactUsVO>> {
  return instance.get(`/admin/contact-us/detail?id=${id}`)
}

// 回复用户反馈（id 作为 query 参数）
export function replyContactUs(
  id: number,
  data: ContactUsReplyDTO
): Promise<ApiResponse<ContactUsVO>> {
  return instance.post(`/admin/contact-us/reply?id=${id}`, data)
}

// 关闭用户反馈
export function closeContactUs(id: number): Promise<ApiResponse<ContactUsVO>> {
  return instance.post(`/admin/contact-us/close?id=${id}`)
}

// 标记为已回复
export function markRepliedContactUs(id: number): Promise<ApiResponse<ContactUsVO>> {
  return instance.post(`/admin/contact-us/mark-replied?id=${id}`)
}
