# API 规格文档 — 人力智能排班薪资一体化中台

> 版本: v1.0 | 基于 2026-07-02 grilling 对齐结论

---

## 1. 约定与规范

### 1.1 基础 URL

```
/api
```

无版本号前缀（单人项目，v1 不加版本）。

### 1.2 URL 命名

RESTful 资源复数 + kebab-case：

```
GET    /api/employees              列表
POST   /api/employees              创建
GET    /api/employees/:id          详情
PUT    /api/employees/:id          全量更新
PATCH  /api/employees/:id          部分更新
DELETE /api/employees/:id          删除
```

子资源：`GET /api/departments/:id/employees`
非 CRUD 动词：`POST /api/employees/:id/resign`、`POST /api/employees/batch-import`

### 1.3 响应信封

所有响应统一封装：

```json
{
  "code": 0,
  "data": { ... },
  "message": "ok"
}
```

列表接口 `data` 结构：

```json
{
  "code": 0,
  "data": {
    "list": [ ... ],
    "total": 100,
    "page": 1,
    "pageSize": 20
  },
  "message": "ok"
}
```

`code === 0` 表示成功，非 0 表示异常。

### 1.4 错误码体系（数字区间分区）

| 区间 | 模块 |
|------|------|
| `10000-19999` | 通用错误（参数校验、系统异常） |
| `20000-29999` | 认证与权限 |
| `30000-39999` | 组织架构与人员管理 |
| `40000-49999` | 智能排班 |
| `50000-59999` | 考勤工时 |
| `60000-69999` | 假期管理 |
| `70000-79999` | 薪资核算 |
| `80000-89999` | 报销管理 |
| `90000-99999` | 培训管理 |
| `100000-109999` | 知识库 |
| `110000-119999` | 审批流引擎 |
| `120000-129999` | 消息与公告 |
| `130000-139999` | Excel 导入导出 |

**通用错误码**：

| code | HTTP | message |
|------|------|---------|
| `10000` | 400 | 参数校验失败 |
| `10001` | 404 | 资源不存在 |
| `10002` | 409 | 数据冲突 |
| `10003` | 500 | 服务器内部错误 |
| `20000` | 401 | 未登录或 token 过期 |
| `20001` | 403 | 无权限 |
| `20002` | 423 | 账户已锁定（登录失败超限） |
| `20003` | 423 | 二级密码已锁定 |

### 1.5 认证

JWT 双 token 模式：
- Authorization header: `Bearer <access_token>`（TTL 15min）
- Refresh token: httpOnly cookie `X-Refresh-Token`（TTL 7d）
- 所有非公开接口需 Authorization header

### 1.6 软删除 / 硬删除

- **核心实体**（Employee / Department / Position / Role / User）→ 软删除，字段 `deletedAt`
- **流水数据**（排班记录 / 打卡记录 / 报销单 / 培训记录 / 公告）→ 硬删除

---

## 2. 非功能性要求

| 项目 | 基线 |
|------|------|
| 并发用户 | 500 人在线 |
| CRUD 响应 | ≤ 200ms |
| 排班生成 | ≤ 2s（异步） |
| Excel 导入上限 | 10,000 行 |
| 薪资数据保留 | 5 年（年度归档 MinIO 后清理 DB） |
| 考勤数据保留 | 3 年（月度汇总后原始记录可清理） |
| 审计日志保留 | 永久 |

---

## 3. 模块一：认证与用户

### POST /api/auth/login

请求：
```json
{
  "username": "string",
  "password": "string"
}
```

响应 `data`：
```json
{
  "accessToken": "string",
  "user": { "id": 1, "username": "admin", "employeeId": 1 }
}
```
同时 Set-Cookie: `X-Refresh-Token` (httpOnly, Secure, SameSite=Lax)

**业务规则**：
- 密码 bcrypt 比对
- 失败计数 +1，5 次错误锁定 15 分钟（HTTP 20002）
- 成功后失败计数归零

### POST /api/auth/refresh

Cookie: `X-Refresh-Token`

响应 `data`：同登录，返回新 accessToken。

### POST /api/auth/logout

清除 `X-Refresh-Token` cookie。

### GET /api/auth/me

获取当前登录用户信息。

---

## 4. 模块二：组织架构与人员管理

### 4.1 部门

#### GET /api/departments

分页查询，支持 `?parentId=&keyword=`。

#### POST /api/departments

