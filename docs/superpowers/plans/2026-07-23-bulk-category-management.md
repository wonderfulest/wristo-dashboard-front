# 应用批量分类管理 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 Dashboard 应用管理页提供作用于所有应用的一键分类维护：`whole` 只批量加入，其他分类只批量清空。

**Architecture:** Dashboard 只提交所选分类 ID，后端读取分类 `slug` 决定唯一合法动作，避免前端伪造操作类型。批量关系更新集中在 `ProductService` 的事务方法中，通过 MyBatis 集合 SQL 恢复/插入 `whole` 关系或软删除普通分类关系，并返回实际影响数量。

**Tech Stack:** Vue 3、TypeScript、Element Plus、Axios、Spring Boot、Java、MyBatis、JUnit 5、Mockito、Node test runner

---

## 文件结构

- `wristo-api/src/main/java/com/wukong/face/modules/products/mapper/CategoryProductRelMapper.java`：声明三种批量关系写入。
- `wristo-api/src/main/resources/mapper/CategoryProductRelMapper.xml`：实现恢复历史关系、补充缺失关系和清空普通分类的集合 SQL。
- `wristo-api/src/main/java/com/wukong/face/modules/products/service/ProductService.java`：暴露事务化批量分类方法。
- `wristo-api/src/main/java/com/wukong/face/modules/products/service/impl/ProductServiceImpl.java`：根据分类 slug 强制 `whole` 加入、普通分类清空规则。
- `wristo-api/src/main/java/com/wukong/face/modules/products/orchestrator/ProductOrchestrator.java`：暴露管理员编排入口。
- `wristo-api/src/main/java/com/wukong/face/modules/products/orchestrator/impl/ProductOrchestratorImpl.java`：校验管理员身份和分类存在性，再调用服务。
- `wristo-api/src/main/java/com/wukong/face/modules/products/controller/adm/ProductAdminController.java`：新增 Dashboard 调用端点。
- `wristo-api/src/test/java/com/wukong/face/modules/products/service/impl/ProductServiceImplBulkCategoryTest.java`：覆盖 slug 分支、幂等影响数量和事务服务调用。
- `wristo-dashboard/src/api/products.ts`：封装批量分类 API。
- `wristo-dashboard/src/views/products/Products.vue`：增加入口、弹窗、确认提示、加载态和结果反馈。
- `wristo-dashboard/tests/bulk-category-management.test.mjs`：锁定前端请求路径和 `whole`/普通分类交互约束。

### Task 1: 批量分类关系 Mapper

**Files:**
- Modify: `wristo-api/src/main/java/com/wukong/face/modules/products/mapper/CategoryProductRelMapper.java`
- Modify: `wristo-api/src/main/resources/mapper/CategoryProductRelMapper.xml`
- Test: `wristo-api/src/test/java/com/wukong/face/modules/products/mapper/CategoryProductRelMapperXmlTest.java`

- [ ] **Step 1: 写 Mapper XML 失败测试**

创建 `CategoryProductRelMapperXmlTest.java`，读取 XML 并断言三个 statement 及关键集合 SQL 存在：

```java
package com.wukong.face.modules.products.mapper;

import org.junit.jupiter.api.Test;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertTrue;

class CategoryProductRelMapperXmlTest {
    @Test
    void containsBulkCategoryMaintenanceStatements() throws Exception {
        String xml = Files.readString(Path.of("src/main/resources/mapper/CategoryProductRelMapper.xml"));
        assertTrue(xml.contains("id=\"reactivateCategoryForAllProducts\""));
        assertTrue(xml.contains("id=\"insertCategoryForMissingProducts\""));
        assertTrue(xml.contains("id=\"clearCategoryFromAllProducts\""));
        assertTrue(xml.contains("INSERT INTO category_product_rel"));
        assertTrue(xml.contains("NOT EXISTS"));
    }
}
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `cd wristo-api && mvn -Dtest=CategoryProductRelMapperXmlTest test`

Expected: FAIL，因为 XML 尚无三个批量 statement。

- [ ] **Step 3: 声明并实现批量 SQL**

在 Mapper 接口增加：

```java
int reactivateCategoryForAllProducts(@Param("categoryId") Long categoryId);
int insertCategoryForMissingProducts(@Param("categoryId") Long categoryId,
                                     @Param("categoryWeight") Integer categoryWeight);
int clearCategoryFromAllProducts(@Param("categoryId") Long categoryId);
```

在 XML 增加：

```xml
<update id="reactivateCategoryForAllProducts">
    UPDATE category_product_rel
    SET is_deleted = 0, is_active = 1, updated_at = NOW(), version = version + 1
    WHERE category_id = #{categoryId}
      AND (is_deleted != 0 OR is_active != 1)
