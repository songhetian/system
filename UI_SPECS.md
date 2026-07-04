# 前端全局 UI 规范

> 所有 skill、Agent、代码生成在创建/修改前端代码时必须读取并严格遵守。
> 与 `开发文档.md` §6 互补——此处为强制规则清单，§6 为设计理念。

---

## 1. 技术栈与依赖

| 层 | 选型 | 约束 |
|----|------|------|
| 框架 | React 18 + TypeScript | 严格模式；禁止 class component |
| UI 基座 | **Arco Design Pro** | 唯一 UI 标准，禁止引入 Element Plus / Antd 等第二套组件库 |
| 样式方案 | Arco 主题 Token + CSS Modules | 禁止裸写 `.css` 文件；禁止 styled-components |
| 工具类 | Arco 内置间距/排版 Token | 不引入 Tailwind CSS（Arco Token 已覆盖） |
| 图标 | `@arco-design/web-react/icon` | 唯一来源，禁止引入其他图标库 |
| 状态管理 | Zustand | 全局状态 |
| 服务端状态 | React Query (TanStack Query) | 缓存、轮询、异步任务 |
| 路由 | React Router v6 | 懒加载 `React.lazy()` |
| 表单 | Arco `<Form>` + Zod | 校验统一走 Zod Schema |
| 校验 | Zod | `src/types/` 下的 Schema 前后端共用 |
| 拖拽画布 | @xyflow/react | 审批流编辑器专用 |

---

## 2. 设计 Token（唯一合法色值）

### 2.1 主色与功能色

```
主色：     #1677ff  — Arco 标准商务蓝 (--color-primary-6)
浅主色：   #e8f3ff  — 选中背景、hover 态
成功：     #00b42a  — (--color-success-6)
警告：     #ff7d00  — (--color-warning-6)
错误：     #f53f3f  — (--color-danger-6)
文本主：   #1d2129  — (--color-text-1)
文本次：   #4e5969  — (--color-text-2)
文本弱：   #86909c  — (--color-text-3)
边框：     #e5e6eb  — (--color-border-2)
背景：     #f7f8fa  — 页面底色 (--color-fill-1)
```

### 2.2 规则

- **绝对禁止硬编码色值**。全部通过 Arco CSS 变量或 Token 引用。
- 禁止自定义色值，禁止透明度变体（如 `rgba(22,119,255,0.1)`），禁止渐变色。
- 状态标签、Badge 颜色从上述 4 个功能色中选取，禁止新增。

### 2.3 暗黑模式

V1 不做暗黑模式。所有组件按 light 主题编写，不预埋 `[data-theme='dark']` 代码。

---

## 3. 间距系统

| Token | 值 | 使用场景 |
|-------|----|---------|
| `4px` | 超紧密 | 图标与文字间距、Tag 内边距 |
| `8px` | 紧凑 | 表单行间距、按钮组间隔 |
| `16px` | 默认 | 卡片内边距、列表项间距、组件间间距 |
| `24px` | 宽松 | 页面内容区 padding、区块间距 |
| `32px` | 超宽松 | 页面大区块间隔、Footer 高度 |

**规则**：
- 使用 Arco `<Space>` 组件或 Token 变量，禁止 `style={{ marginTop: 13 }}` 这类魔法数字。
- 页面整体 padding 固定 `24px`，卡片内 padding 固定 `16px`。

---

## 4. 圆角

| 场景 | 值 |
|------|-----|
| 小元素（Tag、Badge、小按钮） | `4px` |
| 默认（输入框、Select、按钮） | `6px` |
| 卡片、表格、面板 | `8px` |
| 弹窗、抽屉 | `8px` |

**规则**：使用 Arco 组件默认圆角，不覆盖。自定义区域统一用 `8px`。

---

## 5. 字体

```
字体族：   -apple-system, "Inter", "PingFang SC", "Microsoft YaHei", sans-serif
字号层级：  12px（辅助/标签）、14px（正文/表格）、16px（卡片标题）、18px（页面标题）
行高：      1.5（全局）
字重：      400（正文）、500（加粗标题）、600（页面大标题）
```

**规则**：不自定义 font-family、不引入 Web 字体、不调整 letter-spacing。

---

## 6. 组件规则

### 6.1 表单

- 统一使用 `<Form.Item>` 包裹字段，`labelCol={{ span: 6 }}` `wrapperCol={{ span: 18 }}`。
- label 固定宽度 `120px`，不随文案长度自适应。
- 必填字段 `rules={[{ required: true }]}` 通过 Zod `.min(1)` 自动标记。
- 提交按钮 disabled 直到 `formState.isValid && !formState.isSubmitting`。
- 表单底部操作区固定：`<Space><Button type="primary" htmlType="submit">确认</Button><Button>取消</Button></Space>`。

