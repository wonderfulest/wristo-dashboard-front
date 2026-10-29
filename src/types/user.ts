import type { ImageVO } from '@/types/image'

export interface UserBase {
  id: number
  username: string
  nickname: string | null
  avatar: string | null
  email?: string | null
} 

export interface UserUpdateDTO {
  aiGenerationEnabled?: boolean
  username?: string
  nickname?: string
  avatar?: string
  status?: number
  roles?: string[]
}

export interface AdminEmailAccountCreateDTO {
  username: string
  nickname?: string
  email: string
  password: string
  roles?: string[]
}

 export interface ChangeUserEmailDTO {
   userId: number
   oldEmail: string
   newEmail: string
 }
export interface PremiumEntitlement {
  active: boolean
  lifetime: boolean
  expiresAt: string | null
}

export interface UserInfo {
  premium?: PremiumEntitlement | null
  registrationSource?: string | null
  registrationMethod?: string | null
  aiGenerationEnabled?: boolean
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
  googleBound?: boolean | null
}

export interface UserStats {
  totalUsers: number
  emailUsers: number
  googleUsers: number
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
  remark?: string
  username?: string
  nickname?: string
  avatar?: string
  status?: number
  payoutMethod?: string
  payoutAccount?: string
  bannerImageId?: number
  slug?: string
  slogan?: string
  facebookUrl?: string
  instagramUrl?: string
  xUrl?: string
  appCount?: number
  totalDownloads?: number
}

export interface MchUserVO extends UserInfo {
  remark?: string | null
  payoutMethod?: string | null
  payoutAccount?: string | null
  bannerImageId?: number | null
  slug?: string | null
  bannerImage?: ImageVO | null
  slogan?: string | null
  facebookUrl?: string | null
  instagramUrl?: string | null
  xUrl?: string | null
  appCount?: number | null
  totalDownloads?: number | null
  isActive?: number | null
}
