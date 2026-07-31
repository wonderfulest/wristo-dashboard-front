# Wristo Dashboard Mobile Responsive Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every authenticated Wristo Dashboard route usable at 375px, 390px, 768px, and desktop widths without changing business behavior.

**Architecture:** Strengthen the existing responsive shell and Element Plus overrides first, then migrate route groups to two explicit data-display modes: cards for high-frequency operational lists and contained horizontal scrolling for comparison-heavy tables. Source-contract tests inventory every routed Vue page and prevent new uncontained tables or fixed-width mobile controls.

**Tech Stack:** Vue 3, TypeScript, Vite, Element Plus, SCSS, Node test runner

---

### Task 1: Add a route and table responsive coverage contract

**Files:**
- Create: `tests/mobile-responsive.test.mjs`
- Modify: `package.json`

- [ ] **Step 1: Write the failing responsive coverage test**

Create a Node test that reads `src/router/index.ts`, resolves every `@/views/*.vue` lazy import, and asserts that each routed view exists. Scan Vue files containing `<el-table` and require one of:

```js
const hasResponsiveTableContract =
  source.includes('ResponsiveTableShell') ||
  source.includes('mobile-card-list') ||
  source.includes('class="table-scroll"') ||
  source.includes("class='table-scroll'")
```

Also assert that the shared styles contain:

```js
assert.match(globalScss, /@media \\(max-width: 768px\\)/)
assert.match(elementPlusScss, /\.el-dialog/)
assert.match(elementPlusScss, /\.el-pagination/)
assert.match(elementPlusScss, /\.el-table/)
assert.match(layoutSource, /mobile-menu-drawer/)
```

- [ ] **Step 2: Run the test and confirm it identifies uncovered tables**

Run:

```bash
node --test tests/mobile-responsive.test.mjs
```

Expected: FAIL and print the routed/table views that do not yet declare a mobile display contract.

- [ ] **Step 3: Add the test to the existing unit command**

Keep the existing command:

```json
"test:unit": "node --test tests/*.test.mjs"
```

No script change is needed if the wildcard already includes the new file; record that fact in the plan checkbox.

### Task 2: Complete the shared mobile application shell

**Files:**
- Modify: `src/layout/Layout.vue`
- Modify: `src/layout/components/HeaderBar.vue`
- Modify: `src/layout/components/AppFooter.vue`
- Modify: `src/components/Breadcrumb.vue`
- Modify: `src/assets/styles/global.scss`
- Modify: `src/assets/styles/element-plus.scss`
- Modify: `src/components/common/ResponsiveTableShell.vue`
- Test: `tests/mobile-responsive.test.mjs`

- [ ] **Step 1: Make the main shell viewport-safe**

At `max-width: 768px`, ensure:

```scss
.side-main-wrapper,
.main-content,
.content-wrapper,
.page-content {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}
```

Keep the desktop sidebar hidden, the drawer menu available, and page scrolling on the document rather than a nested fixed-height content container.

- [ ] **Step 2: Make header, breadcrumb, and footer fit 375px**

Use a 56px header, 40px menu target, truncated username, horizontally scrollable single-line breadcrumb, and a naturally flowing centered footer. Verify no fixed desktop padding remains below 768px.

- [ ] **Step 3: Harden shared Element Plus mobile behavior**

Add mobile rules that make dialogs viewport-bound, form labels top-aligned, controls full width, date panels scroll safely, pagination wrap, messages fit the viewport, tabs scroll, upload areas fit their container, and fixed table columns become normal scrolling columns.

- [ ] **Step 4: Make table scrolling explicit and accessible**

Update `ResponsiveTableShell` so its mobile scroll container includes:

```vue
<div
  class="mobile-table-scroll"
  role="region"
  aria-label="表格可横向滚动"
  tabindex="0"
>
```

Add touch momentum scrolling, overscroll containment, and a subtle overflow affordance without changing desktop rendering.

- [ ] **Step 5: Run the focused contract**

Run:

```bash
node --test tests/mobile-responsive.test.mjs
```

Expected: shared-shell assertions PASS; uncovered page inventory may still FAIL until Tasks 3–5.

### Task 3: Adapt Dashboard analytics and shared chart components

**Files:**
- Modify: `src/views/dashboard/Dashboard.vue`
- Modify: `src/components/dashboard/AppSalesSummary.vue`
- Modify: `src/components/dashboard/CountryOrderDistribution.vue`
- Modify: `src/components/dashboard/DeviceOrderSummary.vue`
- Modify: `src/components/dashboard/FunnelAnalytics.vue`
- Modify: `src/components/dashboard/ReviewTimeControl.vue`
- Modify: `src/components/dashboard/SalesLineChart.vue`
- Test: `tests/mobile-responsive.test.mjs`

- [ ] **Step 1: Convert summary grids at responsive breakpoints**

Use:

```scss
@media (max-width: 1024px) {
  .summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 768px) {
  .summary-grid { grid-template-columns: minmax(0, 1fr); }
}
```

Apply the matching existing class names in `Dashboard.vue` rather than introducing duplicate grids.

- [ ] **Step 2: Stack chart controls and resize charts**

Make date selectors, legends, and chart controls wrap below 768px. Ensure every ECharts instance responds to container resizing and each chart container has `min-width: 0`.

- [ ] **Step 3: Give dashboard tables a declared mobile mode**

Wrap comparison-heavy tables with:

