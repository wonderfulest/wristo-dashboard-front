# Launch Lifecycle Revenue Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在现有 Dashboard 增加可筛选的上新、生命周期、边际营收、品类和设计师运营决策区域。

**Architecture:** 新区域复用 `DashboardSectionFilter`，API 与类型集中在 launch-analytics 模块，计算格式化逻辑放入可用 Node 测试覆盖的 `.mjs` 工具。每个业务块独立加载和显示更新时间，单块失败不阻塞其他现有仪表盘。

**Tech Stack:** Vue 3、TypeScript、Vite、Element Plus、ECharts、Node test runner

---

### Task 1: API、类型和纯函数契约

**Files:**
- Create: `wristo-dashboard/src/api/launch-analytics.ts`
- Create: `wristo-dashboard/src/types/launch-analytics.ts`
- Create: `wristo-dashboard/src/components/dashboard/launchAnalyticsUtils.mjs`
- Create: `wristo-dashboard/src/components/dashboard/launchAnalyticsUtils.d.mts`
- Create: `wristo-dashboard/tests/launch-analytics.test.mjs`

- [ ] **Step 1:** 编写测试，覆盖三类贡献守恒、金额格式化、partial/SAMPLE_INSUFFICIENT 标签、推荐区间和四象限映射。
- [ ] **Step 2:** 运行 `cd wristo-dashboard && node --test tests/launch-analytics.test.mjs`，确认 FAIL。
- [ ] **Step 3:** 定义与六组 API 一致的 TypeScript 类型和请求函数；纯函数不得依赖 Vue 或浏览器。
- [ ] **Step 4:** 重跑测试，Expected: PASS。
- [ ] **Step 5:** 获得授权后提交 `add launch analytics dashboard contracts`。

### Task 2: 今日经营建议和三类贡献

**Files:**
- Create: `wristo-dashboard/src/components/dashboard/LaunchOperationsRecommendation.vue`
- Create: `wristo-dashboard/src/components/dashboard/LaunchCohortContribution.vue`
- Modify: `wristo-dashboard/src/views/dashboard/Dashboard.vue`
- Test: `wristo-dashboard/tests/launch-analytics-dashboard.test.mjs`

- [ ] **Step 1:** 编写源码契约测试，断言建议区间、7/30 日营收、置信度、模型时间、首发/重上/存量下载与两类营收均可见。
- [ ] **Step 2:** 运行测试并确认 FAIL。
- [ ] **Step 3:** 实现两个独立 section；复用日期筛选，partial 显示“实时数据，不参与训练”，接口失败显示局部错误。
- [ ] **Step 4:** 将区域放在 `BusinessOverview` 后、`OperationsInbox` 前，不改变现有组件逻辑。
- [ ] **Step 5:** 运行测试，Expected: PASS。
- [ ] **Step 6:** 获得授权后提交 `show launch operations overview`。

### Task 3: 生命周期曲线

**Files:**
- Create: `wristo-dashboard/src/components/dashboard/LaunchLifecycleChart.vue`
- Modify: `wristo-dashboard/src/views/dashboard/Dashboard.vue`
- Test: `wristo-dashboard/tests/launch-lifecycle-chart.test.mjs`

- [ ] **Step 1:** 编写契约测试，断言首发/重上切换、下载/营收切换、P25/P50/P75、样本量、峰值、半衰期、长尾和筛选参数。
- [ ] **Step 2:** 运行测试并确认 FAIL。
- [ ] **Step 3:** 使用 ECharts 实现日龄曲线；P25–P75 为区间带，P50 为主线，样本不足日龄使用断线而非补零。
- [ ] **Step 4:** 运行测试，Expected: PASS。
- [ ] **Step 5:** 获得授权后提交 `visualize app launch lifecycles`。

### Task 4: 上线数量与边际营收

**Files:**
- Create: `wristo-dashboard/src/components/dashboard/LaunchMarginalRevenue.vue`
- Modify: `wristo-dashboard/src/views/dashboard/Dashboard.vue`
- Test: `wristo-dashboard/tests/launch-marginal-revenue.test.mjs`

- [ ] **Step 1:** 编写测试，断言上线量、7/30 日营收、边际营收、单款营收、存量变化、置信区间和推荐区间都进入图表配置。
- [ ] **Step 2:** 运行测试并确认 FAIL。
- [ ] **Step 3:** 实现组合图；推荐区间用 markArea，负边际值使用警示色，tooltip 明确“历史关联推荐”。
- [ ] **Step 4:** 运行测试，Expected: PASS。
- [ ] **Step 5:** 获得授权后提交 `show marginal launch revenue`。

### Task 5: 品类与设计师价值矩阵

**Files:**
- Create: `wristo-dashboard/src/components/dashboard/CategoryValueMatrix.vue`
- Create: `wristo-dashboard/src/components/dashboard/DesignerValueMatrix.vue`
- Modify: `wristo-dashboard/src/views/dashboard/Dashboard.vue`
- Test: `wristo-dashboard/tests/launch-value-matrices.test.mjs`

- [ ] **Step 1:** 编写测试，覆盖四象限、规模/效率阈值、品类配额、设计师供稿量、Bundle 带动率、样本不足状态和分页。
- [ ] **Step 2:** 运行测试并确认 FAIL。
- [ ] **Step 3:** 品类组件提供散点矩阵和数据表切换；设计师组件默认表格排序，避免大量设计师散点标签重叠。
- [ ] **Step 4:** 所有评级展示原始数值、阈值和样本量，不能只显示颜色或等级。
- [ ] **Step 5:** 运行测试，Expected: PASS。
- [ ] **Step 6:** 获得授权后提交 `add category and designer value analytics`。

### Task 6: 响应式、无障碍和整体构建

**Files:**
- Modify: `wristo-dashboard/src/views/dashboard/Dashboard.vue`
- Modify: `wristo-dashboard/src/components/dashboard/LaunchOperationsRecommendation.vue`
- Modify: `wristo-dashboard/src/components/dashboard/LaunchCohortContribution.vue`
- Modify: `wristo-dashboard/src/components/dashboard/LaunchLifecycleChart.vue`
- Modify: `wristo-dashboard/src/components/dashboard/LaunchMarginalRevenue.vue`
- Modify: `wristo-dashboard/src/components/dashboard/CategoryValueMatrix.vue`
- Modify: `wristo-dashboard/src/components/dashboard/DesignerValueMatrix.vue`
- Modify: `wristo-dashboard/tests/mobile-responsive.test.mjs`

- [ ] **Step 1:** 扩展移动端契约测试，要求图表容器可横向查看、表格使用响应式壳、关键结论不依赖颜色表达。
- [ ] **Step 2:** 运行 `cd wristo-dashboard && npm run test:unit`，确认新增断言先失败。
- [ ] **Step 3:** 补齐 390px、768px、桌面布局和 aria 标签；不修改现有 Dashboard 卡片行为。
- [ ] **Step 4:** 运行 `cd wristo-dashboard && npm run test:unit`，Expected: PASS。
- [ ] **Step 5:** 运行 `cd wristo-dashboard && npm run build`，Expected: PASS。
- [ ] **Step 6:** 运行 `git -C wristo-dashboard diff --check`，Expected: 无空白错误。
- [ ] **Step 7:** 在已登录浏览器验证 1440px 和 390px，记录截图；确认筛选、tooltip、空状态、partial 和样本不足状态。
- [ ] **Step 8:** 获得授权后提交 `complete launch revenue dashboard`。
