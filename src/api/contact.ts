import instance from '@/config/axios'
import type { ApiResponse, PageResponse } from '@/types/api'
import type { EmailSendRecord, EmailSendRecordPageParams } from '@/types/contact'

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
