# Launch Lifecycle Recommendation Model and API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 基于生命周期事实生成可解释的生命周期、品类/设计师价值和每日上线配额推荐 API；首次 60 天为试运行建议，累计至 180 天后转为正式建议。

**Architecture:** 在 `wristo-api` analytics 模块中把描述统计、边际收益估计和推荐快照分离。模型仅消费日事实，输出带版本、样本量、置信区间的不可变快照；Dashboard API 不在线训练。

**Tech Stack:** Java 17、Spring Boot、MyBatis、MySQL 8、JUnit 5

---

### Task 1: 建立模型快照表和查询对象

**Files:**
- Create: `wristo-api/src/main/resources/db/migration/V98__create_launch_analytics_model_snapshots.sql`
- Create: `wristo-api/src/main/java/com/wukong/face/modules/analytics/entity/AnalyticsModelSnapshot.java`
- Create: `wristo-api/src/main/java/com/wukong/face/modules/analytics/dto/AnalyticsQuery.java`
- Test: `wristo-api/src/test/java/com/wukong/face/modules/analytics/AnalyticsModelSnapshotMigrationTest.java`

- [ ] **Step 1:** 写迁移测试，断言快照包含 model_version、trained_from/to、validated_from/to、sample_size、confidence、payload_json、status 和唯一版本键。
- [ ] **Step 2:** 运行 `cd wristo-api && mvn -Dtest=AnalyticsModelSnapshotMigrationTest test`，确认 FAIL。
- [ ] **Step 3:** 创建 V98、实体和查询 DTO；日期范围最大 180 天，默认 UTC。
- [ ] **Step 4:** 重跑测试，Expected: PASS。
- [ ] **Step 5:** 获得授权后提交 `add analytics model snapshots`。

### Task 2: 生命周期分位数、峰值和长尾

**Files:**
- Create: `wristo-api/src/main/java/com/wukong/face/modules/analytics/model/LifecycleCurveCalculator.java`
- Create: `wristo-api/src/main/java/com/wukong/face/modules/analytics/vo/LifecycleCurveVO.java`
- Test: `wristo-api/src/test/java/com/wukong/face/modules/analytics/model/LifecycleCurveCalculatorTest.java`

- [ ] **Step 1:** 用固定序列编写 P25/P50/P75、峰值、连续 3 日半衰期、连续 7 日长尾测试，并覆盖样本不足。
- [ ] **Step 2:** 运行 `cd wristo-api && mvn -Dtest=LifecycleCurveCalculatorTest test`，确认 FAIL。
- [ ] **Step 3:** 实现纯 Java 计算器；输入按 eventType/category/designer/priceBand 聚合的日龄样本，输出标准窗口和样本量，不访问数据库。
- [ ] **Step 4:** 重跑测试，Expected: PASS。
- [ ] **Step 5:** 获得授权后提交 `calculate lifecycle curves`。

### Task 3: 品类和设计师价值矩阵

**Files:**
- Create: `wristo-api/src/main/java/com/wukong/face/modules/analytics/model/ValueMatrixCalculator.java`
- Create: `wristo-api/src/main/java/com/wukong/face/modules/analytics/vo/CategoryValueVO.java`
- Create: `wristo-api/src/main/java/com/wukong/face/modules/analytics/vo/DesignerValueVO.java`
- Test: `wristo-api/src/test/java/com/wukong/face/modules/analytics/model/ValueMatrixCalculatorTest.java`

- [ ] **Step 1:** 编写四象限、P90 爆款、首发成功率、稳定性和设计师样本门槛测试。
- [ ] **Step 2:** 运行 `cd wristo-api && mvn -Dtest=ValueMatrixCalculatorTest test`，确认 FAIL。
- [ ] **Step 3:** 实现规模/效率中位数阈值、同分类同价格 cohort 排名；设计师少于 5 款或少于 3 款满 30 天时 ratingStatus=SAMPLE_INSUFFICIENT。
- [ ] **Step 4:** 重跑测试，Expected: PASS。
- [ ] **Step 5:** 获得授权后提交 `score category and designer value`。

### Task 4: 边际收益与推荐区间

