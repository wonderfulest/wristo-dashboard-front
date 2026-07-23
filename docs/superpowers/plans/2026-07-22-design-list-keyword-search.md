# 设计列表统一关键词搜索 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用一个输入框按设计名、AppId 或 Design UID 搜索 Dashboard 设计列表。

**Architecture:** 前端提交单一 `keyword`；后端 DTO 和控制器透传该字段，Mapper 用括号内 OR 条件完成三字段匹配。其他筛选条件保持现有 AND 组合关系。

**Tech Stack:** Vue 3、TypeScript、Element Plus、Spring Boot、MyBatis、JUnit 5

---

### Task 1: 建立后端统一关键词查询契约

**Files:**
- Modify: `wristo-api/src/main/java/com/wukong/face/modules/design/dto/DesignPageQueryDTO.java`
- Modify: `wristo-api/src/main/java/com/wukong/face/modules/design/controller/adm/DesignAdminController.java`
- Modify: `wristo-api/src/main/java/com/wukong/face/modules/design/service/impl/DesignServiceImpl.java`
- Modify: `wristo-api/src/main/resources/mapper/DesignMapper.xml`
- Test: `wristo-api/src/test/java/com/wukong/face/modules/design/mapper/DesignMapperAppIdSqlTest.java`
- Test: `wristo-api/src/test/java/com/wukong/face/modules/design/service/impl/DesignServiceImplTest.java`

- [ ] 将当前独立 `appId` 查询字段替换为 `keyword`。
- [ ] 先更新测试，断言名称包含、UID 精确、数字 AppId 精确位于同一个 OR 条件组。
- [ ] 实现控制器 trim、DTO 透传和 Mapper SQL；非数字关键词不生成 AppId 比较。
- [ ] 运行 `mvn -Dtest=DesignServiceImplTest,DesignMapperAppIdSqlTest test`，预期全部通过。

### Task 2: 合并 Dashboard 搜索输入

**Files:**
- Modify: `wristo-dashboard/src/types/design.ts`
- Modify: `wristo-dashboard/src/views/design/DesignAdmin.vue`

- [ ] 将 `DesignPageQueryDTO` 的独立名称、AppId、UID 搜索参数收敛为 `keyword?: string`。
- [ ] 将两个现有输入框替换成 `searchKeyword` 单输入框，并保留回车、清空与按钮搜索行为。
- [ ] 请求时 trim 关键词，空字符串映射为 `undefined`，搜索时重置第一页。
- [ ] 运行 `npm run build`，预期 TypeScript 与 Vite 生产构建成功。

### Task 3: 最终差异检查

**Files:**
- Verify: 上述后端与 Dashboard 文件

- [ ] 运行 `git diff --check`（分别在两个模块），预期无空白错误。
- [ ] 检查 `git status --short`，确认保留 `DesignReview.vue` 等无关未提交改动。
- [ ] 不执行 Git 提交；交付时分别报告聚焦测试、构建和未做的浏览器验证。
