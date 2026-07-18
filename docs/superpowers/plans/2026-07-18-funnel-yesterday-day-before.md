# 转化分析漏斗昨天与前天筛选 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 Dashboard 转化分析漏斗的“近1天”明确为“昨天”，并新增查询前天单个自然日的快捷筛选。

**Architecture:** 日期计算继续集中在 `funnelRange.mjs`，新增按历史天偏移构造单个自然日范围的纯函数，并同步相邻的 TypeScript 声明。`FunnelAnalytics.vue` 只负责把快捷筛选值映射到日期函数，现有多日、当天和自定义范围逻辑保持不变。

**Tech Stack:** Vue 3、TypeScript、Element Plus、Node.js test runner、Vite

---

### Task 1: 用失败测试定义历史单日筛选行为

**Files:**
- Modify: `tests/funnel-range.test.mjs`

- [x] **Step 1: 将日期工具改为命名空间导入**

```js
import * as funnelRange from '../src/components/dashboard/funnelRange.mjs'
```

- [x] **Step 2: 增加昨天与前天日期范围测试**

```js
test('historical single-day ranges select yesterday and the day before yesterday', () => {
  assert.equal(typeof funnelRange.buildHistoricalDayRange, 'function')
  const now = new Date(2026, 6, 17, 18, 23, 0)
  assert.deepEqual(funnelRange.buildHistoricalDayRange(1, now), {
    startDate: '2026-07-16',
    endDate: '2026-07-16',
    displayPeriod: '[2026-07-16 00:00, 2026-07-17 00:00)',
  })
  assert.deepEqual(funnelRange.buildHistoricalDayRange(2, now), {
    startDate: '2026-07-15',
    endDate: '2026-07-15',
    displayPeriod: '[2026-07-15 00:00, 2026-07-16 00:00)',
  })
})
```

- [x] **Step 3: 增加筛选文案与映射测试**

测试组件包含 `昨天`、`前天`，不再包含 `近1天`，并调用 `buildHistoricalDayRange`。

- [x] **Step 4: 运行 `npm run test:unit` 并确认新测试失败**

Expected: 日期函数和组件筛选均因功能尚未实现而失败。

### Task 2: 实现历史单日日期工具及类型契约

**Files:**
- Modify: `src/components/dashboard/funnelRange.mjs`
- Modify: `src/components/dashboard/funnelRange.d.mts`
- Test: `tests/funnel-range.test.mjs`

- [x] **Step 1: 增加历史单日范围构造函数**

```js
export const buildHistoricalDayRange = (dayOffset, now = new Date()) => {
  const day = new Date(now)
  day.setHours(0, 0, 0, 0)
  day.setDate(day.getDate() - dayOffset)
  return buildSelectedDayRange(day, day)
}
```

- [x] **Step 2: 增加并测试 TypeScript 声明**

```ts
export function buildHistoricalDayRange(dayOffset: number, now?: Date): NaturalDayRange
```

- [x] **Step 3: 运行历史单日和声明的针对性测试**

Expected: 两项测试均通过。

### Task 3: 接入昨天与前天快捷筛选

**Files:**
- Modify: `src/components/dashboard/FunnelAnalytics.vue`
- Test: `tests/funnel-range.test.mjs`

- [x] **Step 1: 替换并新增快捷按钮**

```vue
<el-radio-button label="yesterday">昨天</el-radio-button>
<el-radio-button label="dayBeforeYesterday">前天</el-radio-button>
```

- [x] **Step 2: 更新筛选类型和范围映射**

```ts
type RangeType = 'today' | 'yesterday' | 'dayBeforeYesterday' | '3d' | '7d' | '30d' | 'custom'
const historicalDayOffsets = { yesterday: 1, dayBeforeYesterday: 2 } as const
```

- [x] **Step 3: 使用历史单日函数计算两个快捷范围**

```ts
if (rangeType.value === 'yesterday' || rangeType.value === 'dayBeforeYesterday') {
  const range = buildHistoricalDayRange(historicalDayOffsets[rangeType.value])
  dateRange.value = [range.startDate, range.endDate]
  displayPeriod.value = range.displayPeriod
  return
}
```

- [x] **Step 4: 运行 `npm run test:unit`**

Expected: 18 个单测全部通过。

### Task 4: 完整构建验证

**Files:**
- Verify: `src/components/dashboard/FunnelAnalytics.vue`
- Verify: `src/components/dashboard/funnelRange.mjs`
- Verify: `src/components/dashboard/funnelRange.d.mts`
- Verify: `tests/funnel-range.test.mjs`

- [x] **Step 1: 运行 `npm run build`**

Expected: `vue-tsc` 和 Vite 构建成功，无 TypeScript 错误。

- [x] **Step 2: 运行 `git diff --check` 并检查工作区状态**

Expected: 无空白错误，任务文件均已提交。