```json
{
  "name": "string",
  "parentId": "number | null",
  "sortOrder": "number"
}
```

#### GET /api/departments/:id

#### PUT /api/departments/:id

#### DELETE /api/departments/:id

**业务规则**：有子部门或有在职员工时禁止删除（HTTP 30001）。

#### GET /api/departments/tree

返回完整组织树（不分页）。

### 4.2 岗位

#### GET /api/departments/:id/positions

#### POST /api/departments/:id/positions

```json
{
  "name": "string",
  "rankId": "number",
  "headcount": "number"
}
```

#### PUT /api/positions/:id

#### DELETE /api/positions/:id

**业务规则**：岗位有在职员工时禁止删除（HTTP 30002）。

### 4.3 职级

#### GET /api/ranks

#### POST /api/ranks

```json
{
  "name": "string",
  "level": "number"
}
```

### 4.4 员工

#### GET /api/employees

分页，支持 `?departmentId=&positionId=&status=&keyword=`

响应 `list` 中敏感字段（薪资、身份证）默认脱敏为 `****`。

#### POST /api/employees

```json
{
  "name": "string",
  "employeeNo": "string",
  "phone": "string",
  "email": "string",
  "idCard": "string",
  "hireDate": "string (YYYY-MM-DD)",
  "departmentId": "number",
  "positionIds": ["number"]
}
```

#### GET /api/employees/:id

敏感字段是否脱敏取决于当前用户权限。

#### PUT /api/employees/:id

#### DELETE /api/employees/:id

**业务规则**：软删除，设置 `deletedAt`。

#### POST /api/employees/:id/regularize

转正。`{ "regularizeDate": "YYYY-MM-DD" }`

#### POST /api/employees/:id/resign

离职。`{ "resignDate": "YYYY-MM-DD", "reason": "string" }`
离职后自动从所有排班池中移除。

#### POST /api/employees/batch-import

multipart/form-data，上传 Excel。参考模块十二。

---

## 5. 模块三：权限系统

### 5.1 角色

#### GET /api/roles

#### POST /api/roles

```json
{
  "name": "string",
  "code": "string",
  "description": "string"
}
```

#### PUT /api/roles/:id

#### DELETE /api/roles/:id

**业务规则**：有用户绑定时禁止删除。

#### PATCH /api/roles/:id/permissions

```json
{
  "permissionIds": ["number"]
}
```

全量替换角色权限。

### 5.2 权限

#### GET /api/permissions

返回所有权限标识列表（`employee:read`、`payroll:view` 等），不分页。

### 5.3 用户-角色绑定

#### GET /api/users/:id/roles

#### PUT /api/users/:id/roles

```json
{
  "roleIds": ["number"]
}
```

全量替换用户角色。

---

## 6. 模块四：智能排班

### 6.1 班次模板

#### GET /api/shift-templates

#### POST /api/shift-templates

```json
{
  "name": "string",
  "startTime": "string (HH:mm)",
  "endTime": "string (HH:mm)",
  "color": "string (#hex)",
  "description": "string"
}
```

### 6.2 轮班规则

#### GET /api/rotation-rules

#### POST /api/rotation-rules

```json
{
  "name": "string",
  "pattern": [
    { "dayOffset": 0, "shiftTemplateId": 1 },
    { "dayOffset": 1, "shiftTemplateId": 2 },
    { "dayOffset": 2, "shiftTemplateId": 1 }
  ],
  "cycleDays": 3
}
```

**业务规则**：`cycleDays` 必须等于 pattern 数组长度。

### 6.3 排班计划

#### GET /api/schedules

查询指定日期范围的排班：`?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&departmentId=&employeeId=`

#### POST /api/schedules/generate

```json
{
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "departmentId": "number",
  "rotationRuleId": "number"
}
```

**业务规则**：
- 规则引擎按轮班规则 + 人员可用性自动生成草稿
- 自动检测冲突（已请假时段、重复排班）
- 冲突记录标红返回，不自动修正
- 返回生成统计：`{ totalAssigned, conflicting, skippedLeave }`

#### PUT /api/schedules/:id

手工拖拽调整单个排班记录。

**业务规则**：调整时实时校验冲突，冲突时返回 HTTP 40001。

#### DELETE /api/schedules/:id

删除单条排班（无员工打卡记录时允许）。

#### POST /api/schedules/clear-range

清除指定日期范围 + 部门的全部排班（供重新生成用）。

### 6.4 排班冲突检测

