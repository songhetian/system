# 项目决策记录

> 两次 grilling 的全部 21 项决策汇总。换工具时，这份文件就是项目的"设计宪法"。

---

## 一、架构决策（grilling #1）

| # | 决策点 | 结论 | 理由 |
|---|--------|------|------|
| 1 | 租户模式 | **单租户** | 单人项目，不做 SaaS 过度设计；真有第二个客户再抽象 |
| 2 | 团队 / 交付 | **单人、无 deadline、单仓** | 全栈一个人，不需要微服务、monorepo 分包 |
| 3 | Fastify 序列化 | **Zod → JSON Schema** | 请求校验 + 响应序列化一条链路，`zod-to-json-schema` 一个依赖解决 |
| 4 | 部署 | **Docker Compose 全本地** | MySQL/Redis/MinIO/kkFileView/BullMQ Worker 一个 compose 文件全起来 |
| 5 | API 协议 | **REST** | 12 模块全是标准 CRUD，React Query 原生适配；tRPC/GraphQL 过度设计 |
| 6 | 前端结构 | **单 App + 路由懒加载** | `src/features/` 按模块拆，Vite 自动 code-split；monorepo 分包没必要 |
| 7 | 排班算法 | **规则引擎 + 手动微调** | 企业排班需要"可解释、可调整"，不是黑盒最优解；OR-Tools 复杂度不值 |
| 8 | 认证 | **JWT 双 token** | access 15min + refresh 7d httpOnly cookie；`@fastify/jwt` + `@fastify/cookie` |
| 9 | 审批流 | **v1 完整 BPMN-lite** | 会签/或签/子流程/加签转签/时效控制，一次到位不返工 |
| 10 | 测试 | **TDD 全量（Vitest）** | 排班/薪资计算密集型模块承担不起运行时 bug |
| 11 | 密码安全 | **bcrypt** | 登录 5 次错锁 15min，二级密码 3 次错锁 30min，独立表 `SalaryPassword` |
| 12 | 数据模型 | **核心域优先** | 先建 Employee/Department/Position/User/Role，其余模块按顺序扩展 |
| 13 | API 文档 | **Swagger + Scalar** | `@fastify/swagger` + `@scalar/fastify-api-reference`，Zod Schema 自动生成 OpenAPI |

---

## 二、API 规格决策（grilling #2）

| # | 决策点 | 结论 | 理由 |
|---|--------|------|------|
| 1 | 版本策略 | **不做版本号** | 单人项目，API breaking change 改前端即可 |
| 2 | 响应格式 | **信封式** `{ code, data, message }` | 分页 `{ list, total, page, pageSize }`，Arco Table 原生适配 |
| 3 | URL 命名 | **RESTful 复数 + kebab-case** | `GET /api/employees`、`POST /api/departments/:id/employees` |
| 4 | 并发基线 | **500 在线** | CRUD ≤200ms、排班生成 ≤2s 异步、Excel 上限 10000 行 |
| 5 | 错误码 | **数字区间分区** | 10000 通用～130000 Excel，13 个区间每模块独立段 |
| 6 | 删除策略 | **核心软删除、流水硬删除** | Employee/Department/Role 软删；排班/打卡/报销单硬删 |
| 7 | 数据保留 | **薪资 5 年 / 考勤 3 年 / 审计永久** | Schema 预留 `archivedAt`，V2 做定时清理 |
| 8 | Spec 范围 | **12 模块全覆盖** | 全模块端点/Schema/业务规则一次到位，标注 Phase 2+ |

---

## 三、新增依赖清单

| 依赖 | 用途 | 决策来源 |
|------|------|---------|
| `zod-to-json-schema` | Zod → JSON Schema 转换 | #3 |
| `@fastify/swagger` | OpenAPI 文档生成 | #13 |
| `@scalar/fastify-api-reference` | API 文档 UI | #13 |
| `bcryptjs` | 密码哈希 | #11 |
| `@fastify/jwt` | JWT 签发/验证 | #8 |
| `@fastify/cookie` | httpOnly cookie | #8 |
| `@fastify/multipart` | 文件上传 | API spec |
| `@fastify/cors` | 跨域（开发期） | 基础架构 |

---

## 四、技术栈总览

```
前端:  React 18 + TypeScript + Vite
UI:    Arco Design Pro（唯一源）
状态:  Zustand（全局） + React Query（服务端）
路由:  React Router v6
校验:  Zod（前后端共用）
画布:  @xyflow/react（审批流）

后端:  Fastify + TypeScript
ORM:   Prisma
DB:    MySQL 8.0
缓存:  Redis 7
队列:  BullMQ
存储:  MinIO
预览:  kkFileView（Docker 独立部署）

部署:  Docker Compose 全本地
测试:  Vitest（TDD 全量）
```

---

## 五、开发阶段

| 阶段 | 内容 |
|------|------|
| Phase 1 | 项目骨架 + 核心域模型 + JWT 认证 + 通用组件 + 安全中间件 |
| Phase 2 | 排班 + 考勤 + 假期 |
| Phase 3 | 审批流引擎 |
| Phase 4 | 薪资（二级密码） |
| Phase 5 | 报销 + 培训 + 知识库 |
| Phase 6 | Excel 体系 + 消息公告 + 压测 |
