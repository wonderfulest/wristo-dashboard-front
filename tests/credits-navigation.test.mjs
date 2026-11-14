import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import ts from 'typescript'
const transpile = source => ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText
const menu = await import(`data:text/javascript;base64,${Buffer.from(transpile(fs.readFileSync(new URL('../src/config/menu.ts', import.meta.url), 'utf8'))).toString('base64')}`)
const flatten = items => items.flatMap(item => item.children ? flatten(item.children) : [item])
test('积分中心所有入口归属同一顶部菜单，默认进入总览，无重复编辑入口', () => {
  const group = menu.topMenus.find(group => group.key === 'credits-ai')
  assert.equal(menu.findFirstPath(group.children), '/ops/credits-overview')
  const leaves = flatten(group.children)
  assert.equal(new Set(leaves.map(item => item.path)).size, leaves.length)
  for (const item of leaves) assert.equal(menu.resolveActiveTopMenu(item.path).key, group.key, item.path)
  assert.deepEqual(group.children.slice(1).map(item => item.title), ['账户与收支', '奖励与兑换', 'AI 运营', 'AI 配置'])
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
  for (const item of flatten(menu.topMenus.find(group => group.key === 'credits-ai').children)) {
    const route = routes.find(route => route.path === item.path)
    assert.ok(route?.component, item.path)
    assert.equal(route.meta.requiresAuth, true, item.path)
  }
})