```vue
<ResponsiveTableShell mobile-mode="scroll">
  <template #table>
    <!-- existing table unchanged -->
  </template>
</ResponsiveTableShell>
```

Use existing card slots where they already exist; do not duplicate API requests or computed data.

- [ ] **Step 4: Run the focused contract**

Run:

```bash
node --test tests/mobile-responsive.test.mjs
```

Expected: dashboard components no longer appear in the uncovered table list.

### Task 4: Adapt high-frequency operational lists

**Files:**
- Modify: `src/views/products/Products.vue`
- Modify: `src/views/products/RecentOnline.vue`
- Modify: `src/views/orders/History.vue`
- Modify: `src/views/orders/OrdersTrials.vue`
- Modify: `src/views/orders/OrdersRefund.vue`
- Modify: `src/views/orders/OrdersPaddleRefunds.vue`
- Modify: `src/views/UserManagement.vue`
- Modify: `src/views/merchant/Merchant.vue`
- Modify: `src/views/merchant/MerchantPayouts.vue`
- Test: `tests/mobile-responsive.test.mjs`

- [ ] **Step 1: Reuse the existing table data for mobile cards**

For pages that already use `ResponsiveTableShell`, preserve their implementation. For uncovered high-frequency pages, render a `#mobile` slot using:

```vue
<div class="mobile-card-list">
  <article v-for="row in rows" :key="row.id" class="mobile-data-card">
    <header class="mobile-data-card__header">
      <strong>{{ primaryLabel(row) }}</strong>
      <StatusTag :status="row.status" />
    </header>
    <div class="mobile-field-grid">
      <!-- two to six page-specific key fields -->
    </div>
    <footer class="mobile-data-card__actions">
      <!-- invoke the same handlers used by desktop buttons -->
    </footer>
  </article>
</div>
```

Use each page's real list variable, stable key, status renderer, and existing handlers. Do not add requests or new business branches.

- [ ] **Step 2: Add shared mobile card primitives**

In `global.scss`, add `.mobile-card-list`, `.mobile-data-card`, header, fields, and actions. Keep actions wrapping and make buttons at least 40px tall.

- [ ] **Step 3: Stack each page toolbar**

Map page-specific filter classes into the shared `.filters`, `.toolbar`, or `.search-controls` contract. Remove inline fixed widths on mobile with scoped media queries only where global selectors cannot reach them.

- [ ] **Step 4: Simplify mobile pagination**

Bind Element Plus pagination layout to `useResponsive().isMobile`:

```vue
:layout="isMobile ? 'total, prev, pager, next' : 'total, sizes, prev, pager, next, jumper'"
```

Preserve the existing page size, current page, and change handlers.

- [ ] **Step 5: Run the focused contract**

Run:

```bash
node --test tests/mobile-responsive.test.mjs
```

Expected: high-frequency route views are covered; remaining failures name only comparison-heavy pages for Task 5.

### Task 5: Contain every remaining complex table and editor

**Files:**
- Modify: every remaining Vue file printed by `tests/mobile-responsive.test.mjs`
- Modify: editor-heavy views under `src/views/marketing`, `src/views/dashboard/data-options`, `src/views/themes`, and `src/views/ops`
- Test: `tests/mobile-responsive.test.mjs`

- [ ] **Step 1: Wrap remaining tables**

For every file reported by the test, import and use:

```ts
import ResponsiveTableShell from '@/components/common/ResponsiveTableShell.vue'
```

Wrap its existing table in the `#table` slot with `mobile-mode="scroll"`. Do not change columns, fixed widths, formatters, slots, selection events, or API calls.

- [ ] **Step 2: Fix page-local fixed layouts**

For each reported routed view, inspect inline widths and flex rows. Add a scoped mobile rule:

```scss
@media (max-width: 768px) {
  .page-root,
  .editor-layout,
  .form-section {
    min-width: 0;
    width: 100%;
  }

  .page-toolbar,
  .editor-actions {
    flex-direction: column;
    align-items: stretch;
  }
}
```

Use the file's real class names. Preserve desktop rules and editor functionality.

- [ ] **Step 3: Resolve the coverage list to zero**

Run:

```bash
node --test tests/mobile-responsive.test.mjs
```

Expected: PASS with every table view declaring cards or contained scrolling.

### Task 6: Full verification and evidence boundaries

**Files:**
- Modify only if verification exposes a scoped responsive defect.

- [ ] **Step 1: Run whitespace validation**

Run:

```bash
git diff --check
```

Expected: no output and exit code 0.

- [ ] **Step 2: Run the complete unit/source suite**

Run:

```bash
npm run test:unit
```

Expected: all Node tests PASS. If unrelated existing tests fail, report them separately and do not call the suite green.

- [ ] **Step 3: Run the production build**

Run:

```bash
npm run build
```

Expected: `vue-tsc` and Vite production build both succeed.

- [ ] **Step 4: Verify rendered geometry**

Open the authenticated app at widths 375px, 390px, 768px, and desktop. Check the menu, representative route from every top-level group, filters, cards/tables, pagination, dialogs, editors, charts, loading, empty, and error states.

Expected: no unintended document-level horizontal scroll; local table scrolling works; primary actions remain reachable; no overlap, clipping, or fixed-column obstruction.

- [ ] **Step 5: Report exact verification boundaries**

Report static contract, unit suite, build, browser, deployment, backend/database, payment, and device evidence separately. This task does not authorize deployment and does not claim backend, database, payment-provider, or device proof.

