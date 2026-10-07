import test from 'node:test'
import assert from 'node:assert/strict'
import { parseOverviewFilters, overviewUserRoute } from '../src/components/users/userOverview.mjs'

test('overview links round-trip UTC boundaries, false flags and disabled status', () => {
  const filters = { isDeleted: 0, status: 0, emailVerified: false, createdFrom: '2026-10-05 16:00:00.000000',
    createdBefore: '2026-10-06 04:00:00.000000', registrationSource: 'unknown', roleId: 12 }
  const route = overviewUserRoute(filters, '今日新增')
  assert.equal(route.path, '/users/user-management')
  assert.deepEqual(parseOverviewFilters(route.query), filters)
})
test('ordinary user routes do not accidentally acquire overview filters', () => {
  assert.deepEqual(parseOverviewFilters({ status: '0', createdFrom: '2026-10-05 16:00:00' }), {})
})
test('route parser ignores arrays, invalid numbers and unrelated query keys', () => {
  assert.deepEqual(parseOverviewFilters({ overview: '1', isDeleted: '1', roleId: '-5', status: '2',
    emailVerified: 'maybe', neverLoggedIn: ['true'], createdBefore: 'bad', pageSize: '100000',
    registrationMethod: ' GOOGLE ', noRole: 'true' }),
  { isDeleted: 0, registrationMethod: 'google', noRole: true })
})
