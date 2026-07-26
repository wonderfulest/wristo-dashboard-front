# Country Order Distribution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Dashboard home statistic that shows the Top 5, 10, or 20 countries by successful order count for a selectable range of at most one month.

**Architecture:** Add a dedicated country aggregation query in the API purchase module and return a compact, non-paginated distribution response. Add one self-contained Vue component that owns its filters, API request, ECharts donut, table, and error state, then mount it between the existing device and app summaries.

**Tech Stack:** Java 17, Spring Boot, MyBatis, JUnit 5, Mockito, Vue 3, TypeScript, Element Plus, ECharts, Vite.

---

Git commits are intentionally omitted because the workspace contains unrelated uncommitted API changes and the user did not authorize commits.

### Task 1: Define and test the backend aggregation contract

**Files:**
- Create: `wristo-api/src/main/java/com/wukong/face/modules/purchase/dto/CountryOrderStatsQueryDTO.java`
- Create: `wristo-api/src/main/java/com/wukong/face/modules/purchase/vo/CountryOrderStatsItemVO.java`
- Create: `wristo-api/src/main/java/com/wukong/face/modules/purchase/vo/CountryOrderDistributionVO.java`
- Create: `wristo-api/src/main/java/com/wukong/face/modules/purchase/service/CountryOrderStatsService.java`
- Create: `wristo-api/src/main/java/com/wukong/face/modules/purchase/service/impl/CountryOrderStatsServiceImpl.java`
- Create: `wristo-api/src/test/java/com/wukong/face/modules/purchase/service/impl/CountryOrderStatsServiceImplTest.java`

- [ ] **Step 1: Write failing service tests**

Cover:

```java
@Test
void returnsTopCountriesWithPercentagesAndOtherOrders() {
    CountryOrderStatsQueryDTO query = query(
            LocalDate.of(2026, 7, 1),
            LocalDate.of(2026, 7, 26),
            5);
    when(mapper.countCountryOrderStatsOrders(query)).thenReturn(10L);
    when(mapper.selectCountryOrderStats(query)).thenReturn(List.of(
            item("US", 6L),
            item("DE", 3L)));

    CountryOrderDistributionVO result = service.getDistribution(query);

    assertEquals(10L, result.getTotalOrders());
    assertEquals(1L, result.getOtherOrderCount());
    assertEquals(new BigDecimal("60.00"), result.getItems().get(0).getPercentage());
}

@Test
void rejectsRangeLongerThanOneMonth() {
    CountryOrderStatsQueryDTO query = query(
            LocalDate.of(2026, 5, 31),
            LocalDate.of(2026, 7, 1),
            10);

    BizException error = assertThrows(BizException.class, () -> service.getDistribution(query));

    assertEquals(400, error.getCode());
}

@ParameterizedTest
@ValueSource(ints = {0, 1, 6, 50})
void rejectsUnsupportedTopN(int topN) {
    assertThrows(BizException.class, () -> service.getDistribution(
            query(LocalDate.of(2026, 7, 1), LocalDate.of(2026, 7, 26), topN)));
}
```

Also test default `topN = 10`, default range ending today, reversed dates, future end dates, and an empty result.

- [ ] **Step 2: Run tests and verify they fail**

Run:

```bash
cd wristo-api
mvn -Dtest=CountryOrderStatsServiceImplTest test
```

Expected: compilation failure because the DTO, VO, and service types do not exist.

- [ ] **Step 3: Add DTO and response types**

Use these fields:

```java
@Data
public class CountryOrderStatsQueryDTO {
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer topN;
}

@Data
public class CountryOrderStatsItemVO {
    private String countryCode;
    private Long orderCount;
    private BigDecimal percentage;
}

@Data
public class CountryOrderDistributionVO {
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer topN;
    private Long totalOrders;
    private Long otherOrderCount;
    private List<CountryOrderStatsItemVO> items;
}
```

- [ ] **Step 4: Implement validation and response calculation**

`CountryOrderStatsServiceImpl#getDistribution` must:

```java
CountryOrderStatsQueryDTO safeQuery = normalize(query);
long totalOrders = defaultZero(mapper.countCountryOrderStatsOrders(safeQuery));
List<CountryOrderStatsItemVO> items = mutableList(mapper.selectCountryOrderStats(safeQuery));
long topOrders = 0L;
for (CountryOrderStatsItemVO item : items) {
    long count = defaultZero(item.getOrderCount());
    topOrders += count;
    item.setPercentage(percentage(count, totalOrders));
}

CountryOrderDistributionVO result = new CountryOrderDistributionVO();
result.setStartDate(safeQuery.getStartDate());
result.setEndDate(safeQuery.getEndDate());
result.setTopN(safeQuery.getTopN());
result.setTotalOrders(totalOrders);
result.setOtherOrderCount(Math.max(0L, totalOrders - topOrders));
result.setItems(items);
return result;
```

Normalization rules:

