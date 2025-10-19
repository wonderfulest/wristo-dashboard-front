export interface EmailTemplate {
  id: number
  name: string
  subject: string
  templateFileName: string
  fromEmail: string
  variables?: string
  isActive?: number
  contentHtml?: string | null
  lastEditor?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface EmailTemplateCreateDTO {
  name: string
  subject: string
  templateFileName: string
  fromEmail: string
  variables?: string
}

export interface EmailTemplateUpdateDTO {
  name?: string
  subject?: string
  templateFileName?: string
  fromEmail?: string
  variables?: string
}

export interface EmailTemplateHtmlUpdateDTO {
  variables?: string
  contentHtml: string
  lastEditor?: string
}

export interface EmailTemplatePageParams {
  pageNum?: number
  pageSize?: number
  orderBy?: string
  name?: string
  templateFileName?: string
}
