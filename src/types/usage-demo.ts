// ============================================================
// src/types/usage-demo.ts — 使用示例（Fastify 后端 + React 前端）
// 此文件仅作演示，不编译进产物
// ============================================================

import { z } from 'zod';
import { Common, Auth, Org, Salary, Workflow, Excel } from './schemas';

// ============================================================
// 场景 A: Fastify 路由处理
// ============================================================

// --- A1: 员工列表接口 (GET /api/employees) ---
// 参数校验：QueryString → ListParams
const listParams = Org.Employees.ListParamsSchema.parse({
  page: '1',
  pageSize: '20',
  departmentId: '3',
  keyword: '张三',
});
// listParams 类型自动推导为 Org.Employees.ListParams

// 响应序列化：分页包裹
declare function getEmployees(params: Org.Employees.ListParams): {
  list: Org.Employees.ListItem[];
  total: number;
  page: number;
  pageSize: number;
};

const employees = getEmployees(listParams);
const apiResponse: Common.ApiResponse<Common.PaginatedData<Org.Employees.ListItem>> = {
  code: 0,
  data: { list: employees.list, total: employees.total, page: employees.page, pageSize: employees.pageSize },
  message: 'ok',
};

// --- A2: 员工创建接口 (POST /api/employees) ---
// 请求体校验 → 使用前端的 Zod schema 在服务端二次校验
const createBody = Org.Employees.CreateSchema.parse({
  name: '李四',
  employeeNo: 'EMP-001',
  phone: '13800138000',
  idCard: '110101199001011234',
  hireDate: '2026-07-01',
  departmentId: 1,
  positionIds: [1, 2],
});
// createBody: Org.Employees.Create — 类型安全，字段无遗漏

// --- A3: 薪资模块（需要 X-Salary-Token header） ---
// 查询参数
const payslipParams = Salary.Payslips.ListParamsSchema.parse({
  page: '1',
  pageSize: '20',
  year: '2026',
  month: '7',
});

// 二级密码校验
const pwdResult = Salary.Password.VerifySchema.parse({ password: 'payroll-secret' });
// pwdResult: Salary.Password.Verify
// 校验通过后获取 salaryToken，后续接口 Header 中携带

// --- A4: 审批流实例创建 ---
const workflowCreate = Workflow.Instances.CreateSchema.parse({
  templateId: 1,
  subject: '请假审批 — 张三',
  formData: { leaveType: 'ANNUAL', days: 3 },
  sourceType: 'LEAVE',
  sourceId: 42,
});
// workflowCreate 类型包含完整的 formData 类型安全

// 审批操作
const approveAction = Workflow.Instances.ApproveSchema.parse({
  comment: '同意',
});

// 转签
const delegateAction = Workflow.Instances.DelegateSchema.parse({
  toUserId: 5,
  reason: '出差无法审批',
});

// --- A5: Excel 导入进度查询 ---
const importProgress = Excel.Import.ProgressSchema.parse({
  status: 'PROCESSING',
  progress: 45,
  totalRows: 5000,
  processedRows: 2250,
});
// importProgress: Excel.Import.Progress

// ============================================================
// 场景 B: React 前端表单（react-hook-form + zodResolver）
// ============================================================

// --- B1: 登录表单 ---
// import { useForm } from 'react-hook-form';
// import { zodResolver } from '@hookform/resolvers/zod';

declare function useForm<T>(opts: { resolver: any; defaultValues?: Partial<T> }): {
  register: (name: string) => any;
  handleSubmit: (fn: (data: T) => void) => (e: any) => void;
  formState: { errors: Record<string, any> };
};

// 类型从 Zod schema 自动推导，无需手动写 interface
const loginForm = useForm<Auth.LoginInput>({
  resolver: null!, // zodResolver(Auth.LoginInputSchema)
  defaultValues: { username: '', password: '' },
});

// --- B2: 员工创建表单 ---
const employeeForm = useForm<Org.Employees.Create>({
  resolver: null!, // zodResolver(Org.Employees.CreateSchema)
});

// 提交时类型安全
function onEmployeeSubmit(data: Org.Employees.Create) {
  // data 类型完全确定：phone 是 string，positionIds 是 number[]
  apiPost('/api/employees', data);
}

// --- B3: 报销单表单 ---
declare function useForm2<T>(opts: { resolver: any }): { onSubmit: (data: T) => void };
// import { Expense } from '@/types/schemas';
// const expenseForm = useForm<Expense.Claims.Create>({
//   resolver: zodResolver(Expense.Claims.CreateSchema),
// });

// --- B4: 排班生成表单 ---
// import { Schedules } from '@/types/schemas';
// 类型安全的排班生成：
// const scheduleGen = Schedules.Records.GenerateSchema.parse({ ... });

// --- B5: 审批流可视化编辑器（模板设计） ---
// 前端拖拽生成 Node/Edge → 后端直接使用 Workflow.Templates.CreateSchema 校验
function onTemplateSave(nodes: Workflow.Templates.Node[], edges: Workflow.Templates.Edge[]) {
  const validated = Workflow.Templates.CreateSchema.parse({
    name: '费用报销审批',
    nodes,
    edges,
  });
  // validated.nodes 已通过 discriminated union 验证：
  // - nodes[0].type === 'START' → 无 assigneeType 字段
  // - nodes[1].type === 'APPROVAL' → 有 signType, timeoutHours 等
  apiPost('/api/workflow-templates', validated);
}

// 模拟 API 调用
declare function apiPost<T>(url: string, body: unknown): Promise<T>;

// ============================================================
// 场景 C: 掩码工具类型的使用
// ============================================================
import { MaskedEntity } from './helpers';

// 手动掩码（当需要从 FullDetail 生成 ListItem 时）
type EmployeeListItem = MaskedEntity<Org.Employees.FullDetail, 'idCard' | 'salary'>;
// → idCard: "****", salary: "****"  — 类型级约束

// ============================================================
// 场景 D: Fastify Schema 注册（zod-to-json-schema 集成）
// ============================================================
import { zodToJsonSchema } from 'zod-to-json-schema';

// 为 Fastify 生成 OpenAPI 兼容的 JSON Schema
const employeeListSchema = {
  querystring: zodToJsonSchema(Org.Employees.ListParamsSchema, { target: 'openApi3' }),
  response: {
    200: zodToJsonSchema(
      Common.ApiResponse(Common.PaginatedData(Org.Employees.ListItemSchema)),
      { target: 'openApi3' },
    ),
  },
};
