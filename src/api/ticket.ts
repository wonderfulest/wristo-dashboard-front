import instance from '@/config/axios'
import type { ApiResponse, PageResponse } from '@/types/api'
import type {
  TicketVO,
  TicketQueryDTO,
  TicketCreateDTO,
  TicketAssignDTO,
  TicketUpdateStatusDTO,
  TicketComment,
  TicketCommentCreateDTO,
  TicketHistory
} from '@/types/ticket'

const BASE = '/admin/contact/tickets'

export function fetchTicketPage(dto: TicketQueryDTO): Promise<ApiResponse<PageResponse<TicketVO>>> {
  return instance.post(`${BASE}/page?populate=*`, dto)
}

export function fetchTicketList(params: TicketQueryDTO): Promise<ApiResponse<TicketVO[]>> {
  return instance.get(`${BASE}/list`, { params })
}

export function createTicket(dto: TicketCreateDTO): Promise<ApiResponse<TicketVO>> {
  return instance.post(`${BASE}/create`, dto)
}

export function getTicketDetail(id: number): Promise<ApiResponse<TicketVO>> {
  return instance.get(`${BASE}/${id}`)
}

export function assignTicket(id: number, dto: TicketAssignDTO, operatorId: number): Promise<ApiResponse<TicketVO>> {
  return instance.post(`${BASE}/${id}/assign`, dto, { params: { operatorId } })
}

export function updateTicketStatus(id: number, dto: TicketUpdateStatusDTO): Promise<ApiResponse<TicketVO>> {
  return instance.post(`${BASE}/${id}/status`, dto)
}

export function addTicketComment(id: number, dto: TicketCommentCreateDTO): Promise<ApiResponse<void>> {
  return instance.post(`${BASE}/${id}/comment`, dto)
}

export function closeTicket(id: number, adminId: number): Promise<ApiResponse<void>> {
  return instance.post(`${BASE}/${id}/close`, null, { params: { adminId } })
}

export function fetchTicketComments(id: number): Promise<ApiResponse<TicketComment[]>> {
  return instance.get(`${BASE}/${id}/comments?populate=*`)
}

export function fetchTicketHistory(id: number): Promise<ApiResponse<TicketHistory[]>> {
  return instance.get(`${BASE}/${id}/history?populate=*`)
}

export function fetchTicketTags(): Promise<ApiResponse<string[]>> {
  return instance.get(`/public/contact/tickets/tags`)
}
