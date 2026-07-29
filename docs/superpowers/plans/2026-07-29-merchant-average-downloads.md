# 商家应用平均下载量实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在后台商家列表中展示前端计算并四舍五入取整的应用平均下载量。

**Architecture:** 复用商家列表接口已有的 `appCount` 与 `totalDownloads` 字段，在 `Merchant.vue` 内通过纯格式化函数完成计算和除零兜底，由新增的 Element Plus 表格列调用。后端、接口类型和持久化逻辑均不变。

**Tech Stack:** Vue 3、TypeScript、Element Plus

---

### Task 1: 增加应用平均下载量列

**Files:**

- Modify: `src/views/merchant/Merchant.vue:47-50`
- Modify: `src/views/merchant/Merchant.vue:197-205`

- [ ] **Step 1: 增加平均下载量格式化函数**

在 `roleFormatter` 后增加：

```ts
const formatAverageDownloads = (row: MchUserVO) => {
  const appCount = Number(row?.appCount) || 0
  if (appCount <= 0) return '-'

  const totalDownloads = Number(row?.totalDownloads) || 0
  return Math.round(totalDownloads / appCount)
}
```

该函数确保应用数为零或无效时显示 `-`，总下载缺失时按 `0` 处理。

- [ ] **Step 2: 在总下载列后增加表格列**

在“总下载”与“操作”之间增加：

```vue
<el-table-column label="应用平均下载量" width="140">
  <template #default="{ row }">
    {{ formatAverageDownloads(row) }}
  </template>
</el-table-column>
```

- [ ] **Step 3: 静态检查变更**

运行：

```bash
git diff --check -- src/views/merchant/Merchant.vue
git diff -- src/views/merchant/Merchant.vue
```

预期：没有空白错误；差异仅包含格式化函数与新表格列。按用户要求，不运行测试、构建、浏览器或接口验证，也不提交 Git。
