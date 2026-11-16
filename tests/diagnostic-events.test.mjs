import test from 'node:test'
import assert from 'node:assert/strict'
import { diagnosticEvents } from '../src/views/dashboard/diagnosticEvents.mjs'

test('shows iOS ISO dates and mini-program millisecond events in time order', () => {
  const rows = diagnosticEvents({ sessions: [
    { kind: 'ios', events: [{ at: '2026-11-16T02:00:01Z', name: 'connection', data: { message: 'ACK 20ms' } }] },
    { kind: 'runtime', events: [{ at: Date.parse('2026-11-16T02:00:00Z'), name: 'request_complete' }] }
  ] })
  assert.deepEqual(rows.map(row => row.name), ['request_complete', 'connection'])
  assert.equal(rows[1].time, '2026-11-16 02:00:01.000')
  assert.equal(rows[1].data, '{"message":"ACK 20ms"}')
})
test('ignores invalid timestamps and malformed sessions without losing valid events', () => {
  assert.deepEqual(diagnosticEvents(null), [])
  assert.deepEqual(diagnosticEvents({ sessions: [null, { events: [null, { at: null }, { at: '' }, { at: 'bad' }, { at: 1e30 }] }] }), [])
})