**Files:**
- Create: `wristo-api/src/main/java/com/wukong/face/modules/analytics/model/MarginalRevenueCalculator.java`
- Create: `wristo-api/src/main/java/com/wukong/face/modules/analytics/model/CategoryQuotaAllocator.java`
- Create: `wristo-api/src/main/java/com/wukong/face/modules/analytics/vo/LaunchRecommendationVO.java`
- Test: `wristo-api/src/test/java/com/wukong/face/modules/analytics/model/MarginalRevenueCalculatorTest.java`
- Test: `wristo-api/src/test/java/com/wukong/face/modules/analytics/model/CategoryQuotaAllocatorTest.java`

- [ ] **Step 1:** 编写分桶回测数据，断言推荐区间达到最大预测营收 95%、边际收益为正、存量/单款营收未下降超过 10%。
- [ ] **Step 2:** 编写配额测试，断言总配额守恒、优先最高边际品类、品类上限/探索下限/设计师上限有效、首发与重上分列。
- [ ] **Step 3:** 运行两个测试并确认 FAIL。
- [ ] **Step 4:** 实现可解释的分层分桶估计和 bootstrap 置信区间；固定随机种子保证测试可重复，不引入黑盒 ML 依赖。
- [ ] **Step 5:** 实现贪心配额分配器；无法满足约束时返回 reasons，而非静默丢失名额。
- [ ] **Step 6:** 重跑测试，Expected: PASS。
- [ ] **Step 7:** 获得授权后提交 `recommend daily launch quotas`。

### Task 5: 每周训练、30 天验证和快照回退

**Files:**
- Create: `wristo-api/src/main/java/com/wukong/face/modules/analytics/service/LaunchAnalyticsTrainingService.java`
- Create: `wristo-api/src/main/java/com/wukong/face/modules/analytics/schedule/LaunchAnalyticsTrainingScheduler.java`
- Create: `wristo-api/src/main/java/com/wukong/face/modules/analytics/mapper/AnalyticsModelSnapshotMapper.java`
- Create: `wristo-api/src/main/resources/mapper/AnalyticsModelSnapshotMapper.xml`
- Test: `wristo-api/src/test/java/com/wukong/face/modules/analytics/service/LaunchAnalyticsTrainingServiceTest.java`

- [ ] **Step 1:** 编写 180 天训练、30 天验证、未结束当日排除、失败保留上一 SUCCESS 快照测试。
- [ ] **Step 2:** 运行测试并确认 FAIL。
- [ ] **Step 3:** 实现训练编排；先保存 TRAINING，所有计算与回测成功后原子更新 SUCCESS，失败写 FAILED 但不替换当前成功版本。
- [ ] **Step 4:** 重跑测试，Expected: PASS。
- [ ] **Step 5:** 获得授权后提交 `train launch analytics recommendations`。

### Task 6: 六组管理员只读 API

**Files:**
- Create: `wristo-api/src/main/java/com/wukong/face/modules/analytics/controller/admin/LaunchAnalyticsAdminController.java`
- Create: `wristo-api/src/main/java/com/wukong/face/modules/analytics/service/LaunchAnalyticsQueryService.java`
- Create: `wristo-api/src/main/java/com/wukong/face/modules/analytics/vo/CohortContributionVO.java`
- Test: `wristo-api/src/test/java/com/wukong/face/modules/analytics/controller/admin/LaunchAnalyticsAdminControllerTest.java`

- [ ] **Step 1:** 编写接口契约测试：`/recommendation`、`/contributions`、`/lifecycle`、`/marginal-revenue`、`/categories`、`/designers`；全部返回 timezone、sampleSize、modelVersion、generatedAt。
- [ ] **Step 2:** 运行测试并确认 FAIL。
- [ ] **Step 3:** 实现 Controller 和 QueryService；只读接口不触发训练，实时当日标记 partial=true，样本不足返回明确状态。
- [ ] **Step 4:** 运行 `cd wristo-api && mvn -Dtest='com.wukong.face.modules.analytics.**' test`，Expected: PASS。
- [ ] **Step 5:** 运行 `cd wristo-api && mvn test` 并执行 `git diff --check`。
- [ ] **Step 6:** 获得授权后提交 `expose launch analytics APIs`。

### Task 7: 历史回测验收

- [ ] **Step 1:** 在本地恢复的生产脱敏快照上构建 180 天事实，不连接或修改生产库。
- [ ] **Step 2:** 训练前 150 天、验证后 30 天；输出实际上线量、推荐区间、实际营收、区间内历史日营收和误差。
- [ ] **Step 3:** 验证推荐原因、置信区间和样本量可追溯；若无法优于基线，Dashboard 必须显示“证据不足”，不能生成激进配额。