#### GET /api/schedules/conflicts

`?startDate=&endDate=&departmentId=`

返回冲突列表：`[{ employeeId, date, conflicts: [] }]`

---

## 7. 模块五：考勤工时

### 7.1 打卡记录

#### GET /api/attendance-records

分页：`?employeeId=&dateFrom=&dateTo=&departmentId=`

#### POST /api/attendance-records/clock

```json
{
  "employeeId": "number",
  "type": "IN | OUT",
  "timestamp": "string (ISO 8601)"
}
```

**业务规则**：
- 自动匹配当天的排班班次计算迟到/早退
- 跨天打卡（out 在次日）自动关联到对应班次

#### POST /api/attendance-records/batch-import

Excel 批量导入。参考模块十二。

### 7.2 考勤台账（月度汇总）

#### GET /api/attendance-summaries

分页：`?year=&month=&departmentId=&employeeId=`

**data.list** 包含：应出勤天数、实际出勤、迟到次数、早退次数、加班工时、缺勤天数。

#### POST /api/attendance-summaries/generate

```json
{
  "year": 2026,
  "month": 7,
  "departmentId": "number | null"
}
```

**业务规则**：
- 调用 Piscina worker 计算月度汇总，大部门拆为多批次
- 已锁定的月份禁止重新生成（HTTP 50001）

#### POST /api/attendance-summaries/:id/lock

锁定月度台账，锁定后不可修改。

#### GET /api/attendance-summaries/export

导出月度考勤 Excel：`?year=&month=&departmentId=`

---

## 8. 模块六：假期管理

### 8.1 假期额度

#### GET /api/leave-quotas

分页：`?year=&employeeId=&departmentId=`

**data.list** 含：年假余额、事假已用、病假已用、调休余额。

#### POST /api/leave-quotas/init-year

```json
{
  "year": 2026
}
```

**业务规则**：按入职年限自动计算年假初始额度（1年≤5天，10年≤10天，20年≤15天）。

### 8.2 请假申请

#### GET /api/leave-requests

分页：`?status=&employeeId=&departmentId=&dateFrom=&dateTo=`

#### POST /api/leave-requests

```json
{
  "employeeId": "number",
  "type": "ANNUAL | SICK | PERSONAL | COMPENSATORY | MARRIAGE | MATERNITY",
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "startTime": "AM | PM | ALL",
  "endTime": "AM | PM | ALL",
  "reason": "string",
  "attachments": ["string (URL)"]
}
```

**业务规则**：
- 校验假期额度是否够用（HTTP 60001）
- 创建后自动锁定对应的排班时段
- 自动触发审批流（关联审批流模块）

#### PUT /api/leave-requests/:id

仅 `PENDING` 状态可修改。

#### POST /api/leave-requests/:id/cancel

撤销请假申请。

### 8.3 请假审批（审批流底层）

#### GET /api/leave-requests/:id/approval-chain

当前审批链路和节点状态。

#### POST /api/leave-requests/:id/approve

审批通过（仅审批人操作）。

**业务规则**：
- 通过后抵扣假期额度
- 解锁被锁定的排班时段（标记为请假）
- 同步影响考勤统计

#### POST /api/leave-requests/:id/reject

驳回。`{ "reason": "string" }`。驳回后恢复假期额度，解锁排班时段。

---

## 9. 模块七：薪资核算

### 9.1 二级密码

#### POST /api/salary/verify-password

```json
{
  "password": "string"
}
```

**业务规则**：
- bcrypt 比对独立表 `SalaryPassword`
- 3 次失败锁定 30 分钟（HTTP 20003）
- 成功后失败计数归零
- 校验通过返回临时 token（TTL 5min），后续薪资接口需携带

#### POST /api/salary/set-password

```json
{
  "oldPassword": "string",
  "newPassword": "string"
}
```

首次设置时 `oldPassword` 为空。

### 9.2 薪资结构

#### GET /api/salary-structures

#### POST /api/salary-structures

```json
{
  "name": "string",
  "items": [
    { "type": "BASE | PERFORMANCE | SUBSIDY | INSURANCE | TAX | DEDUCTION", "name": "基本工资", "formula": "string", "sortOrder": 0 }
  ]
}
```

**formula 示例**：`{BASE} * 1.0`、`{BASE} * 0.2`、`{BASE} * 0.105` (社保)。

#### PUT /api/salary-structures/:id

修改后不影响已有月份的工资条。

#### POST /api/salary-structures/:id/assign

