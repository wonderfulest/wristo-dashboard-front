export interface ImageFormatVO {
  url?: string
  width?: number
  height?: number
  size?: number
  mime?: string
  ext?: string
  name?: string
  hash?: string
  path?: string | null
}

export interface ImageVO {
  id: number
  documentId?: string
  name?: string
  alternativeText?: string
  caption?: string
  width?: number
  height?: number
  formats?: Record<string, ImageFormatVO>
  hash?: string
  ext?: string
  mime?: string
  size?: number
  url?: string
  previewUrl?: string
  provider?: string
  providerMetadata?: Record<string, any>
  folderPath?: string
  usageType?: string
  createdAt?: string
  updatedAt?: string
  publishedAt?: string
  locale?: string
}