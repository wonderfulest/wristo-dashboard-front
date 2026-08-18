import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('platform versions has dedicated API, route, menu, and semver form', () => {
  const api = read('src/api/platformVersions.ts')
  const router = read('src/router/index.ts')
  const menu = read('src/config/menu.ts')
  const view = read('src/views/ops/PlatformVersions.vue')

  assert.match(api, /\/admin\/platform-versions/)
  assert.match(api, /method: 'put'/)
  assert.match(router, /path: '\/ops\/platform-versions'/)
  assert.match(menu, /平台版本/)
  for (const field of ['connectIqTools', 'connectIqAppBuild', 'superAlpha', 'superBarrel', 'studio', 'wristoApi']) {
    assert.match(view, new RegExp(field))
  }
  assert.match(view, /configVersion/)
  assert.match(view, /ghcr\.io\/wonderfulest\/wristo-connectiq-tools/)
})
