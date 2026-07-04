# Triage Labels

以下标签供 `to-prd`、`to-issues`、`triage` 等技能在创建和分类 Issue 时使用。

## 状态标签

- **`ready-for-agent`** — PRD 已完成、可供 Agent 开始实现的 Issue
- **`in-progress`** — 正在开发中
- **`blocked`** — 被外部依赖阻塞
- **`needs-review`** — 等待人工或 QA 审核

## 类型标签

- **`feature`** — 新功能
- **`bug`** — 缺陷修复
- **`tech-debt`** — 技术债/重构
- **`docs`** — 文档相关
- **`chore`** — 基础设施/配置

## 优先级标签

- **`p0-critical`** — 阻断性，立即处理
- **`p1-high`** — 高优，当前迭代必须完成
- **`p2-medium`** — 中优，正常排期
- **`p3-low`** — 低优，有空再说

## 模块标签（对齐 CONTEXT.md 领域划分）

- **`module:org`** — 组织架构与人员管理
- **`module:permission`** — 权限系统
- **`module:schedule`** — 智能排班
- **`module:attendance`** — 考勤工时
- **`module:leave`** — 假期管理
- **`module:payroll`** — 薪资核算（含二级密码）
- **`module:reimbursement`** — 报销管理
- **`module:training`** — 培训与知识库
- **`module:workflow`** — 审批流引擎
- **`module:message`** — 消息与公告中心
- **`module:excel`** — Excel 导入导出体系
- **`module:infra`** — 基础设施/架构

## 使用方式

创建 Issue 时至少打一个类型标签 + 一个优先级标签。实现阶段加 `ready-for-agent`，开发中改为 `in-progress`。
