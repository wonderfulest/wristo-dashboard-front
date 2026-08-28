# Launch Lifecycle Data Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立不可覆盖的首发/重上事件和应用生命周期日事实，为后续营收模型提供可信数据。

**Architecture:** 在 `wristo-api` 新增 analytics 模块；上线动作事务内追加事件，UTC 日结任务把 trials、purchase_records、refund_records 聚合为应用日事实。旧数据单独回填并标记置信度，不用 `last_go_live` 伪造完整历史。

**Tech Stack:** Java 17、Spring Boot、MyBatis XML、MySQL 8、Flyway、JUnit 5、Mockito

---

### Task 1: 建立生命周期事实表

**Files:**
- Create: `wristo-api/src/main/resources/db/migration/V97__create_launch_lifecycle_analytics.sql`
- Create: `wristo-api/src/test/java/com/wukong/face/modules/analytics/LaunchLifecycleMigrationTest.java`

- [ ] **Step 1: 编写失败的迁移契约测试**

测试读取 V97，断言包含 `app_launch_events`、`app_lifecycle_daily_facts`、事件唯一键、`DIRECT`/`BUNDLE` 分列和 UTC 统计日期索引。

```java
assertThat(sql).contains("CREATE TABLE app_launch_events");
assertThat(sql).contains("UNIQUE KEY uk_launch_event_app_time");
assertThat(sql).contains("direct_revenue_cents");
assertThat(sql).contains("bundle_revenue_cents");
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `cd wristo-api && mvn -Dtest=LaunchLifecycleMigrationTest test`

Expected: FAIL，V97 文件不存在。

- [ ] **Step 3: 编写迁移**

迁移同时为 `category_product_rel` 增加 `source`、`is_primary` 和生成列唯一约束，保证每款产品最多一个有效主分类，并把最早的有效人工分类回填为历史主分类。现有关系因历史上没有来源字段，统一以 `manual` 低风险兼容，之后新增的标签同步关系明确写入 `tag_sync`。`app_launch_events` 保存 `app_id`、`product_id`、`event_type`、`launched_at`、`designer_user_id`、`primary_category_id`、`price_cents`、`source_release_id`、`history_confidence`；`app_lifecycle_daily_facts` 保存统计日、事件、日龄、下载、订单、退款和两类营收。金额统一使用 cents，两个表都设置业务唯一键和查询索引。

- [ ] **Step 4: 运行迁移契约测试**

Run: `cd wristo-api && mvn -Dtest=LaunchLifecycleMigrationTest test`

Expected: PASS。

- [ ] **Step 5: 提交本任务（仅在用户授权后）**

```bash
git add src/main/resources/db/migration/V97__create_launch_lifecycle_analytics.sql src/test/java/com/wukong/face/modules/analytics/LaunchLifecycleMigrationTest.java
git commit -m "add launch lifecycle analytics schema"
```

### Task 2: 解析唯一主分类

**Files:**
- Create: `wristo-api/src/main/java/com/wukong/face/modules/analytics/service/AnalyticsPrimaryCategoryResolver.java`
- Create: `wristo-api/src/test/java/com/wukong/face/modules/analytics/service/AnalyticsPrimaryCategoryResolverTest.java`
- Modify: `wristo-api/src/main/java/com/wukong/face/modules/products/mapper/CategoryProductRelMapper.java`
- Modify: `wristo-api/src/main/resources/mapper/CategoryProductRelMapper.xml`
- Modify: `wristo-api/src/main/java/com/wukong/face/modules/products/entity/CategoryProductRel.java`

- [ ] **Step 1: 编写解析优先级测试**

覆盖：主分类优先；无主分类时选择最早人工分类；只有自动分类或无分类时返回空，聚合层映射到“未分类”。

```java
assertThat(resolver.resolve(appId)).isEqualTo(primaryCategoryId);
assertThat(resolver.resolve(appWithoutPrimary)).isEqualTo(firstManualCategoryId);
assertThat(resolver.resolve(appWithoutManual)).isEmpty();
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `cd wristo-api && mvn -Dtest=AnalyticsPrimaryCategoryResolverTest test`

Expected: FAIL，解析器不存在。

- [ ] **Step 3: 实现确定性查询和解析器**

Mapper 查询只返回未删除关系，排序固定为主分类、人工来源、关系创建时间、关系 ID；解析器只取第一条，确保同一应用不重复归类。