- null request becomes an empty request;
- missing end date becomes today;
- missing start date becomes `endDate.minusMonths(1)`;
- start after end throws `new BizException(400, "开始日期不能晚于结束日期")`;
- end after today throws `new BizException(400, "结束日期不能晚于今天")`;
- start before `endDate.minusMonths(1)` throws `new BizException(400, "国家订单统计最多支持一个月")`;
- missing Top N becomes 10; allowed values are exactly 5, 10, and 20.

- [ ] **Step 5: Run the focused tests**

Run:

```bash
cd wristo-api
mvn -Dtest=CountryOrderStatsServiceImplTest test
```

Expected: all `CountryOrderStatsServiceImplTest` tests pass.

### Task 2: Add and test the MyBatis country queries

**Files:**
- Modify: `wristo-api/src/main/java/com/wukong/face/modules/purchase/mapper/PurchaseRecordMapper.java`
- Modify: `wristo-api/src/main/resources/mapper/PurchaseRecordMapper.xml`
- Create: `wristo-api/src/test/java/com/wukong/face/modules/purchase/mapper/PurchaseRecordMapperCountryStatsSqlTest.java`

- [ ] **Step 1: Write a failing mapper XML test**

Load `mapper/PurchaseRecordMapper.xml` with `XMLMapperBuilder`, resolve both statement IDs, normalize whitespace, and assert:

```java
assertTrue(topSql.contains("from purchase_records pr"));
assertTrue(topSql.contains("pr.status = 1"));
assertTrue(topSql.contains("pr.is_deleted = 0"));
assertTrue(topSql.contains("regexp '^[a-z]{2}$'"));
assertTrue(topSql.contains("else 'unknown'"));
assertTrue(topSql.contains("pr.created_at >="));
assertTrue(topSql.contains("pr.created_at < date_add("));
assertTrue(topSql.contains("limit"));
assertTrue(countSql.contains("count(*)"));
```

- [ ] **Step 2: Run the mapper test and verify it fails**

Run:

```bash
cd wristo-api
mvn -Dtest=PurchaseRecordMapperCountryStatsSqlTest test
```

Expected: failure because the country statement IDs do not exist.

- [ ] **Step 3: Add mapper methods**

Add:

```java
List<CountryOrderStatsItemVO> selectCountryOrderStats(
        @Param("query") CountryOrderStatsQueryDTO query);

Long countCountryOrderStatsOrders(
        @Param("query") CountryOrderStatsQueryDTO query);
```

- [ ] **Step 4: Add the aggregation SQL**

Use the normalized expression consistently in `SELECT` and `GROUP BY`:

```sql
CASE
    WHEN UPPER(TRIM(pr.country_code)) REGEXP '^[A-Z]{2}$'
        THEN UPPER(TRIM(pr.country_code))
    ELSE 'Unknown'
END
```

Filter with:

```sql
pr.status = 1
AND pr.is_deleted = 0
AND pr.created_at >= #{query.startDate}
AND pr.created_at < DATE_ADD(#{query.endDate}, INTERVAL 1 DAY)
```

Order by `orderCount DESC, countryCode ASC` and apply `LIMIT #{query.topN}`. The count query must use the identical status, deletion, and date filters without grouping.

- [ ] **Step 5: Run mapper and service tests**

Run:

```bash
cd wristo-api
mvn -Dtest=PurchaseRecordMapperCountryStatsSqlTest,CountryOrderStatsServiceImplTest test
```

Expected: both test classes pass.

### Task 3: Expose the administrator endpoint

**Files:**
- Modify: `wristo-api/src/main/java/com/wukong/face/modules/purchase/controller/admin/PurchasesAdminController.java`
- Create: `wristo-api/src/test/java/com/wukong/face/modules/purchase/controller/admin/PurchasesAdminControllerCountryStatsTest.java`

- [ ] **Step 1: Write the controller test**

Instantiate the controller with an injected mock `CountryOrderStatsService`, call the new method, and verify that the returned `Result` contains the service response and the same DTO is passed to the service.

- [ ] **Step 2: Run the controller test and verify it fails**

Run:

```bash
cd wristo-api
mvn -Dtest=PurchasesAdminControllerCountryStatsTest test
```

Expected: compilation failure because the controller method is absent.

- [ ] **Step 3: Add the endpoint**

Inject `CountryOrderStatsService` and add:

```java
@Operation(summary = "管理员-Top N 国家订单分布")
@PostMapping("/country/summary")
public Result<CountryOrderDistributionVO> countrySummary(
        @RequestBody(required = false) CountryOrderStatsQueryDTO dto) {
    return Result.success(countryOrderStatsService.getDistribution(dto));
}
```

- [ ] **Step 4: Run all focused backend tests**

Run:

```bash
cd wristo-api
mvn -Dtest=PurchaseRecordMapperCountryStatsSqlTest,CountryOrderStatsServiceImplTest,PurchasesAdminControllerCountryStatsTest test
```