</update>

<insert id="insertCategoryForMissingProducts">
    INSERT INTO category_product_rel
        (category_id, product_id, is_deleted, created_at, updated_at, version, is_active, category_weight)
    SELECT #{categoryId}, p.id, 0, NOW(), NOW(), 0, 1, #{categoryWeight}
    FROM products p
    WHERE p.is_deleted = 0
      AND NOT EXISTS (
          SELECT 1 FROM category_product_rel rel
          WHERE rel.product_id = p.id AND rel.category_id = #{categoryId}
      )
</insert>

<update id="clearCategoryFromAllProducts">
    UPDATE category_product_rel
    SET is_deleted = 1, is_active = 0, updated_at = NOW(), version = version + 1
    WHERE category_id = #{categoryId} AND is_deleted = 0 AND is_active = 1
</update>
```

- [ ] **Step 4: 运行 Mapper 测试**

Run: `cd wristo-api && mvn -Dtest=CategoryProductRelMapperXmlTest test`

Expected: PASS。

- [ ] **Step 5: 提交 Mapper 改动**

```bash
git -C wristo-api add src/main/java/com/wukong/face/modules/products/mapper/CategoryProductRelMapper.java src/main/resources/mapper/CategoryProductRelMapper.xml src/test/java/com/wukong/face/modules/products/mapper/CategoryProductRelMapperXmlTest.java
git -C wristo-api commit -m "支持批量维护应用分类关系"
```

### Task 2: 后端业务规则与管理员接口

**Files:**
- Modify: `wristo-api/src/main/java/com/wukong/face/modules/products/service/ProductService.java`
- Modify: `wristo-api/src/main/java/com/wukong/face/modules/products/service/impl/ProductServiceImpl.java`
- Modify: `wristo-api/src/main/java/com/wukong/face/modules/products/orchestrator/ProductOrchestrator.java`
- Modify: `wristo-api/src/main/java/com/wukong/face/modules/products/orchestrator/impl/ProductOrchestratorImpl.java`
- Modify: `wristo-api/src/main/java/com/wukong/face/modules/products/controller/adm/ProductAdminController.java`
- Test: `wristo-api/src/test/java/com/wukong/face/modules/products/service/impl/ProductServiceImplBulkCategoryTest.java`

- [ ] **Step 1: 写服务层失败测试**

新增测试，注入 mock Mapper，覆盖两个 slug 分支：

```java
package com.wukong.face.modules.products.service.impl;

import com.wukong.face.modules.products.mapper.CategoryProductRelMapper;
import com.wukong.face.modules.website.entity.Category;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

class ProductServiceImplBulkCategoryTest {
    private CategoryProductRelMapper relMapper;
    private ProductServiceImpl service;

    @BeforeEach
    void setUp() {
        relMapper = mock(CategoryProductRelMapper.class);
        service = new ProductServiceImpl();
        ReflectionTestUtils.setField(service, "categoryProductRelMapper", relMapper);
    }

    @Test
    void wholeReactivatesAndAddsMissingRelations() {
        Category whole = new Category();
        whole.setId(1L);
        whole.setSlug("whole");
        when(relMapper.reactivateCategoryForAllProducts(1L)).thenReturn(2);
        when(relMapper.insertCategoryForMissingProducts(1L, 20)).thenReturn(3);

        assertEquals(5, service.manageCategoryForAllProducts(whole));
        verify(relMapper, never()).clearCategoryFromAllProducts(anyLong());
    }