分类更新服务必须在同一事务中先清除该产品原主分类，再设置目标关系的 `is_primary = 1`；不能用分类权重代替主分类。

- [ ] **Step 4: 运行测试**

Run: `cd wristo-api && mvn -Dtest=AnalyticsPrimaryCategoryResolverTest test`

Expected: PASS。

- [ ] **Step 5: 提交本任务（仅在用户授权后）**

```bash
git add src/main/java/com/wukong/face/modules/analytics src/main/java/com/wukong/face/modules/products/mapper/CategoryProductRelMapper.java src/main/resources/mapper/CategoryProductRelMapper.xml src/test/java/com/wukong/face/modules/analytics
git commit -m "resolve analytics primary categories"
```

### Task 3: 在真实上线事务中追加事件

**Files:**
- Create: `wristo-api/src/main/java/com/wukong/face/modules/analytics/entity/AppLaunchEvent.java`
- Create: `wristo-api/src/main/java/com/wukong/face/modules/analytics/mapper/AppLaunchEventMapper.java`
- Create: `wristo-api/src/main/resources/mapper/AppLaunchEventMapper.xml`
- Create: `wristo-api/src/main/java/com/wukong/face/modules/analytics/service/AppLaunchEventRecorder.java`
- Modify: `wristo-api/src/main/java/com/wukong/face/modules/products/orchestrator/impl/ProductOrchestratorImpl.java`
- Test: `wristo-api/src/test/java/com/wukong/face/modules/analytics/service/AppLaunchEventRecorderTest.java`
- Test: `wristo-api/src/test/java/com/wukong/face/modules/products/orchestrator/impl/ProductOrchestratorImplGoLiveTagsTest.java`

- [ ] **Step 1: 编写首发与重上测试**

断言无历史事件时写 `FIRST_LAUNCH`，已有首发时写 `RELAUNCH`；重复请求由业务唯一键幂等；事件保存设计师、主分类、价格快照和发布记录 ID。

- [ ] **Step 2: 运行测试并确认失败**

Run: `cd wristo-api && mvn -Dtest=AppLaunchEventRecorderTest,ProductOrchestratorImplGoLiveTagsTest test`

Expected: FAIL，Recorder 尚未接入。

- [ ] **Step 3: 实现 Recorder 并接入上线成功分支**

Recorder 在同一事务内查询最早事件决定类型，使用发布成功时间作为 `launched_at`。只有真实上线成功才记录，打包、审核和仅更新 `last_go_live` 的失败路径不得写事件。

- [ ] **Step 4: 运行测试**

Run: `cd wristo-api && mvn -Dtest=AppLaunchEventRecorderTest,ProductOrchestratorImplGoLiveTagsTest test`

Expected: PASS。

- [ ] **Step 5: 提交本任务（仅在用户授权后）**

```bash
git add src/main/java/com/wukong/face/modules/analytics src/main/resources/mapper/AppLaunchEventMapper.xml src/main/java/com/wukong/face/modules/products/orchestrator/impl/ProductOrchestratorImpl.java src/test/java/com/wukong/face/modules
git commit -m "record immutable app launch events"
```

### Task 4: 聚合应用生命周期日事实

**Files:**
- Create: `wristo-api/src/main/java/com/wukong/face/modules/analytics/entity/AppLifecycleDailyFact.java`
- Create: `wristo-api/src/main/java/com/wukong/face/modules/analytics/mapper/AppLifecycleDailyFactMapper.java`
- Create: `wristo-api/src/main/resources/mapper/AppLifecycleDailyFactMapper.xml`
- Create: `wristo-api/src/main/java/com/wukong/face/modules/analytics/service/AppLifecycleAggregationService.java`
- Test: `wristo-api/src/test/java/com/wukong/face/modules/analytics/service/AppLifecycleAggregationServiceTest.java`
- Test: `wristo-api/src/test/java/com/wukong/face/modules/analytics/mapper/AppLifecycleDailyFactMapperSqlTest.java`

- [ ] **Step 1: 编写聚合与 SQL 契约测试**

覆盖 `trials.status >= 1` 下载口径、成功且未删除订单、直接/Bundle 分列、退款扣减、UTC 半开区间、首发优先于重上、无有效窗口归为 STOCK，以及重复聚合幂等覆盖。

- [ ] **Step 2: 运行测试并确认失败**

Run: `cd wristo-api && mvn -Dtest=AppLifecycleAggregationServiceTest,AppLifecycleDailyFactMapperSqlTest test`

