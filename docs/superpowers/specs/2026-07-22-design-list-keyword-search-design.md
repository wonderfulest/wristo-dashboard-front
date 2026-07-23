# 设计列表统一关键词搜索设计

## 目标

Dashboard 的“设计列表”只保留一个关键词输入框，同时搜索设计名、AppId 和 Design UID。

## 交互与匹配规则

- 输入框占位文案为“搜索设计名 / AppId / Design UID”。
- 设计名使用包含匹配；AppId 和 Design UID 使用精确匹配。
- 三种匹配使用 OR 关系；设计师、是否模板等其他筛选条件继续使用 AND 关系。
- 空关键词不传查询参数；回车和“搜索”按钮均提交，并重置到第一页。
- 本次不调整表格、详情弹窗、排序和设计审核页面。

## 数据流

1. `DesignAdmin.vue` 维护单一 `searchKeyword` 状态并通过 `keyword` 请求分页接口。
2. `DesignAdminController` 接收并去除关键词首尾空格，写入 `DesignPageQueryDTO.keyword`。
3. `DesignMapper.xml` 在同一括号组中匹配 `design.name`、`design.design_uid`，并通过关联产品匹配 `products.app_id`。
4. 非数字关键词不参与 AppId 数值比较，避免数据库类型转换带来的误匹配。

## 验证

- Mapper SQL 测试覆盖文本关键词和数字关键词的 OR 条件。
- Service 测试确认统一关键词直接使用数据库分页，不进入旧的名称搜索分支。
- 运行 Dashboard 构建与后端聚焦测试。