    @Test
    void nonWholeOnlyClearsSelectedCategory() {
        Category sport = new Category();
        sport.setId(2L);
        sport.setSlug("sport");
        when(relMapper.clearCategoryFromAllProducts(2L)).thenReturn(4);

        assertEquals(4, service.manageCategoryForAllProducts(sport));
        verify(relMapper, never()).reactivateCategoryForAllProducts(anyLong());
        verify(relMapper, never()).insertCategoryForMissingProducts(anyLong(), anyInt());
    }
}
```

- [ ] **Step 2: 运行测试并确认编译失败**

Run: `cd wristo-api && mvn -Dtest=ProductServiceImplBulkCategoryTest test`

Expected: FAIL，`manageCategoryForAllProducts` 尚不存在。

- [ ] **Step 3: 实现事务化服务方法**

在 `ProductService` 声明 `int manageCategoryForAllProducts(Category category);`，在实现类增加：

```java
@Override
@Transactional
public int manageCategoryForAllProducts(Category category) {
    if (category == null || category.getId() == null) {
        throw new BizException(BizErrorCode.INVALID_PARAMS.getCode(), "Category not found");
    }
    if ("whole".equalsIgnoreCase(StringUtils.trimToEmpty(category.getSlug()))) {
        int restored = categoryProductRelMapper.reactivateCategoryForAllProducts(category.getId());
        int inserted = categoryProductRelMapper.insertCategoryForMissingProducts(
                category.getId(), ProductConstants.DEFAULT_DISPLAY_WEIGHT);
        return restored + inserted;
    }
    return categoryProductRelMapper.clearCategoryFromAllProducts(category.getId());
}
```

- [ ] **Step 4: 增加管理员编排和 Controller 端点**

在 `ProductOrchestrator` 声明：

```java
int manageCategoryForAllProducts(Long categoryId);
```

在 `ProductOrchestratorImpl` 实现显式管理员校验和分类查询：

```java
@Override
public int manageCategoryForAllProducts(Long categoryId) {
    LoginUser currentUser = getCurrentUser();
    validateUserPermission(currentUser);
    boolean isAdmin = currentUser.getRoles().stream()
            .anyMatch(role -> "ROLE_ADMIN".equals(role.getRoleCode()));
    if (!isAdmin) {
        throw new BizException(BizErrorCode.ACCESS_DENIED.getCode(), "Admin permission required");
    }
    Category category = categoryMapper.selectById(categoryId);
    if (category == null) {
        throw new BizException(BizErrorCode.INVALID_PARAMS.getCode(), "Category not found");
    }
    return productService.manageCategoryForAllProducts(category);
}
```

在 `ProductAdminController` 增加：

```java
@PostMapping("/category/all/{categoryId}")
public Result<Integer> manageCategoryForAllProducts(@PathVariable Long categoryId) {
    return Result.success(productOrchestrator.manageCategoryForAllProducts(categoryId));
}
```

- [ ] **Step 5: 运行后端定向测试**

Run: `cd wristo-api && mvn -Dtest=CategoryProductRelMapperXmlTest,ProductServiceImplBulkCategoryTest test`

Expected: PASS，两个测试类全部通过。

- [ ] **Step 6: 提交后端业务改动**

```bash
git -C wristo-api add src/main/java/com/wukong/face/modules/products/service/ProductService.java src/main/java/com/wukong/face/modules/products/service/impl/ProductServiceImpl.java src/main/java/com/wukong/face/modules/products/orchestrator/ProductOrchestrator.java src/main/java/com/wukong/face/modules/products/orchestrator/impl/ProductOrchestratorImpl.java src/main/java/com/wukong/face/modules/products/controller/adm/ProductAdminController.java src/test/java/com/wukong/face/modules/products/service/impl/ProductServiceImplBulkCategoryTest.java
git -C wristo-api commit -m "增加应用批量分类管理接口"
```

### Task 3: Dashboard API 与交互契约

**Files:**
- Modify: `wristo-dashboard/src/api/products.ts`
- Modify: `wristo-dashboard/src/views/products/Products.vue`
- Test: `wristo-dashboard/tests/bulk-category-management.test.mjs`

- [ ] **Step 1: 写前端失败测试**

创建源码契约测试：

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('bulk category API targets all products with one category id', async () => {
  const source = await readFile(new URL('../src/api/products.ts', import.meta.url), 'utf8')
  assert.match(source, /manageCategoryForAllProducts/)
  assert.match(source, /\/admin\/products\/category\/all\/\$\{categoryId\}/)
})

test('products page derives the only allowed action from whole slug', async () => {
  const source = await readFile(new URL('../src/views/products/Products.vue', import.meta.url), 'utf8')
  assert.match(source, /一键管理分类/)
  assert.match(source, /bulkCategorySelection/)
  assert.match(source, /selectedBulkCategory.*slug.*whole/s)
  assert.match(source, /加入所有应用/)
  assert.match(source, /清空该分类/)
  assert.match(source, /所有应用/)
  assert.match(source, /manageCategoryForAllProducts/)
})
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `cd wristo-dashboard && npm run test:unit -- --test-name-pattern="bulk category|only allowed action"`

Expected: FAIL，API 函数和页面交互尚不存在。

- [ ] **Step 3: 增加 Dashboard API 函数**

在 `src/api/products.ts` 增加：

```ts
export const manageCategoryForAllProducts = (categoryId: number): Promise<ApiResponse<number>> => {
  return instance.post(`/admin/products/category/all/${categoryId}`)
}
```

- [ ] **Step 4: 增加入口、弹窗状态和派生文案**

在筛选栏增加按钮：

```vue
<el-button type="warning" plain @click="bulkCategoryDialogVisible = true">
  一键管理分类
