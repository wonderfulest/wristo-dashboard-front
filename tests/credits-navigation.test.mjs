import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import ts from 'typescript'
const transpile = source => ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText
const menu = await import(`data:text/javascript;base64,${Buffer.from(transpile(fs.readFileSync(new URL('../src/config/menu.ts', import.meta.url), 'utf8'))).toString('base64')}`)
const flatten = items => items.flatMap(item => item.children ? flatten(item.children) : [item])
test('积分和 AI 入口按产品归属，统一账户归属用户与交易', () => {
  assert.equal(menu.topMenus.some(group => group.key === 'credits-ai'), false)
  const product = menu.topMenus.find(group => group.key === 'marketing-growth')
  for (const [key, paths] of [
    ['studio-operations', ['/website/studio-memberships', '/website/studio-conversion', '/marketing/studio/credit-amounts', '/ops/credit-statistics', '/ops/ai-scenes', '/ops/ai-usage', '/ops/ai-models', '/ops/ai-prices', '/ops/watchface-rules']],
    ['cn-website', ['/marketing/cn/points-recharge', '/marketing/cn/rewards', '/ops/redemptions']],
    ['wechat-miniapp', ['/marketing/miniapp/rewards', '/marketing/miniapp/redemptions']],
    ['shared-resources', ['/ops/credits-overview', '/ops/reward-rules', '/ops/reward-records']],
  ]) {
    const pathsInGroup = flatten(product.children.find(item => item.key === key).children).map(item => item.path)
    for (const path of paths) {
      assert.ok(pathsInGroup.includes(path), path)
      assert.equal(menu.resolveActiveTopMenu(path).key, product.key, path)
    }
  }
  for (const path of ['/ops/points-accounts', '/ops/points-ledger']) {
    assert.equal(menu.resolveActiveTopMenu(path).key, 'users-transactions', path)
  }
  const leaves = flatten(menu.topMenus)
  assert.equal(new Set(leaves.map(item => item.path)).size, leaves.length)
  assert.equal(menu.resolveActiveTopMenu('/ops/credit-grants').key, product.key)
  assert.equal(menu.resolveActiveTopMenu('/ops/db-backups').key, 'platform-operations')
})
const routeSource = fs.readFileSync(new URL('../src/router/index.ts', import.meta.url), 'utf8').replace(/^import .*$/gm, '').replace('export default router', '')
const routeCode = transpile(routeSource)
const routes = new Function('createRouter', 'createWebHistory', `${routeCode}; return router.routes;`)(options => ({ ...options, beforeEach() {} }), () => ({}))
test('历史奖励入口保留查询参数并进入对应规则页签', () => {
  for (const [path, tab] of [['miniapp-points','miniapp'], ['user-rewards','users'], ['share-rewards','visits'], ['creator-rewards','creators']]) {
    const route = routes.find(route => route.path === `/ops/${path}`)
    assert.deepEqual(route.redirect({ query: { userId: '42' } }), { path: '/ops/reward-rules', query: { userId: '42', tab } })
  }
})
test('所有积分菜单页面都注册了需要登录的路由', () => {
  for (const item of flatten(menu.topMenus).filter(item => item.path.startsWith('/ops/') || item.path.startsWith('/marketing/studio/') || item.path.startsWith('/marketing/cn/') || item.path.startsWith('/marketing/miniapp/'))) {
    const route = routes.find(route => route.path === item.path)
    assert.ok(route?.component, item.path)
    assert.equal(route.meta.requiresAuth, true, item.path)
  }
})

test('套餐配置分别加载产品组件，旧地址保留两个新入口', () => {
  for (const [file, component, excluded] of [['PointsRecharge', 'PointsRechargeSettings', 'StudioCreditAmountsSettings'], ['StudioCreditAmounts', 'StudioCreditAmountsSettings', 'PointsRechargeSettings']]) {
    const source = fs.readFileSync(new URL(`../src/views/ops/${file}.vue`, import.meta.url), 'utf8')
    assert.ok(source.includes(`<${component} />`))
    assert.ok(!source.includes(excluded))
  }
  const source = fs.readFileSync(new URL('../src/views/ops/CreditGrants.vue', import.meta.url), 'utf8')
  assert.ok(source.includes('/marketing/cn/points-recharge'))
  assert.ok(source.includes('/marketing/studio/credit-amounts'))
})

test('布局在首页正常渲染，积分页面跨菜单保留专用样式', () => {
  const layout = fs.readFileSync(new URL('../src/layout/Layout.vue', import.meta.url), 'utf8')
  const expression = layout.match(/:class="\{ 'credits-workspace': (.*?) \}"/)[1]
  const evaluate = new Function('route', 'topMenus', 'isTopMenuActive', transpile(`return (${expression})`))
  for (const [path, expected] of [
    ['/dashboard', false],
    ['/ops/points-accounts', true],
    ['/ops/ai-usage', true],
    ['/ops/ai-models', true],
    ['/ops/watchface-rules', true],
    ['/marketing/cn/points-recharge', true],
    ['/marketing/miniapp/rewards', true],
    ['/ops/db-backups', false],
  ]) {
    const route = routes.find(item => item.path === path)
    assert.equal(Boolean(evaluate(route, menu.topMenus, menu.isTopMenuActive)), expected, path)
  }
})
