# Data Type Unit i18n Design

## Goal

Dashboard 数据项页面的 Unit 与 Label 一样支持多语言维护，同时保留现有 `unit` 字段作为默认值和兼容回退。

## Scope

- `wristo-api` 为 `data_type_options` 增加 `unit_i18n` JSON 字段，并贯通 Entity、DTO、VO、Converter 和 Mapper。
- `wristo-dashboard` 增加 `unitI18n` 类型、表单字段、保存映射和列表编辑入口。
- Label 和 Unit 共用一个可配置的 i18n 弹窗组件，但分别读取、保存 `labelI18n` 与 `unitI18n`。
- 支持页面现有的全部语言代码，并保持 `eng`、`zhs` 优先展示。
- 语言选择器支持输入筛选现有语言代码，但不允许创建任意自定义语言代码。

## Data Contract

- `unit: string`：默认单位；保持现有行为，不删除、不改义。
- `unitI18n?: Record<string, string>`：按 Garmin 三字母语言代码保存的单位显示文本，例如 `{"eng":"bpm","zhs":"次/分"}`。
- `unitI18n` 为空时，消费方继续使用 `unit`。本次不自动猜测或批量回填历史翻译。

## Dashboard UX

- 列表保留 Unit 默认值列，并在其旁边新增 `Unit i18n` 列，使用与 Label i18n 相同的摘要标签和弹窗编辑体验。
- 现有 i18n 弹窗组件泛化为可配置字段，保存时只更新目标字段，避免覆盖另一个 i18n 字段。
- Add/Edit 对话框在 Unit 后增加 `EN Unit` 和 `CN Unit` 快捷输入；保存时组装为 `unitI18n.eng` 和 `unitI18n.zhs`。
- 编辑已有记录时优先加载 `unitI18n`；没有翻译时 EN Unit 回退到 `unit`，CN Unit 留空。
- Label 和 Unit 共用的语言下拉框启用输入过滤，因此两处均可按语言代码快速查找。

## Backend Persistence

- 新增 `V56__add_data_type_option_unit_i18n.sql`，只增加可空 JSON 列，不修改当前工作区内未跟踪的 V53-V55 迁移。
- Mapper 的查询、插入和局部更新均包含 `unit_i18n`。
- Converter 使用与 Label 相同的语言键标准化和旧 JSON 值兼容逻辑，将结果暴露为 `Map<String, String>`。

## Error Handling

- 弹窗保存沿用现有 API 错误处理；失败时不发送 updated 事件，也不刷新列表。
- 空翻译允许保存为空对象，不影响 `unit` 默认值。
- 不修改现有 Active、Dial、Icon Rules 等行为。

## Verification

- Dashboard：覆盖类型、Add/Edit payload、Unit 弹窗字段隔离与列表渲染的定向测试，并运行 `npm run build`。
- API：覆盖 Converter 对 `unitI18n` 的解析输出，以及 Mapper/DTO 字段契约的定向测试；运行相关 Maven 测试。
- 验证边界不包括真实数据库迁移执行、浏览器手工操作、生产部署或历史数据回填。
