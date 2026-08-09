# Data Type Unit i18n Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make dashboard data-type units editable and persistable in every supported language while retaining `unit` as the default value.

**Architecture:** Add a nullable `unit_i18n` JSON column and carry it through the existing DataTypeOption persistence contract. Generalize the dashboard label i18n popover to target either `labelI18n` or `unitI18n`, while keeping add/edit English and Chinese shortcuts in the main form.

**Tech Stack:** Spring Boot, MyBatis XML, Flyway/MySQL JSON, Java/JUnit 5, Vue 3, TypeScript, Element Plus, Node test runner, Vite.

---

### Task 1: Lock the dashboard contract with failing tests

**Files:**
- Create: `tests/data-type-option-unit-i18n.test.mjs`
- Inspect: `src/types/data-type-option.ts`
- Inspect: `src/views/dashboard/data-options/DataOptionI18nPopover.vue`
- Inspect: `src/views/dashboard/data-options/DataTypeOptionsList.vue`
- Inspect: `src/views/dashboard/data-options/DataTypeOptionDialog.vue`
- Inspect: `src/views/dashboard/data-options/DataTypeOptionsPage.vue`

- [ ] **Step 1: Write a source-contract test**

Create a Node test that reads the five source files and asserts: `unitI18n?: LabelI18n` exists in VO/Create DTO contracts; the popover accepts a `field` prop and builds `{ [props.field]: { ...editI18n } }`; the list renders a `Unit i18n` column targeting `unitI18n`; the dialog payload includes `unitI18n.eng/zhs`; and page edit/reset state includes `engUnit` and `zhsUnit`.

- [ ] **Step 2: Run the test and verify failure**

Run: `node --test tests/data-type-option-unit-i18n.test.mjs`

Expected: FAIL because `unitI18n`, the configurable popover field, and unit shortcut fields do not yet exist.

### Task 2: Implement dashboard unit i18n

**Files:**
- Modify: `src/types/data-type-option.ts`
- Modify: `src/views/dashboard/data-options/DataOptionI18nPopover.vue`
- Modify: `src/views/dashboard/data-options/DataTypeOptionsList.vue`
- Modify: `src/views/dashboard/data-options/DataTypeOptionDialog.vue`
- Modify: `src/views/dashboard/data-options/DataTypeOptionsPage.vue`
- Test: `tests/data-type-option-unit-i18n.test.mjs`

- [ ] **Step 1: Extend TypeScript contracts**

Add `unitI18n?: LabelI18n` beside `unit` in `DataTypeOptionVO` and `DataTypeOptionCreateDTO`; Update DTO inherits the create contract.

- [ ] **Step 2: Generalize the popover**

Add `field: 'labelI18n' | 'unitI18n'` and optional accessible-label props. Read/watch `props.row[props.field]`, check language existence against the selected map, and save with:

```ts
const payload: Partial<DataTypeOptionUpdateDTO> = {
  [props.field]: { ...editI18n }
}
await updateDataTypeOption(Number(props.row.id), payload)
```

- [ ] **Step 3: Render distinct Label and Unit editors**

Pass `field="labelI18n"` to the existing column. Keep the plain `Unit` column and add `Unit i18n` with a second popover using `field="unitI18n"`; both emit `refresh` only after successful saves.

- [ ] **Step 4: Add unit shortcuts to add/edit**

Extend form helper state with `engUnit` and `zhsUnit`, render `EN Unit` and `CN Unit` inputs, and include:

```ts
unitI18n: {
  eng: props.form.engUnit || '',
  zhs: props.form.zhsUnit || ''
}
```

in create and update payloads. Reset both on Add; on Edit load normalized `row.unitI18n.eng/zhs`, with English falling back to `row.unit` and Chinese to an empty string.

- [ ] **Step 5: Run the focused dashboard tests**

Run: `node --test tests/data-type-option-unit-i18n.test.mjs tests/data-type-option-dial.test.mjs`

Expected: all tests PASS.

### Task 3: Lock and implement the API contract

