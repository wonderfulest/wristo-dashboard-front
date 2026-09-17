const CACHE_NAME = 'wristo-dashboard-images-v1'
const CACHE_TTL_MS = 8 * 60 * 60 * 1000
const META_PREFIX = 'wristo-dashboard-image-cache:'

const metadataKey = (key: string) => `${META_PREFIX}${key}`

const toCacheKey = (appId: number, imageUrl: string) =>
  `${appId}:${imageUrl}`

const createObjectUrl = async (response: Response) => {
  const blob = await response.blob()
  return URL.createObjectURL(blob)
}

/** Returns a local blob URL and re-fetches the image only after the TTL expires. */
export const getCachedAppImageUrl = async (appId: number, imageUrl: string): Promise<string> => {
  if (!imageUrl || typeof window === 'undefined' || !('caches' in window)) return imageUrl

  const key = toCacheKey(appId, imageUrl)
  const storedAt = Number(window.localStorage.getItem(metadataKey(key)) || 0)
  const cache = await window.caches.open(CACHE_NAME)
  const request = new Request(imageUrl, { mode: 'cors' })

  if (storedAt > 0 && Date.now() - storedAt < CACHE_TTL_MS) {
    const cached = await cache.match(request)
    if (cached) return createObjectUrl(cached)
  }

  const response = await fetch(request)
  if (!response.ok) throw new Error(`Image request failed: ${response.status}`)
  await cache.put(request, response.clone())
  window.localStorage.setItem(metadataKey(key), String(Date.now()))
  return createObjectUrl(response)
}