```json
{
  "employeeIds": ["number"]
}
```

将薪资结构批量分配给员工。

### 9.3 工资条（含二级密码校验）

> 以下接口均需 Header `X-Salary-Token`（二级密码临时 token）。

#### GET /api/salary/payslips

分页：`?year=&month=&departmentId=&employeeId=`

**业务规则**：
- 列表默认脱敏，金额显示 `****`
- 每次查看/导出操作写入审计日志

#### GET /api/salary/payslips/:id

单条工资条明细。返回完整薪资结构及金额。

#### POST /api/salary/payslips/generate

```json
{
  "year": 2026,
  "month": 7,
  "departmentId": "number | null"
}
```

**业务规则**：
- 按员工分配的薪资结构 + 考勤数据计算实际金额
- 调用 Piscina worker 处理大部门计算
- 已生成的月份禁止重新生成（HTTP 70001）

#### GET /api/salary/payslips/export

导出月度工资报表 Excel。

### 9.4 薪资审计

#### GET /api/salary/audit-logs

分页：`?userId=&action=&dateFrom=&dateTo=`

**action 枚举**：`VIEW_SALARY | VIEW_PAYSLIP | EXPORT_SALARY | VERIFY_PASSWORD_SUCCESS | VERIFY_PASSWORD_FAIL`

---

## 10. 模块八：报销管理

### 10.1 报销单

#### GET /api/expense-claims

分页：`?status=&employeeId=&departmentId=&dateFrom=&dateTo=`

#### POST /api/expense-claims

```json
{
  "title": "string",
  "expenseType": "TRAVEL | OFFICE | ENTERTAINMENT | OTHER",
  "amount": "number",
  "description": "string",
  "attachments": ["string (URL)"]
}
```

**业务规则**：创建后自动触发审批流。

#### PUT /api/expense-claims/:id

仅 `PENDING` 或 `DRAFT` 状态可修改。

#### DELETE /api/expense-claims/:id

仅 `DRAFT` 状态可删除。

#### GET /api/expense-claims/export

导出月度报销报表：`?year=&month=&departmentId=`

---

## 11. 模块九：培训管理

### 11.1 培训课程

#### GET /api/training-courses

分页：`?status=&keyword=`

#### POST /api/training-courses

```json
{
  "name": "string",
  "description": "string",
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "type": "ONLINE | OFFLINE",
  "location": "string",
  "trainer": "string",
  "maxAttendees": "number | null"
}
```

#### PUT /api/training-courses/:id

#### DELETE /api/training-courses/:id

无报名记录时可删除。

### 11.2 培训报名

#### GET /api/training-courses/:id/attendees

#### POST /api/training-courses/:id/enroll

```json
{
  "employeeIds": ["number"]
}
```

**业务规则**：超出 maxAttendees 时拒绝（HTTP 90001）。

#### POST /api/training-courses/:id/complete

```json
{
  "employeeId": "number",
  "score": "number | null"
}
```

### 11.3 员工培训档案

#### GET /api/employees/:id/training-records

---

## 12. 模块十：知识库

### 12.1 文档管理

#### GET /api/kb-documents

分页：`?category=&keyword=&uploadDateFrom=&uploadDateTo=`

#### POST /api/kb-documents

multipart/form-data:
- `file`: 文件
- `category`: `POLICY | COURSEWARE | FORM | CONTRACT | ANNOUNCEMENT`
- `title`: 标题
- `isConfidential`: 是否涉密

**业务规则**：
- 文件上传 MinIO，数据库存 URL
- 生成临时预览 URL 存 Redis（TTL 1h）

#### DELETE /api/kb-documents/:id

仅上传者可删除。

### 12.2 文件预览

#### GET /api/kb-documents/:id/preview

返回 kkFileView 预览 URL。

**业务规则**：
- 涉密文件预览前需二级密码校验
- 预览写入审计日志

#### GET /api/kb-documents/:id/download

返回文件下载 URL。

---

## 13. 模块十一：审批流引擎

### 13.1 流程模板

#### GET /api/workflow-templates

#### POST /api/workflow-templates

