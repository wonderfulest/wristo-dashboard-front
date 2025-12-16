import type { ImageVO } from '@/types/image'

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

 export interface ChangeUserEmailDTO {
   userId: number
   oldEmail: string
   newEmail: string
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

export interface UserMchUpdateDTO {
  username?: string
  nickname?: string
  avatar?: string
  status?: number
  payoutMethod?: string
  payoutAccount?: string
  bannerImageId?: number
  slogan?: string
  facebookUrl?: string
  instagramUrl?: string
  xUrl?: string
  appCount?: number
  totalDownloads?: number
}

export interface MchUserVO extends UserInfo {
  payoutMethod?: string | null
  payoutAccount?: string | null
  bannerImageId?: number | null
  bannerImage?: ImageVO | null
  slogan?: string | null
  facebookUrl?: string | null
  instagramUrl?: string | null
  xUrl?: string | null
  appCount?: number | null
  totalDownloads?: number | null
  isActive?: number | null
}
