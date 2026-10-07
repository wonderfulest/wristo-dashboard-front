import test from 'node:test'
import assert from 'node:assert/strict'
import { shanghaiDate, recentRange, leaderboardMode, formatGameScore } from '../src/views/games/gameAnalytics.mjs'

test('Shanghai dates and recent range are independent of browser timezone', () => {
  const now = new Date('2026-10-06T16:01:00Z')
  assert.equal(shanghaiDate(now), '2026-10-07')
  assert.deepEqual(recentRange(7, now), ['2026-10-01', '2026-10-07'])
})
test('daily and echo leaderboards keep their separate modes', () => {
  assert.equal(leaderboardMode('daily-lights', 'classic', '2026-10-07'), 'daily20261007')
  assert.equal(leaderboardMode('echo-orbit', 'buttons', '2026-10-07'), 'buttons')
})
test('zero and lower-is-better scores retain explicit units', () => {
  assert.equal(formatGameScore(0, 'errorMs'), '0 ms')
  assert.equal(formatGameScore(256, 'points'), '256 分')
  assert.equal(formatGameScore(null, 'points'), '—')
})
