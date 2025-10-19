# Wristo 邮件模板管理系统（混合模式简化版）PRD


🎯 一、项目背景

当前 Wristo 邮件模板均为静态文件 (resources/templates/*.html)，修改需通过 Git 提交 + 重启部署，流程冗长。
运营人员无法快速调整邮件内容，如：

营销活动、节日祝福邮件；

支付成功、注册、重置密码类系统通知；

产品更新通知或订阅提醒。

因此需构建一个 “可运营化的模板管理系统”，支持：

在线可编辑；

数据库存储；

动态加载；

测试发送；

同步更新 HTML 模板文件。

🧠 二、设计原则
目标	说明
⚡ 快速配置	运营可直接修改模板，无需开发参与
🧩 混合模式	模板内容存储于数据库，同时保留文件备份
🔄 热加载	更新后立即生效，无需重启
🧪 测试验证	支持模板变量预览与测试邮件发送
🔒 安全审计	限定编辑权限 + 操作日志

❌ 不再支持历史版本回滚，仅记录最后一次更新时间与编辑人。

🏗 三、系统架构概述
┌───────────────────────────────┐
│         Wristo Admin 后台       │
│  ├─ 模板列表（搜索+筛选）       │
│  ├─ 模板预览（HTML 渲染）       │
│  ├─ 在线编辑（富文本编辑器）     │
│  ├─ 测试发送（运营验证）         │
└──────────────┬────────────────┘
               │
               ▼
┌───────────────────────────────┐
│        Wristo API 服务         │
│  ├─ TemplateController         │
│  ├─ TemplateService            │
│  └─ HybridTemplateLoader       │
└──────────────┬────────────────┘
               │
               ▼
┌───────────────────────────────┐
│     email_template 表 (DB)     │
│     resources/templates/*.html │
└───────────────────────────────┘

🗃 四、数据库表结构

沿用现有 email_template 表，略微扩展两个字段：

ALTER TABLE email_template 
ADD COLUMN content_html MEDIUMTEXT NULL COMMENT '模板HTML内容',
ADD COLUMN last_editor VARCHAR(100) NULL COMMENT '最后编辑人';


文件仍保存在 src/main/resources/templates/，数据库保存其在线编辑版本。

⚙️ 五、模板加载机制（Hybrid 模式）

加载优先级如下：

1️⃣ 若数据库中存在 content_html 且 is_active=1 → 使用数据库内容
2️⃣ 否则 → 读取 resources/templates/${template_file_name} 文件
3️⃣ 模板引擎使用 StringTemplateResolver 动态渲染 HTML 内容

示例代码：

public String loadTemplate(String name) {
    EmailTemplate tpl = templateRepo.findByFileName(name);
    if (tpl != null && tpl.isActive() && tpl.getContentHtml() != null) {
        return tpl.getContentHtml();
    } else {
        return Files.readString(Paths.get("src/main/resources/templates/" + name));
    }
}

🧩 六、主要功能模块
1️⃣ 模板列表页

功能：查看所有模板基础信息

字段：

字段	含义
模板名称	name
文件名	template_file_name
邮件主题	subject
是否激活	is_active
更新时间	updated_at
编辑人	last_editor

操作：

预览模板

编辑模板

测试发送

2️⃣ 模板预览页

功能：

渲染 content_html 内容；

支持替换变量展示（如 ${userName} → “测试用户”）。

实现方式：
通过 th:utext="${content}" 渲染 HTML 预览。

3️⃣ 模板编辑页

功能：

在线编辑模板 HTML；

可查看模板变量（如 ${orderId}, ${userName}）；

保存后立即生效。

实现流程：

点击保存 →
更新数据库 content_html →
写入文件系统 →
刷新缓存（HybridTemplateLoader） →
运营后台提示“模板更新成功”


Service 逻辑示例：

@Transactional
public void updateTemplate(Integer id, String html, String editor) {
    EmailTemplate tpl = repo.findById(id).orElseThrow();
    tpl.setContentHtml(html);
    tpl.setLastEditor(editor);
    tpl.setUpdatedAt(LocalDateTime.now());
    repo.save(tpl);

    Path path = Paths.get("src/main/resources/templates/", tpl.getTemplateFileName());
    Files.writeString(path, html, StandardCharsets.UTF_8);
}

4️⃣ 测试发送

功能：

输入目标邮箱；

渲染模板并发送邮件；

用于验证模板内容及变量正确性。

示例接口：

@PostMapping("/admin/email-templates/{id}/test-send")
public ResponseEntity<?> testSend(@PathVariable Integer id, @RequestParam String toEmail) {
    emailTemplateService.testSend(id, toEmail);
    return ResponseEntity.ok("测试邮件已发送");
}


发送逻辑：

渲染模板；

替换部分变量为默认值；

调用 JavaMailSender 或 AWS SES；

记录日志。

🧾 七、接口定义（后端 API）
接口	方法	描述
/admin/email-templates	GET	查询模板列表
/admin/email-templates/{id}	GET	查看模板详情
/admin/email-templates/{id}/preview	GET	预览模板HTML
/admin/email-templates/{id}/update	POST	保存编辑内容
/admin/email-templates/{id}/test-send	POST	测试发送邮件
🔒 八、权限与安全控制
操作	角色权限	说明
查看模板	ROLE_OPERATOR	仅可读
编辑模板	ROLE_ADMIN	可修改HTML内容
激活/停用模板	ROLE_ADMIN	控制生效状态
测试发送	ROLE_OPERATOR+	允许发送邮件验证

安全措施：

所有修改操作需记录 last_editor 与 updated_at；

编辑器内容保存前进行 XSS 过滤；

每次保存前进行变量占位符检测，防止破坏模板结构。

🧩 九、模板引擎配置（Spring Boot）

配置双模板解析器：

@Bean
public TemplateEngine templateEngine() {
    TemplateEngine engine = new TemplateEngine();

    // 1. 数据库模板解析器
    StringTemplateResolver dbResolver = new StringTemplateResolver();
    dbResolver.setTemplateMode(TemplateMode.HTML);
    dbResolver.setCacheable(false);
    dbResolver.setOrder(1);

    // 2. 文件模板解析器
    ClassLoaderTemplateResolver fileResolver = new ClassLoaderTemplateResolver();
    fileResolver.setPrefix("templates/");
    fileResolver.setSuffix(".html");
    fileResolver.setTemplateMode(TemplateMode.HTML);
    fileResolver.setOrder(2);

    engine.setTemplateResolvers(Set.of(dbResolver, fileResolver));
    return engine;
}

🧱 十、项目阶段规划
阶段	功能范围	预计完成时间
V1.0	模板管理后台列表 + 预览	2025-10
V1.1	在线编辑 + 文件同步 + 测试发送	2025-11
V1.2	模板变量校验 + 多语言支持	2025-12
📈 十一、项目价值
维度	提升
运营效率	模板调整时间从 1 天 ↓ 至 10 分钟
技术维护	无需重新部署即可热更新模板
出错率	降低 80%，可即时预览验证
团队协作	运营、开发、设计可协同维护