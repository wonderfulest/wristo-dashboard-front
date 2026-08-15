export function formatProductGoLive(lastGoLive, formatDate) {
  return lastGoLive ? formatDate(lastGoLive) : '-'
}
