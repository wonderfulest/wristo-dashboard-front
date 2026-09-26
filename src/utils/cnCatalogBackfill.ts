export interface CnBackfillPage {
  queued: number
  nextAfterAppId: number
  hasMore: boolean
}

export async function backfillAllCnCatalog(
  submitPage: (afterAppId: number) => Promise<CnBackfillPage>,
  onProgress: (queued: number) => void = () => {},
  cancelled: () => boolean = () => false,
): Promise<number> {
  let afterAppId = 0
  let queued = 0
  while (!cancelled()) {
    const page = await submitPage(afterAppId)
    if (!page || !Number.isSafeInteger(page.queued) || page.queued < 0) {
      throw new Error('同步接口返回无效分页数据')
    }
    queued += page.queued
    onProgress(queued)
    if (!page.hasMore) return queued
    if (!Number.isSafeInteger(page.nextAfterAppId) || page.nextAfterAppId <= afterAppId) {
      throw new Error('同步分页游标未前进，请重试')
    }
    afterAppId = page.nextAfterAppId
  }
  throw new Error('同步提交已停止，已入队应用仍会继续同步')
}