### 6.2 表格

- 所有列表页必须含：分页器、序号列（`rowIndex + 1 + (page-1)*pageSize`）、操作列（固定右侧 200px）。
- 空状态：Arco `<Table>` 默认空态 + `description="暂无数据"`。
- 加载态：`loading={isLoading}`，不额外造骨架屏。
- 列宽：操作列固定 200px，日期列固定 160px，状态列固定 100px，其余自适应或指定 minWidth。
- 行选择：勾选模式 `<Table rowSelection={{ type: 'checkbox' }} />`。

### 6.3 弹窗

- Footer 按钮顺序：**取消 在左，确认 在右**（与操作系统原生顺序一致）。
- 关闭方式：右上角 X + 取消按钮 + 点击遮罩（`maskClosable={false}` 在表单弹窗）。
- 弹窗宽度：小 480px、中 640px、大 900px、超大 1200px。
- 确认类操作用 `<Modal.confirm>`，自定义内容用 `<Modal>`。
- 所有弹窗必须有 `title`，禁止无标题弹窗。

### 6.4 抽屉

- 固定右侧打开，宽度 600px。
- 标题格式：`{操作类型}{实体名}`，如"编辑员工"、"查看排班详情"。
- Footer 与弹窗规则一致。

### 6.5 按钮

- 主操作 `<Button type="primary">`，次要操作 `<Button>`，危险操作 `<Button type="primary" status="danger">`。
- 按钮文案：动词 + 名词，如"新增员工"、"导出报表"，禁止"确定"（弹窗内除外）。
- 加载态：`loading` 属性 + 文案不变，如 `loading={isSubmitting}` 时按钮仍显示"保存"。
- 图标按钮：`<Button icon={<IconPlus />} />` 不写文字的类型，必须有 Tooltip。

### 6.6 面包屑与页面标题

- 每个页面顶部 `<PageHeader title="员工管理" breadcrumb={{ routes }} />`。
- 面包屑格式：首页 > 模块名 > 页面名。

---

## 7. 代码结构规范

### 7.1 组件文件夹

```
src/features/{module}/
├── index.tsx          # 页面入口，路由组件
├── components/
│   ├── {Name}Form.tsx       # 表单组件
│   ├── {Name}Table.tsx      # 表格组件
│   └── {Name}Detail.tsx     # 详情组件
├── hooks/
│   ├── use{Name}List.ts     # 列表数据 hook
│   └── use{Name}Mutate.ts   # 增删改 hook（React Query mutation）
└── types.ts           # 仅该页面级的临时类型（全局类型从 @/types 引入）
```

### 7.2 命名约定

- 组件文件：PascalCase `EmployeeTable.tsx`
- Hook 文件：camelCase `useEmployeeList.ts`
- 类型文件：`types.ts`
- 路由路径：kebab-case `/employee-management`
- API 端点：kebab-case `/api/employees`

### 7.3 Props 规范

- **所有 Props 必须用 Zod 校验**，禁止 `interface Props { ... }` 且禁止 `any`。
- 从 `@/types` 复用已有 Schema，不重复定义。

```typescript
// ✅ 正确
import { zEmployeeCreate } from '@/types';

type Props = { defaultValues?: Partial<EmployeeCreate>; onSubmit: (data: EmployeeCreate) => void };

// ❌ 错误
interface Props { data: any; onOk: () => void }
```

### 7.4 样式规范

- 优先使用 Arco 组件自带属性（`size`、`type`、`status`）。
- 必须自定义时，使用 CSS Modules（`style.module.css`），类名 camelCase。
- **禁止**：`style={{ ... }}` 内联样式、裸 `.css` 文件、`styled-components`。

---

## 8. 通用组件使用清单

> 以下为全局复用组件，创建页面时必须优先查阅是否可复用。

| 组件 | 路径 | 用途 |
|------|------|------|
| BaseTable | `@/components/BaseTable` | 统一表格（分页/序号/操作列） |
| BaseRightDrawer | `@/components/BaseRightDrawer` | 右侧详情抽屉 |
| BaseFormModal | `@/components/BaseFormModal` | 表单弹窗（Zod 驱动） |
| BaseUploadExcel | `@/components/BaseUploadExcel` | Excel 上传 + 进度 |
| BaseFilePreview | `@/components/BaseFilePreview` | kkFileView 预览弹窗 |
| BaseSalaryPwdModal | `@/components/BaseSalaryPwdModal` | 二级密码弹窗 |
| BaseFlowCanvas | `@/components/BaseFlowCanvas` | 审批流画布（@xyflow/react 封装） |
| BaseScheduleCalendar | `@/components/BaseScheduleCalendar` | 排班月历视图 |

