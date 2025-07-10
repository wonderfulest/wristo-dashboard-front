export interface ApiResponse<T> {
  code: number
  msg: string
  data?: T
} 

export interface PageData<T> {
  pageNum: number
  pageSize: number
  total: number
  pages: number
  list: T[]
} 
export interface UserInfo {
  id: number
  username: string
  nickname: string | null
  email: string
  phone: string | null
  avatar: string | null
  status: string | null
  createdAt: string
  updatedAt: string
  lastLoginTime: string | null
  lastLoginIp: string | null
  isDeleted: string
  roles?: string[]
}

export interface LoginResponseData {
  token: string
  userInfo: UserInfo
}

export interface RoleInfo {
  id: number
  roleName: string
  roleCode: string
  description: string
  createdAt: string
  updatedAt: string
}
