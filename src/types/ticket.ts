import type { PageQueryDTO } from './common'
import type { UserBase } from './user'
import type { Product } from './product'

export interface TicketQueryDTO extends PageQueryDTO {
  // 多选优先，若为空回退到单个
  statuses?: string[]
  status?: string | null
  priorities?: string[]
  priority?: string | null
  assigneeId?: number | null
  beginAt?: string | null
  endAt?: string | null
  orderBy?: string
}

export interface TicketVO {
  id: number
  title: string
  description?: string | null
  priority?: string | null
  status?: string | null
  assigneeId: number
  creatorId: number
  closedBy?: number | null
  dueDate?: string | null
  tags?: string | null
  attachments?: string | null
  productId?: number | null
  isActive?: number | null
  isDeleted?: number | null
  createdAt?: string
  updatedAt?: string
  version?: number | null
  // 关联对象（可选，根据 populate 获取）
  assignee?: UserBase | null
  creator?: UserBase | null
  product?: (Partial<Product> & { heroImages?: { url: string }[] }) | null
}

export interface TicketCreateDTO {
  title: string
  description?: string
  priority?: string
  assigneeId: number
  creatorId: number
  dueDate?: string | null
  tags?: string | null
  attachments?: string | null
  productId?: number | null
}

export interface TicketAssignDTO { assigneeId: number }

export interface TicketUpdateStatusDTO { status: string; operatorId?: number | null }

export interface TicketCommentCreateDTO { userId: number; content: string; attachments?: string | null }

export interface TicketComment {
  id: number
  ticketId: number
  userId: number
  content: string
  attachments?: string | null
  createdAt?: string
  updatedAt?: string
  isDeleted?: number | null
  version?: number | null
  // 关联用户（可选，根据 populate 获取）
  user?: UserBase | null
}

export interface TicketHistory {
  id: number
  ticketId: number
  action: string
  fromValue?: string | null
  toValue?: string | null
  operatorId?: number | null
  createdAt?: string
  updatedAt?: string
  isDeleted?: number | null
  version?: number | null
  // 关联操作人（可选，根据 populate 获取）
  operator?: UserBase | null
}
