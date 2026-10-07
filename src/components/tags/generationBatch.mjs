export function validThresholds(value) {
  return [value.minDownloads, value.minPurchases].every(n => Number.isSafeInteger(n) && n > 0 && n <= 2147483647)
}

export function createBatchRequest(apps, thresholds, quote, requestId) {
  if (!validThresholds(thresholds)) throw new Error('请填写有效阈值')
  if (quote?.provider !== 'BAILIAN' || !quote.model?.trim()) throw new Error('百炼模型不可用')
  const appIds = [...new Set(apps.map(app => String(app.appId)))]
  if (!appIds.length || appIds.length > 50 || !requestId) throw new Error('无效批量请求')
  return { ...thresholds, appIds, expectedModel: quote.model, requestId }
}

export function batchStatus(status) {
  return ({ submitting: '正在提交', submitted: '已提交', validating: '验证中', in_progress: '处理中', processing: '处理中', finalizing: '正在完成', completed: '已完成', failed: '失败', expired: '已过期', cancelled: '已取消', cancelling: '取消中', skipped: '已跳过', pending: '待处理', unknown: '结果待核实', submission_unknown: '提交结果待核实' })[status] || status
}

export function batchFeedback(job) {
  if (job.status === 'submission_unknown' || (!job.providerBatchId && job.status !== 'failed')) {
    return job.status === 'submitting'
      ? '任务正在提交，请稍后刷新任务列表；请勿重复提交。'
      : '提交结果待核实，勿重试，平台需核对百炼任务。'
  }
  if (job.status === 'completed') return '批量任务已完成。已完成的标签已写入；内容发生变化的应用会跳过。'
  if (['failed', 'expired', 'cancelled'].includes(job.status)) return '批量任务已结束，请查看各应用结果；不会自动重新生成。'
  return '批量任务已提交，平台承担费用。请稍后检查结果；关闭页面不影响任务。'
}
