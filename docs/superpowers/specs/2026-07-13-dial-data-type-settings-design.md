# Dial 数据项后台配置与 Connect IQ Settings 设计

## 背景

SubDial 只支持 `Goal` 和 `Range` 两种 Progress Mode。Studio 中的全局 Dial Property 只能绑定相同模式的数据项，Range 的边界必须由后台数据类型配置提供。API 已在 `data_type_options` 中提供 `dialMode`、`dialMin`、`dialMax` 和 `dialGoalSource` 字段，但 Dashboard 尚不能维护这些字段，生成的 Connect IQ Settings 也需要确保只展示与 Dial Property 模式相同的候选项。

## 范围

本次包含：

- Dashboard `/data-type-options` 的 Dial 能力编辑、列表展示、前端校验和 DTO 映射。
- Connect IQ Settings 为每个全局 Dial Property 生成用户可选列表。
- 生成阶段校验 Dial Property 模式、候选数据项和 Range 边界。
- 对上述行为补充不依赖浏览器或 Mockito 的纯单元测试。

本次不包含：

- 新增第三种 Progress Mode。
- 允许用户在 Connect IQ Settings 中修改 Range 的 min/max。
- 单独建立 Dial 配置表或独立管理页面。
- 根据数据项类别自动推断 Dial 模式。

## Dashboard 交互

数据项新增或编辑弹窗增加 `Dial Mode` 下拉框：

- `Not Supported`：对应 `dialMode = null`。
- `Goal`：对应 `dialMode = goal`。
- `Range`：对应 `dialMode = range`。

字段联动：

- Goal 模式显示 `Goal Source`，默认使用 `DATA_GOAL`，并清空 `dialMin`、`dialMax`。
- Range 模式显示 `Min`、`Max`，并清空 `dialGoalSource`。
- Not Supported 清空 `dialGoalSource`、`dialMin`、`dialMax`。
- Range 保存前必须满足 min、max 均为有限数字且 `max > min`。
- Goal 保存前必须提供非空的 Goal Source。

列表增加 `Dial` 列：

- Goal 显示 `Goal · <goal source>`。
- Range 显示 `Range · <min>–<max>`。
- 不支持时显示 `—`。

Dashboard 的 `DataTypeOptionVO`、Create DTO 和 Update DTO 必须包含全部 Dial 字段，新增、编辑和局部更新不能丢失字段。

## Connect IQ Settings

每个全局 Dial Property 继续生成一个数字型 Connect IQ Property 和一个 list setting。候选项来自设计文件中该 Dial Property 已保存的 options，并在生成阶段执行严格校验：

- Goal Dial Property 只允许 `dialMode = goal` 的启用数据项。
- Range Dial Property 只允许 `dialMode = range` 的启用数据项。
- Range 候选项必须具备合法且有限的 `dialMin`、`dialMax`，并满足 `dialMax > dialMin`。
- Goal 候选项必须具备可用的 `dialGoalSource`；当前运行时支持 `DATA_GOAL`。
- Dial Property 的默认值必须指向过滤后仍存在的候选项。
- 没有有效候选项或默认值无效时，生成阶段报告包含 Dial Property key 的明确错误，不输出不可用 App。

Settings 只允许用户选择数据项，不显示或修改模式、Goal Source、Range Min/Max。模式属于 Dial Property，边界与目标来源属于后台数据项能力。

## 运行时数据流

1. 管理员在 Dashboard 配置数据项 Dial 能力。
2. Studio 从 API 获取数据类型，只将相同模式的数据项提供给 Dial Property。
3. 设计导出保存 Dial Property 模式、默认值和候选项元数据。
4. Connect IQ 生成器校验并输出 Property、Settings 列表及 SubDial 所需元数据。
5. 最终用户在 Garmin Connect IQ Settings 中切换同模式数据项。
6. Goal 运行时使用所选数据项的逻辑值和 `DATA_GOAL`；Range 运行时必须使用所选数据项对应的后台边界。

由于最终用户可在同一个 Range Dial Property 中切换不同 Range 数据项，生成代码不能只固化默认数据项的边界。生成器必须按候选项 value 输出 Range 边界映射，运行时根据当前 Property 值选择对应 min/max。Goal Source 同理按候选项校验；当前仅允许 `DATA_GOAL`。

## 错误处理

- Dashboard 在提交前显示字段级校验错误。
- API 继续作为最终校验边界，拒绝模式与字段组合不一致的数据。
- 生成器拒绝模式不匹配、缺少边界、非法默认值和空候选集合。
- 旧设计缺少 Dial Property 或候选元数据时，继续标记为需要迁移，不自动推断模式。

## 测试

Dashboard：

- Dial DTO 类型与 payload 包含新增字段。
- 模式切换正确清理互斥字段。
- Range 数值校验和 Goal Source 校验。
- 列表摘要格式。
- `npm run build`。

Connect IQ 生成链：

- Goal/Range 候选项按模式过滤和校验。
- Range 多候选项生成 value 到 min/max 的映射。
- Settings XML 只包含合法的同模式候选项。
- 当前用户选择改变时使用对应候选项边界。
- 相关 Python/Jinja 纯单元测试。

## 验收标准

- Dashboard 能完整创建和编辑 Dial 能力配置。
- Studio 与生成器无需硬编码新增数据类型。
- Connect IQ App 用户只能在同模式候选项之间切换。
- Range 切换数据项后使用该数据项自己的后台 min/max。
- 不存在 Auto、Custom 或由 Settings 用户编辑边界的路径。
