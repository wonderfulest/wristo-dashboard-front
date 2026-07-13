# Dial Data Type Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让管理员在 Dashboard 配置数据项的 Goal/Range Dial 能力，并让最终用户在 Connect IQ Settings 中安全切换同模式数据项及其对应 Range 边界。

**Architecture:** Dashboard 直接维护 `data_type_options` 已有 Dial 字段，并将模式清理、校验和摘要提取为可由 Node 内置测试运行的纯函数。Connect IQ 生成器在设计导出阶段规范化每个 Dial Property 的全部候选项，模板根据当前 Property value 选择对应数据源和 Range 边界，不再只固化默认候选项。

**Tech Stack:** Vue 3、TypeScript、Element Plus、Node `node:test`、Python `unittest`、Jinja2、Monkey C、Maven/Spring Boot。

---

### Task 1: Dashboard Dial 配置纯函数和类型契约

**Files:**
- Create: `src/views/dashboard/data-options/dialConfig.mjs`
- Create: `src/views/dashboard/data-options/dialConfig.d.ts`
- Create: `tests/data-type-option-dial.test.mjs`
- Modify: `src/types/data-type-option.ts`
- Modify: `package.json`

- [ ] **Step 1: 写失败的纯单元测试**

覆盖 `normalizeDialFields()` 在 none/goal/range 模式清理互斥字段、`validateDialFields()` 拒绝非法 Range 和空 Goal Source、`dialSummary()` 输出列表摘要：

```js
assert.deepEqual(normalizeDialFields({ dialMode: null, dialMin: 0, dialMax: 100 }), {
  dialMode: null, dialMin: null, dialMax: null, dialGoalSource: null
})
assert.equal(validateDialFields({ dialMode: 'range', dialMin: 100, dialMax: 0 }),
  'Range maximum must be greater than minimum')
assert.equal(dialSummary({ dialMode: 'goal', dialGoalSource: 'garmin' }), 'Goal · Garmin')
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `node --test tests/data-type-option-dial.test.mjs`

Expected: FAIL，提示 `dialConfig.mjs` 不存在。

- [ ] **Step 3: 实现最小纯函数和声明文件**

`normalizeDialFields(form)` 返回只包含合法组合的四个 Dial 字段；`validateDialFields(form)` 返回空字符串或具体错误；`dialSummary(row)` 返回 `Goal · Garmin`、`Range · 0–100` 或 `—`。Dashboard Goal Source UI 当前只开放 `garmin`，API 保留的 `fixed` 不在没有固定目标值字段时暴露。

在 `DataTypeOptionVO`、`DataTypeOptionCreateDTO` 中加入：

```ts
dialMode?: 'goal' | 'range' | null
dialMin?: number | null
dialMax?: number | null
dialGoalSource?: 'garmin' | 'fixed' | null
```

在 `package.json` 增加：

```json
"test:unit": "node --test tests/*.test.mjs"
```

- [ ] **Step 4: 运行纯单元测试**

Run: `npm run test:unit`

Expected: PASS，0 failures。

- [ ] **Step 5: 提交**

```bash
git add package.json src/types/data-type-option.ts src/views/dashboard/data-options/dialConfig.mjs src/views/dashboard/data-options/dialConfig.d.ts tests/data-type-option-dial.test.mjs
git commit -m "add dashboard dial config contract"
```

### Task 2: Dashboard 编辑和列表 UI

**Files:**
- Modify: `src/views/dashboard/data-options/DataTypeOptionDialog.vue`
- Modify: `src/views/dashboard/data-options/DataTypeOptionsPage.vue`
- Modify: `src/views/dashboard/data-options/DataTypeOptionsList.vue`
- Test: `tests/data-type-option-dial.test.mjs`

- [ ] **Step 1: 扩充失败测试以覆盖 payload 规范化**

增加测试，确认 Goal 清除 min/max、Range 清除 goal source、None 清空全部元数据，并确认 `0` 可作为合法 Range min。

- [ ] **Step 2: 运行测试并确认新断言失败**

Run: `npm run test:unit`

Expected: FAIL，至少一个新增断言不满足。

- [ ] **Step 3: 实现弹窗交互**

在现有 form grid 中加入 `Dial Mode` 下拉。Goal 时显示只含 `Garmin Goal` 的 Goal Source；Range 时显示两个 `el-input-number`。保存前调用 `validateDialFields()`，错误时使用 `ElMessage.error()` 并停止提交；Create/Update payload 展开 `normalizeDialFields(props.form)`。

`DataTypeOptionsPage.vue` 的初始 form、Add 重置和 Edit 赋值显式包含四个 Dial 字段。`DataTypeOptionsList.vue` 增加：

```vue
<el-table-column label="Dial" min-width="160">
  <template #default="{ row }">{{ dialSummary(row) }}</template>
