// Mini-program timestamps are epoch milliseconds; iOS exports ISO 8601 strings.
export function diagnosticEvents(report) {
  const sessions = Array.isArray(report?.sessions) ? report.sessions : []
  return sessions.flatMap(session => {
    const events = Array.isArray(session?.events) ? session.events : []
    return events.flatMap(event => {
      if (!event || (typeof event.at !== 'number' && typeof event.at !== 'string')) return []
      const at = typeof event.at === 'number' ? event.at : Date.parse(event.at)
      if (!Number.isFinite(at) || !Number.isFinite(new Date(at).getTime())) return []
      return [{ at, time: new Date(at).toISOString().replace('T', ' ').replace('Z', ''),
        kind: session.kind, name: event.name, data: JSON.stringify(event.data || {}) }]
    })
  }).sort((a, b) => a.at - b.at)
}