**Files:**
- Create: `src/main/resources/db/migration/V56__add_data_type_option_unit_i18n.sql`
- Modify: `src/main/java/com/wukong/face/modules/design/entity/DataTypeOption.java`
- Modify: `src/main/java/com/wukong/face/modules/design/dto/DataTypeOptionCreateDTO.java`
- Modify: `src/main/java/com/wukong/face/modules/design/dto/DataTypeOptionUpdateDTO.java`
- Modify: `src/main/java/com/wukong/face/modules/design/vo/DataTypeOptionVO.java`
- Modify: `src/main/java/com/wukong/face/modules/design/converter/DataTypeOptionConverter.java`
- Modify: `src/main/resources/mapper/DataTypeOptionMapper.xml`
- Modify: `src/test/java/com/wukong/face/modules/design/converter/DataTypeOptionConverterTest.java`

- [ ] **Step 1: Write the failing converter test**

Create an entity with `unit="bpm"` and `unitI18n="{\"en\":\"BPM\",\"zhs\":\"次/分\"}"`; assert the VO map equals `eng -> BPM`, `zhs -> 次/分`. Run `mvn -Dtest=DataTypeOptionConverterTest test` and expect failure because unit i18n accessors do not exist.

- [ ] **Step 2: Add the migration and Java fields**

Create the migration with:

```sql
ALTER TABLE `data_type_options`
  ADD COLUMN `unit_i18n` JSON DEFAULT NULL COMMENT 'Multilingual unit JSON' AFTER `unit`;
```

Add `String unitI18n` to the entity and `Map<String, String> unitI18n` to create DTO, update DTO, and VO.

- [ ] **Step 3: Reuse converter normalization**

Rename the private label-specific parser to a generic `parseI18n`, use it for both `labelI18n` and `unitI18n`, and set the non-empty unit map on the VO. Preserve label fallback behavior unchanged.

- [ ] **Step 4: Map persistence in every SQL path**

Add `unitI18n/unit_i18n` to the result map, base column list, insert columns/values, and conditional update assignment. Do not edit V53-V55 or product/PRG files.

- [ ] **Step 5: Run the focused backend test**

Run: `mvn -Dtest=DataTypeOptionConverterTest test`

Expected: PASS.

### Task 4: Full proportional verification

**Files:**
- Verify all files changed in Tasks 1-3

- [ ] **Step 1: Run dashboard tests and build**

Run: `node --test tests/data-type-option-unit-i18n.test.mjs tests/data-type-option-dial.test.mjs && npm run build` from `wristo-dashboard`.

Expected: tests pass and Vite build completes without TypeScript errors.

- [ ] **Step 2: Run backend design-module tests**

Run: `mvn -Dtest=DataTypeOptionConverterTest,DialDataTypeConfigValidatorTest test` from `wristo-api`.

Expected: all selected tests pass.

- [ ] **Step 3: Review scope and diffs**

Run `git diff --check` and repository-specific `git status --short`. Confirm only the planned dashboard files, design/plan docs, API DataTypeOption files, test, and V56 migration were added or changed by this task; preserve all pre-existing PRG changes and V53-V55 files.

- [ ] **Step 4: Report proof boundaries**

Report focused test/build results separately from unverified database migration execution, browser interaction, deployment, and production behavior. Do not commit, push, deploy, or restart services without explicit authorization.

### Task 5: Add searchable language selection

**Files:**
- Modify: `tests/data-type-option-unit-i18n.test.mjs`
- Modify: `src/views/dashboard/data-options/DataOptionI18nPopover.vue`

- [ ] **Step 1: Add a failing source-contract test**

Assert that the shared language `el-select` contains the Element Plus `filterable` attribute and does not contain `allow-create`, proving both Label and Unit can filter only the supported language list.

- [ ] **Step 2: Verify RED**

Run: `node --test tests/data-type-option-unit-i18n.test.mjs`

Expected: FAIL because the shared language selector is not filterable.

- [ ] **Step 3: Implement searchable selection**

Add `filterable` to the shared language selector without adding `allow-create`.

- [ ] **Step 4: Verify GREEN and build**

Run: `node --test tests/data-type-option-unit-i18n.test.mjs tests/data-type-option-dial.test.mjs && npm run build`

Expected: 14 tests pass and the production build completes.
