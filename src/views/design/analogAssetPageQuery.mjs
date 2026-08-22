export function buildAnalogAssetPageQuery(input) {
  return {
    pageNum: input.pageNum,
    pageSize: input.pageSize,
    analogAssetType: input.analogAssetType || undefined,
    userId: input.userId,
    isSystem: input.isSystem === '' ? undefined : input.isSystem === 'true',
    isShared: input.isShared === '' ? undefined : input.isShared === 'true',
    isActive: input.isActive === '' ? undefined : input.isActive === 'true',
    orderBy: input.orderBy,
  }
}