Expected: all focused tests pass.

### Task 4: Add the typed Dashboard API boundary

**Files:**
- Modify: `wristo-dashboard/src/types/sales.ts`
- Modify: `wristo-dashboard/src/types/api.ts`
- Modify: `wristo-dashboard/src/api/purchase.ts`

- [ ] **Step 1: Add the TypeScript contract**

```ts
export interface CountryOrderStatsQueryDTO {
  startDate?: string
  endDate?: string
  topN?: 5 | 10 | 20
}

export interface CountryOrderStatsItemVO {
  countryCode: string
  orderCount: number
  percentage: number
}

export interface CountryOrderDistributionVO {
  startDate: string
  endDate: string
  topN: 5 | 10 | 20
  totalOrders: number
  otherOrderCount: number
  items: CountryOrderStatsItemVO[]
}
```

Export these types from `src/types/api.ts`.

- [ ] **Step 2: Add the API function**

```ts
export const getCountryOrderDistribution = async (
  dto: CountryOrderStatsQueryDTO
): Promise<ApiResponse<CountryOrderDistributionVO>> => {
  return instance.post('/admin/purchases/country/summary', dto)
}
```

- [ ] **Step 3: Run a type/build checkpoint**

Run:

```bash
cd wristo-dashboard
npm run build
```

Expected: build succeeds before the component is introduced.

### Task 5: Build the country distribution component

**Files:**
- Create: `wristo-dashboard/src/components/dashboard/CountryOrderDistribution.vue`

- [ ] **Step 1: Build the filter and request state**

Follow `DeviceOrderSummary.vue` conventions:

- default range is `[today.minusMonths(1), today]`;
- `el-date-picker` disables future dates;
- date changes reset and reload;
- ranges earlier than `endDate.minusMonths(1)` are clamped and show `ElMessage.warning('国家订单统计最多支持选择一个月的时间范围')`;
- Top N is an `el-select` with numeric values 5, 10, and 20 and reloads on change;
- errors are local to this component.

- [ ] **Step 2: Add country display-name formatting**

Create one cached formatter:

```ts
const regionNames = typeof Intl.DisplayNames === 'function'
  ? new Intl.DisplayNames(['zh-CN'], { type: 'region' })
  : null

const countryName = (code: string): string => {
  if (code === 'Unknown') return '未知'
  try {
    return regionNames?.of(code) || code
  } catch {
    return code
  }
}
```

Render names as `美国（US）`; render `Unknown` as `未知`.

- [ ] **Step 3: Add donut chart and table**

The chart data contains all API items plus:

```ts
if (distribution.otherOrderCount > 0) {
  chartData.push({ name: '其他', value: distribution.otherOrderCount })
}
```

The table contains only `distribution.items` and columns for country, order count, and percentage. Use the same chart colors, card/table density, resize handling, and cleanup pattern as `DeviceOrderSummary.vue`.

- [ ] **Step 4: Add empty and error behavior**

Show total orders as zero for empty results, allow the ECharts series to receive an empty array, and display:

```html
<div v-if="error" class="error-message">
  <p>获取国家订单分布失败：{{ error }}</p>
</div>
```

- [ ] **Step 5: Run the Dashboard build**

Run:

```bash
cd wristo-dashboard
npm run build
```

Expected: `vue-tsc` and Vite production build succeed.

### Task 6: Mount the component and verify the complete change

**Files:**
- Modify: `wristo-dashboard/src/views/dashboard/Dashboard.vue`

- [ ] **Step 1: Mount in the requested position**

Import `CountryOrderDistribution` and render:

```vue
<!-- 国家订单分布 -->
<CountryOrderDistribution />
```

after `<DeviceOrderSummary />` and before `<AppSalesSummary />`.

- [ ] **Step 2: Run focused backend tests**

Run:

```bash
cd wristo-api
mvn -Dtest=PurchaseRecordMapperCountryStatsSqlTest,CountryOrderStatsServiceImplTest,PurchasesAdminControllerCountryStatsTest test
```

Expected: all focused tests pass.

- [ ] **Step 3: Run Dashboard unit tests and production build**

Run:

```bash
cd wristo-dashboard
npm run test:unit
npm run build
```

Expected: unit tests and production build pass.

- [ ] **Step 4: Inspect the final diff without touching unrelated changes**

Run:

```bash
git -C wristo-api diff --check
git -C wristo-dashboard diff --check
git -C wristo-api status --short
git -C wristo-dashboard status --short
```

Confirm that pre-existing API edits remain intact and that the new diff is limited to the country-statistics path plus the approved design/plan documents.

- [ ] **Step 5: Optional runtime verification**

If the API and Dashboard can be started without disrupting existing local processes, open `/dashboard` and verify:

- default one-month range;
- Top 5 / 10 / 20 reload;
- a range longer than one month is clamped;
- country names and codes;
- “其他” appears only in the donut;
- empty and error states;
- stacked layout at narrow viewport width.