**规则**：能用以上组件实现的场景，禁止重新手写。组件不满足需求时，修改组件本身而非在页面里绕过。

---

## 9. 状态管理规范

### 9.1 数据流分类

| 类型 | 工具 | 示例 |
|------|------|------|
| 服务端数据 | React Query | 员工列表、排班数据、薪资条（自动缓存/轮询/乐观更新） |
| 全局 UI 状态 | Zustand | 侧边栏折叠、当前选中部门、全局 loading |
| 表单状态 | Arco Form + Zod | add/edit 表单 |
| URL 参数 | React Router `useSearchParams` | 列表页筛选条件、分页位置 |

### 9.2 React Query 约定

- Query key 格式：`['module', 'entity', params]`，如 `['employees', 'list', { page, departmentId }]`
- Mutation 成功后自动 `invalidateQueries` 对应列表缓存。
- `staleTime: 5 * 60 * 1000`（5 分钟），排班/考勤数据 `staleTime: 60 * 1000`。
- 薪资模块不缓存（`staleTime: 0`），每次查看强制重新请求。

---

## 10. 交互规范

### 10.1 操作反馈

- 增删改成败：`Message.success/error` 顶部提示。
- 危险操作（删除、离职、驳回）：`Modal.confirm` 二次确认。
- 异步操作（导入、生成排班）：`Notification.info` + 进度轮询。
- 表单校验失败：Arco Form 自动滚动到第一个错误字段，字段下方红色提示。

### 10.2 加载态

- 列表：`<Table loading={isLoading} />`。
- 按钮：`<Button loading={isMutating} />`。
- 整页：React Query `isLoading` 时显示 Arco `<Spin>` 居中铺满。
- 禁止：手写骨架屏、自定义 loading 动画。

### 10.3 空状态

- 列表无数据：`<Table>` 默认空态组件。
- 搜索无结果：`<Empty description="未找到匹配结果" />`。
- 文件为空：`<Empty description="暂无文件，点击上传" />`。

### 10.4 错误状态

- 网络错误：`Message.error('网络异常，请稍后重试')`。
- 权限不足：跳转 403 页面或 `Message.error('无权限')`。
- 排班冲突：内联红色标签标注，不弹窗打断操作。
- 薪资密码错误：BaseSalaryPwdModal 内显示错误 + 剩余次数。

---

## 11. 禁止行为清单

| 类别 | 禁止项 |
|------|--------|
| 色彩 | 硬编码色值、自定义色值、渐变色、透明度变体 |
| 间距 | `style={{ margin: 7 }}` 类魔法数字、负 margin |
| 组件 | 引入 Arco 以外的 UI 库、手写已有通用组件、改造 Arco 原生结构 |
| 图标 | 非 Arco 图标、AI 生成图标、彩色图标 |
| 动效 | 自定义页面过渡、hover 缩放、弹窗渐变、路由切换动画 |
| 样式 | 裸 `.css` 文件、`styled-components`、内联 `style={{}}` |
| 字体 | 自定义 font-family、Web 字体、非标准字号 |
| 弹窗 | 无 title、无关闭按钮、确认取消顺序颠倒、遮罩不可关闭表单弹窗 |
| 表单 | 不用 Form.Item、label 不自适应固定宽度、Props 用 any |
| 状态 | 手写 loading/empty/error 组件替代 Arco 原生 |
| 导入 | `import { Button } from 'antd'`——Arco 是唯一 UI 源 |

---

## 12. 代码审查检查清单

创建/修改任何前端代码时，逐项校验：

```
□ 色值是否全部通过 Arco Token 引用（无硬编码 #xxx）
□ 间距是否使用 Arco Space 或 Token（无魔法数字 px）
□ 圆角是否匹配 §4 层级表
□ 图标是否来自 @arco-design/web-react/icon
□ 表单是否 label 120px + Form.Item + Zod 校验
□ 表格是否有分页、序号、操作列
□ 弹窗 Footer 是否取消左确认右
□ Props 是否全部从 @/types 引入（无 any）
□ 样式是否用 CSS Modules（无内联 style、无裸 css）
□ 是否复用了通用组件（§8）而非手写
□ 是否使用了 React Query 管理服务端状态（非 useState + useEffect）
□ 是否有 loading / empty / error 三种状态处理
```