</el-table-column>
```

- [ ] **Step 4: 验证测试和构建**

Run: `npm run test:unit && npm run build`

Expected: 单元测试通过，`vue-tsc` 和 Vite build exit 0。

- [ ] **Step 5: 提交**

```bash
git add src/views/dashboard/data-options/DataTypeOptionDialog.vue src/views/dashboard/data-options/DataTypeOptionsPage.vue src/views/dashboard/data-options/DataTypeOptionsList.vue tests/data-type-option-dial.test.mjs
git commit -m "configure dial data types in dashboard"
```

### Task 3: 生成器规范化完整 Dial Property 候选集合

**Files:**
- Modify: `wristo-connectiq-app-build/wristo-scaffold/super-extract-elements.py`
- Modify: `wristo-connectiq-app-build/wristo-scaffold/tests/test_sub_dial_property.py`

- [ ] **Step 1: 写失败的生成器测试**

增加一个 Range Dial Property，包含两个合法 Range 候选项和一个模式不匹配项；断言输出只保留相同模式候选项，并包含：

```python
[
  {"value": 9, "metricSymbol": ":FIELD_TYPE_BATTERY", "dialMin": 0.0, "dialMax": 100.0},
  {"value": 31, "metricSymbol": ":FIELD_TYPE_TEMPERATURE", "dialMin": -20.0, "dialMax": 50.0},
]
```

另测空候选集合、无效默认值、Range 非法边界和 Goal 非 `garmin` source 均给出包含 property key 的错误。

- [ ] **Step 2: 运行测试并确认失败**

Run: `python3 -m unittest tests.test_sub_dial_property -v`

Expected: FAIL，输出尚无规范化的 `dialOptions`。

- [ ] **Step 3: 实现 Property 级规范化**

新增 `_normalize_dial_properties(properties)`：遍历 `type == "dial"` 的 Property，严格校验 mode、默认值和每个 option，将同模式合法 options 输出为包含数值 value、metricSymbol、dialMode、dialMin/dialMax 或 dialGoalSource 的结构。模式不匹配的候选项不是静默混入 Settings；如果设计数据出现不匹配，直接报告 property key，推动回到 Studio 修复。

在处理 elements 前执行此规范化，使 `config['properties']`、Settings 模板和 SubDial 元素解析共享同一份已验证数据。

- [ ] **Step 4: 运行测试**

Run: `python3 -m unittest tests.test_sub_dial_property tests.test_sub_dial -v`

Expected: PASS，0 failures。

- [ ] **Step 5: 提交**

```bash
git add wristo-scaffold/super-extract-elements.py wristo-scaffold/tests/test_sub_dial_property.py
git commit -m "validate dial property settings options"
```

### Task 4: Connect IQ Settings 和动态 Range 边界

**Files:**
- Modify: `wristo-apps/SuperAlpha/resources/settings/properties.j2.xml`
- Modify: `wristo-apps/SuperAlpha/resources/settings/settings.j2.xml`
- Modify: `wristo-apps/SuperAlpha/source/SuperAlphaView.j2.mc`
- Modify: `wristo-connectiq-app-build/wristo-scaffold/tests/test_sub_dial_template.py`

- [ ] **Step 1: 写失败的模板测试**

渲染具有两个 Range options 的设计，断言 Settings XML 同时包含两个 listEntry，并断言 Monkey C 源码根据当前 Property value 分支选择：

```text
if (dial_range_1 == 9) { min = 0.0; max = 100.0; }
else if (dial_range_1 == 31) { min = -20.0; max = 50.0; }
```

同时断言不存在 Auto、Custom 和可编辑 min/max setting。

- [ ] **Step 2: 运行测试并确认失败**

Run: `/opt/homebrew/Cellar/jinja2-cli/0.8.2_3/libexec/bin/python -m unittest tests.test_sub_dial_template -v`

Expected: FAIL，运行时代码仍固化默认 option 边界。

- [ ] **Step 3: 实现 Settings 和运行时选择**

保留 Dial Property 的 number property 和 list setting。列表遍历经生成器验证的 `prop.options`。在 `SuperAlphaView.j2.mc` 中，Range SubDial 先根据当前 `{{ element.dialProperty }}` 设置值选择对应 option 的 min/max，再用当前 fetch 的 `DATA_LOGIC_VALUE` 计算 progress；找不到映射时 progress 保持 null。Goal 继续使用当前 fetch 的 `DATA_GOAL`，且只允许已验证的 Garmin Goal 候选项。

- [ ] **Step 4: 运行完整 SubDial 纯测试**

Run: `/opt/homebrew/Cellar/jinja2-cli/0.8.2_3/libexec/bin/python -m unittest tests.test_sub_dial tests.test_sub_dial_property tests.test_sub_dial_template tests.test_sub_dial_runtime tests.test_sub_dial_progress_runtime -v`

Expected: PASS，0 failures。

- [ ] **Step 5: 分仓库提交**

```bash
git -C wristo-apps/SuperAlpha add resources/settings/properties.j2.xml resources/settings/settings.j2.xml source/SuperAlphaView.j2.mc
git -C wristo-apps/SuperAlpha commit -m "support user selectable dial settings"
git -C wristo-connectiq-app-build add wristo-scaffold/tests/test_sub_dial_template.py
git -C wristo-connectiq-app-build commit -m "test selectable dial settings"
```

如果父仓库 `.git/modules` 写权限仍阻止 SuperAlpha 提交，保留已验证修改并在交付中单独报告，不触碰无关暂存内容。

### Task 5: 全链路回归验证

**Files:**
- Verify only; do not modify unrelated files.

- [ ] **Step 1: Dashboard 验证**

Run: `npm run test:unit && npm run build` in `wristo-dashboard`

Expected: 全部测试通过，build exit 0。

- [ ] **Step 2: API 纯单元测试**

Run: `mvn -Dtest=DialDataTypeConfigValidatorTest,DataTypeOptionConverterTest test` in `wristo-api`

Expected: 5 tests，0 failures，BUILD SUCCESS。

- [ ] **Step 3: Connect IQ 生成链测试**

Run: `/opt/homebrew/Cellar/jinja2-cli/0.8.2_3/libexec/bin/python -m unittest tests.test_sub_dial tests.test_sub_dial_property tests.test_sub_dial_template tests.test_sub_dial_runtime tests.test_sub_dial_progress_runtime -v` in `wristo-connectiq-app-build/wristo-scaffold`

Expected: 0 failures。

- [ ] **Step 4: 差异检查**

Run: `git diff --check` 和 `git diff --cached --check`，分别覆盖 `wristo-dashboard`、`wristo-connectiq-app-build`、`wristo-apps/SuperAlpha`。

Expected: 全部 exit 0；交付中列出各仓库本任务提交和保留的无关工作区修改。