```json
{
  "name": "string",
  "description": "string",
  "nodes": [
    {
      "type": "APPROVAL | CC | CONDITION | START | END",
      "label": "string",
      "assigneeType": "ROLE | USER | DEPARTMENT_LEADER",
      "assigneeId": "number | null",
      "conditions": [
        { "field": "amount", "operator": "GT", "value": "1000" }
      ],
      "signType": "OR | AND",
      "timeoutHours": "48 | null",
      "timeoutAction": "PASS | REJECT | NOTIFY",
      "position": { "x": 0, "y": 0 }
    }
  ],
  "edges": [
    { "sourceNodeIndex": 0, "targetNodeIndex": 1, "label": "通过" }
  ]
}
```

**节点类型**：START / APPROVAL / CONDITION / CC / SUB_PROCESS / END
**会签模式**：`signType: OR`（或签，一人通过即通过）/ `AND`（会签，全员通过才通过）
**时效控制**：`timeoutHours` + `timeoutAction`

#### PUT /api/workflow-templates/:id

#### POST /api/workflow-templates/:id/deploy

发布流程模板。发布后不可编辑，需创建新版本。

### 13.2 审批实例

#### GET /api/workflow-instances

分页：`?status=&applicantId=&templateId=&dateFrom=&dateTo=`

#### POST /api/workflow-instances

```json
{
  "templateId": "number",
  "subject": "string",
  "formData": "object",
  "sourceType": "LEAVE | EXPENSE | OTHER",
  "sourceId": "number"
}
```

**业务规则**：
- 按模板生成审批实例和节点
- 关联业务单据（请假/报销）
- 首个审批节点自动进入 IN_PROGRESS

#### GET /api/workflow-instances/:id

含当前审批进度、节点状态、历史操作记录。

#### POST /api/workflow-instances/:id/approve

审批通过：`{ "comment": "string" }`

**业务规则**：
- 流转到下一节点
- 最后一个 APPROVAL 节点通过后 → 实例完成
- 会签节点需所有审批人通过才流转

#### POST /api/workflow-instances/:id/reject

驳回：`{ "reason": "string" }`
驳回后关联业务单据状态同步为 REJECTED。

#### POST /api/workflow-instances/:id/delegate

转签：`{ "toUserId": "number", "reason": "string" }`
将当前待审批任务转给其他用户。

#### POST /api/workflow-instances/:id/add-signer

加签：`{ "userId": "number" }`
在会签节点追加审批人。

#### POST /api/workflow-instances/:id/cancel

发起人撤销审批（仅 PENDING 状态）。

#### GET /api/workflow-instances/pending

当前用户的待办列表。

---

## 14. 模块十二：消息与公告

### 14.1 系统消息

#### GET /api/messages

分页：`?read=&type=`

**type**：`TODO | NOTIFICATION | SYSTEM`

#### PATCH /api/messages/:id/read

标记已读。

#### POST /api/messages/read-all

全部标记已读。

### 14.2 公告

#### GET /api/announcements

分页：`?status=&targetDepartmentId=`

#### POST /api/announcements

```json
{
  "title": "string",
  "content": "string",
  "targetType": "ALL | DEPARTMENT | ROLE",
  "targetIds": ["number"],
  "attachments": ["string (URL)"]
}
```

#### PUT /api/announcements/:id

#### DELETE /api/announcements/:id

#### POST /api/announcements/:id/publish

发布公告。发布后不可编辑。

---

## 15. 模块十三：Excel 导入导出体系

### 15.1 通用导入

#### GET /api/excel/template/:module

下载导入模板。`module`：`employee | schedule | attendance | leave | salary | expense | training`

#### POST /api/excel/import/:module

multipart/form-data，上传 Excel。

**业务规则**：
- 前端 Zod 预校验 Header + 数据格式
- ≤ 5MB / ≤ 2000 行：同步处理
- 超过阈值：分片上传 + BullMQ 异步队列 + 轮询进度
- 后端 Zod + 业务规则双重校验
- 事务批量入库，失败回滚
- 返回 `{ successCount, failCount, errorFileUrl }`

### 15.2 进度轮询

#### GET /api/excel/import/progress/:taskId

```json
{
  "code": 0,
  "data": {
    "status": "PROCESSING | COMPLETED | FAILED",
    "progress": 45,
    "totalRows": 5000,
    "processedRows": 2250
  }
}
```

### 15.3 通用导出

#### GET /api/excel/export/:module

`?year=&month=&departmentId=&...`

返回 Excel 文件流。

**业务规则**：薪资模块导出需二级密码校验。

---

## 16. 安全规范

### 16.1 认证与授权

- 所有非公开接口需 `Authorization: Bearer <access_token>`
- 权限中间件 `requirePermission` 按接口级校验
- 行级数据权限由 Prisma middleware 注入 WHERE 条件