Expected: FAIL，聚合服务和 Mapper 不存在。

- [ ] **Step 3: 实现原始聚合查询和状态分类**

查询区间固定为 `[UTC day start, next UTC day start)`；先按应用聚合原始事实，再关联当日之前最近上线事件。状态优先级固定为 FIRST_LAUNCH、RELAUNCH、STOCK，事件窗口由模型配置提供，初始展示窗口使用 30 天但保留原始日龄。

- [ ] **Step 4: 实现幂等 upsert**

按 `(stat_date, app_id)` upsert；同一天重算覆盖计数和金额，不累加旧值。保存 `source_complete` 和 `history_confidence`。

- [ ] **Step 5: 运行测试**

Run: `cd wristo-api && mvn -Dtest=AppLifecycleAggregationServiceTest,AppLifecycleDailyFactMapperSqlTest test`

Expected: PASS。

- [ ] **Step 6: 提交本任务（仅在用户授权后）**

```bash
git add src/main/java/com/wukong/face/modules/analytics src/main/resources/mapper/AppLifecycleDailyFactMapper.xml src/test/java/com/wukong/face/modules/analytics
git commit -m "aggregate app lifecycle daily facts"
```

### Task 5: 日结调度与历史回填

**Files:**
- Create: `wristo-api/src/main/java/com/wukong/face/modules/analytics/schedule/AppLifecycleAnalyticsScheduler.java`
- Create: `wristo-api/src/main/java/com/wukong/face/modules/analytics/service/LaunchHistoryBackfillService.java`
- Create: `wristo-api/src/main/java/com/wukong/face/modules/analytics/controller/admin/AppLifecycleAnalyticsAdminController.java`
- Create: `wristo-api/src/main/java/com/wukong/face/modules/analytics/dto/AnalyticsRebuildRequest.java`
- Test: `wristo-api/src/test/java/com/wukong/face/modules/analytics/schedule/AppLifecycleAnalyticsSchedulerTest.java`
- Test: `wristo-api/src/test/java/com/wukong/face/modules/analytics/service/LaunchHistoryBackfillServiceTest.java`

- [ ] **Step 1: 编写 UTC 日结和回填置信度测试**

断言定时任务只聚合已结束的 UTC 前一天；发布账本可证明的事件标记 HIGH，只有 `last_go_live` 的记录标记 LOW 且不能伪造多次重上。

- [ ] **Step 2: 运行测试并确认失败**

Run: `cd wristo-api && mvn -Dtest=AppLifecycleAnalyticsSchedulerTest,LaunchHistoryBackfillServiceTest test`

Expected: FAIL。

- [ ] **Step 3: 实现日结、回填和管理员重算接口**

Scheduler 只增量处理前一个完整 UTC 自然日。管理员 `POST /api/admin/analytics/lifecycle/backfill` 接收可选 `endExclusive` 和 `days`，首期默认且最多回填 60 天；任务在单线程后台执行，HTTP 立即返回，并通过 `GET /api/admin/analytics/lifecycle/backfill/status` 查询状态。每个统计日使用独立事务删除并重建，避免失败时留下半日数据。

- [ ] **Step 4: 运行模块测试和完整测试**

Run: `cd wristo-api && mvn -Dtest='com.wukong.face.modules.analytics.**' test`

Expected: PASS。

Run: `cd wristo-api && mvn test`

Expected: PASS；若存在无关基线失败，单独记录，不能归因于本功能。

- [ ] **Step 5: 提交本任务（仅在用户授权后）**

```bash
git add src/main/java/com/wukong/face/modules/analytics src/test/java/com/wukong/face/modules/analytics
git commit -m "schedule lifecycle analytics aggregation"
```

### Task 6: 数据基础验收

- [ ] **Step 1: 在本地测试库执行 Flyway**

Run: `cd wristo-api && mvn -Dspring.profiles.active=test flyway:migrate`

Expected: V97 成功；不要在此步骤迁移生产库。

- [ ] **Step 2: 对固定 14 天样本重算并执行守恒查询**

验证每日 FIRST_LAUNCH + RELAUNCH + STOCK 等于全站应用事实；直接营收 + Bundle 营收等于总归因营收；品类归属每应用每天最多一条。

- [ ] **Step 3: 检查工作树**

Run: `git -C wristo-api diff --check && git -C wristo-api status --short`

Expected: 无空白错误，仅包含本计划文件。
