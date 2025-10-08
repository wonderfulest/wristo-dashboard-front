import type { PageQueryDTO } from './common'

export interface EmailSendRecord {
  id: number
  uuid: string
  templateId: number
  toEmail: string
  sendChannel: string
  variables: string
  status: number
  retryCount: number
  lastSendTime: string | null
  createdAt: string
  updatedAt: string
}

export interface EmailSendRecordPageParams extends PageQueryDTO {
  toEmail?: string
}
