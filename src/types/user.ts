export interface UserBase {
  id: number
  username: string
  nickname: string | null
  avatar: string | null
} 

export interface UserUpdateDTO {
  username?: string
  nickname?: string
  avatar?: string
  status?: number
  roles?: string[]
} 