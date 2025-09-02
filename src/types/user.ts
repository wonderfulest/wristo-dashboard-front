export interface UserBase {
  id: number
  username: string
  nickname: string | null
  avatar: string | null
  email?: string | null
} 

export interface UserUpdateDTO {
  username?: string
  nickname?: string
  avatar?: string
  status?: number
  roles?: string[]
}
export interface UserInfo {
  id: number
  username: string
  nickname: string | null
  email: string
  phone: string | null
  avatar: string | null
  status: number
  createdAt: string
  updatedAt: string
  lastLoginTime: string | null
  lastLoginIp: string | null
  isDeleted: string
  roles: RoleInfo[] | null
  activatedApps: number[] | null
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
  status: number
}