### 16.2 数据脱敏

- 敏感字段标记（薪资、身份证）
- 列表查询默认脱敏
- 详情接口根据当前用户权限决定是否脱敏
- 前端二次校验（薪资模块）

### 16.3 二级密码

- 独立于登录密码
- bcrypt 独立哈希存储（`SalaryPassword` 表）
- 错误 3 次锁定 30 分钟
- 校验通过后发放临时 token（TTL 5min）
- 薪资接口需携带 `X-Salary-Token`

### 16.4 登录安全

- 密码 bcrypt 哈希存储
- 错误 5 次锁定 15 分钟
- JWT access token TTL 15min，refresh token httpOnly cookie TTL 7d

---

## 17. 数据模型速查

> 详细 Schema 见 `server/prisma/schema.prisma`

| 实体 | 表名 | 软删除 | 关键字段 |
|------|------|--------|---------|
| 部门 | Department | ✅ | parentId, sortOrder |
| 岗位 | Position | ✅ | rankId, headcount |
| 职级 | Rank | ❌ | level |
| 员工 | Employee | ✅ | employeeNo, idCard(masked), status |
| 用户 | User | ✅ | username, passwordHash, loginFailCount, lockedUntil |
| 角色 | Role | ✅ | code |
| 权限 | Permission | ❌ | code |
| 班次模板 | ShiftTemplate | ❌ | startTime, endTime, color |
| 轮班规则 | RotationRule | ❌ | pattern(JSON), cycleDays |
| 排班记录 | Schedule | ❌ | date, shiftTemplateId, employeeId |
| 打卡记录 | AttendanceRecord | ❌ | employeeId, type, timestamp |
| 考勤台账 | AttendanceSummary | ❌ | year, month, employeeId, locked |
| 假期额度 | LeaveQuota | ❌ | year, employeeId, annualBalance, ... |
| 请假申请 | LeaveRequest | ✅ | type, startDate, endDate, status |
| 薪资结构 | SalaryStructure | ❌ | items(JSON) |
| 工资条 | Payslip | ❌ | year, month, employeeId, items(JSON) |
| 二级密码 | SalaryPassword | ❌ | userId, passwordHash, failCount |
| 审计日志 | AuditLog | ❌ | userId, action, ip, createdAt |
| 报销单 | ExpenseClaim | ❌ | expenseType, amount, status |
| 培训课程 | TrainingCourse | ❌ | type, startDate, endDate |
| 培训记录 | TrainingRecord | ❌ | employeeId, courseId, score |
| 知识库文档 | KbDocument | ❌ | category, url, isConfidential |
| 流程模板 | WorkflowTemplate | ✅ | nodes(JSON), edges(JSON), version |
| 审批实例 | WorkflowInstance | ❌ | templateId, sourceType, sourceId, status |
| 审批节点 | WorkflowNode | ❌ | instanceId, type, assigneeId, status |
| 系统消息 | Message | ❌ | userId, type, read |
| 公告 | Announcement | ✅ | title, content, targetType, status |

---

## 附录 A：请求/响应 Zod Schema 约定

共享 `shared/src/schemas/` 目录结构：

```
shared/src/schemas/
├── common.ts          # PaginationParams, ApiResponse<T>
├── auth.ts            # LoginInput, LoginOutput
├── employee.ts        # EmployeeCreate, EmployeeUpdate, EmployeeResponse
├── department.ts      # DepartmentCreate, ...
├── schedule.ts
├── attendance.ts
├── leave.ts
├── salary.ts
├── expense.ts
├── training.ts
├── kb.ts
├── workflow.ts
├── message.ts
└── excel.ts
```

每个模块的 Zod Schema 驱动：
1. 前端表单校验
2. 前端 Excel 导入预校验
3. 后端 Fastify route 请求体校验（`zod-to-json-schema`）
4. 后端 Fastify route 响应序列化（`fast-json-stringify`）
5. Scalar API 文档自动生成

---

## 附录 B：BullMQ 队列规划

| 队列名 | 用途 | 并发 |
|--------|------|------|
| `excel-import` | Excel 异步导入 | 2 |
| `excel-export` | Excel 异步导出 | 2 |
| `schedule-generate` | 排班批量生成 | 1 |
| `attendance-summary` | 考勤月度汇总 | 2 |
| `payslip-generate` | 工资条批量计算 | 1 |