</el-button>
```

在脚本中导入 `computed` 和 API，并增加：

```ts
const bulkCategoryDialogVisible = ref(false)
const bulkCategorySelection = ref<number | undefined>()
const bulkCategorySubmitting = ref(false)
const selectedBulkCategory = computed(() =>
  allCategories.value.find(category => category.id === bulkCategorySelection.value)
)
const isWholeBulkCategory = computed(() => selectedBulkCategory.value?.slug === 'whole')
const bulkCategoryActionLabel = computed(() =>
  isWholeBulkCategory.value ? '加入所有应用' : '清空该分类'
)
```

弹窗使用单选分类和清晰说明：

```vue
<el-dialog v-model="bulkCategoryDialogVisible" title="一键管理分类" width="520px">
  <el-alert title="此操作作用于所有应用，与当前筛选和分页无关。" type="warning" :closable="false" />
  <el-select v-model="bulkCategorySelection" filterable placeholder="请选择分类" style="width: 100%; margin-top: 16px;">
    <el-option v-for="cat in allCategories" :key="cat.id" :label="`${cat.name} (${cat.slug})`" :value="cat.id" />
  </el-select>
  <p v-if="selectedBulkCategory" class="bulk-category-hint">
    {{ isWholeBulkCategory ? '将 whole 分类加入所有尚未关联的应用。' : `将 ${selectedBulkCategory.name} 分类从所有应用中清空，其他分类不受影响。` }}
  </p>
  <template #footer>
    <el-button @click="bulkCategoryDialogVisible = false">取消</el-button>
    <el-button type="danger" :disabled="!selectedBulkCategory" :loading="bulkCategorySubmitting" @click="handleBulkCategoryManagement">
      {{ bulkCategoryActionLabel }}
    </el-button>
  </template>
</el-dialog>
```

- [ ] **Step 5: 实现二次确认、结果反馈和列表刷新**

```ts
const handleBulkCategoryManagement = async () => {
  const category = selectedBulkCategory.value
  if (!category) return
  const description = category.slug === 'whole'
    ? '确认将 whole 分类加入所有应用吗？'
    : `确认从所有应用中清空“${category.name}”分类吗？其他分类不会改变。`
  await ElMessageBox.confirm(description, '确认一键管理分类', {
    type: 'warning',
    confirmButtonText: bulkCategoryActionLabel.value,
    cancelButtonText: '取消',
  })
  try {
    bulkCategorySubmitting.value = true
    const response = await manageCategoryForAllProducts(category.id)
    if (response.code !== 0) {
      ElMessage.error(response.msg || '分类批量操作失败')
      return
    }
    ElMessage.success(`${bulkCategoryActionLabel.value}完成，影响 ${response.data ?? 0} 个应用`)
    bulkCategoryDialogVisible.value = false
    bulkCategorySelection.value = undefined
    await fetchProducts()
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') ElMessage.error('分类批量操作失败')
  } finally {
    bulkCategorySubmitting.value = false
  }
}
```

注意将确认框放入 `try` 或单独捕获取消，保证取消确认不会产生未处理 Promise；最终实现应保持取消时无错误消息。

- [ ] **Step 6: 运行前端测试和构建**

Run: `cd wristo-dashboard && npm run test:unit -- --test-name-pattern="bulk category|only allowed action"`

Expected: PASS。

Run: `cd wristo-dashboard && npm run build`

Expected: `vue-tsc` 与 Vite 构建成功。

- [ ] **Step 7: 提交 Dashboard 改动**

```bash
git -C wristo-dashboard add src/api/products.ts src/views/products/Products.vue tests/bulk-category-management.test.mjs
git -C wristo-dashboard commit -m "增加应用一键分类管理"
```

### Task 4: 跨模块最终验证

**Files:**
- Verify: `wristo-api`
- Verify: `wristo-dashboard`

- [ ] **Step 1: 运行后端定向测试**

Run: `cd wristo-api && mvn -Dtest=CategoryProductRelMapperXmlTest,ProductServiceImplBulkCategoryTest test`

Expected: BUILD SUCCESS。

- [ ] **Step 2: 运行 Dashboard 单元测试**

Run: `cd wristo-dashboard && npm run test:unit`

Expected: 全部 Node 测试通过；如出现与本功能无关的已有失败，记录具体测试名并保留定向测试结果。

- [ ] **Step 3: 运行 Dashboard 构建**

Run: `cd wristo-dashboard && npm run build`

Expected: 构建成功且无 TypeScript 错误。

- [ ] **Step 4: 检查差异质量**

Run: `git -C wristo-api diff --check && git -C wristo-dashboard diff --check`

Expected: 无输出，退出码为 0。

- [ ] **Step 5: 手工验证行为**

启动 API 与 Dashboard 后进入应用管理页，分别验证：选择 `whole` 时按钮为“加入所有应用”；选择任意普通分类时按钮为“清空该分类”；取消二次确认不发请求；成功提示展示影响数量；当前列表刷新且现有单应用分类编辑仍可使用。
