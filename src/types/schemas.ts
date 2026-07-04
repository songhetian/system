// ============================================================
// src/types/schemas.ts — 全平台 Zod 校验 + TS 类型（单文件版）
//
// 设计原则：
//   1. Zod Schema 为唯一信任源，TS 类型通过 z.infer 推导
//   2. 每个模块一个 namespace，实体在子 namespace 中（如 Org.Employees）
//   3. 命名约定：XxxSchema 为 Zod 对象 / Xxx 为 z.infer 类型
//   4. 查询参数（QueryString）使用 z.coerce 转换字符串
//   5. 日期统一 YYYY-MM-DD 字符串，时间戳统一 ISO 8601
//   6. 通过 .extend() / .merge() / .omit() 组合复用，拒绝拷贝
// ============================================================

import { z } from 'zod';

// ============================================================
// 1. COMMON — 信封 / 分页 / 工具（全模块复用）
// ============================================================
export namespace Common {
  /** 审计时间戳（所有实体附加） */
  export const AuditMixin = z.object({
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  });

  /** 软删除标记（核心实体附加） */
  export const SoftDeleteMixin = z.object({
    deletedAt: z.string().datetime().nullable(),
  });

  /** 分页查询参数（QueryString → 需 coerce） */
  export const PaginationParams = z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  });
  export type PaginationParams = z.infer<typeof PaginationParams>;

  /** 排序参数 */
  export const SortParams = z.object({
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  });
  export type SortParams = z.infer<typeof SortParams>;

  /** YYYY-MM-DD 日期字符串 */
  export const DateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '格式须为 YYYY-MM-DD');

  /** HH:mm 时间字符串 */
  export const TimeString = z.string().regex(/^\d{2}:\d{2}$/, '格式须为 HH:mm');

  /** 路径参数 ID */
  export const IdParam = z.coerce.number().int().positive();

  /** 敏感字段掩码字面量 */
  export const SENSITIVE_MASK = '****' as const;
  export const SensitiveMask = z.literal(SENSITIVE_MASK);

  /** 泛型 API 响应信封（schema 生成器） */
  export const ApiResponse = <T extends z.ZodTypeAny>(dataSchema: T) =>
    z.object({
      code: z.number().int(),
      data: dataSchema,
      message: z.string(),
    });
  export type ApiResponse<T> = { code: number; data: T; message: string };

  /** 泛型分页数据（schema 生成器） */
  export const PaginatedData = <T extends z.ZodTypeAny>(itemSchema: T) =>
    z.object({
      list: z.array(itemSchema),
      total: z.number().int().nonnegative(),
      page: z.number().int().positive(),
      pageSize: z.number().int().positive(),
    });
  export type PaginatedData<T> = { list: T[]; total: number; page: number; pageSize: number };
}

// ============================================================
// 2. AUTH — 认证与用户
// ============================================================
export namespace Auth {
  export const LoginInputSchema = z.object({
    username: z.string().min(1).max(50),
    password: z.string().min(1).max(100),
  });
  export type LoginInput = z.infer<typeof LoginInputSchema>;

  export const UserBriefSchema = z.object({
    id: z.number().int().positive(),
    username: z.string(),
    employeeId: z.number().int().positive(),
  });

  export const LoginOutputSchema = z.object({
    accessToken: z.string(),
    user: UserBriefSchema,
  });
  export type LoginOutput = z.infer<typeof LoginOutputSchema>;

  export const MeResponseSchema = UserBriefSchema.extend({
    roles: z.array(z.string()),
    permissions: z.array(z.string()),
  });
  export type MeResponse = z.infer<typeof MeResponseSchema>;
}

// ============================================================
// 3. ORG — 组织架构与人员管理
// ============================================================
export namespace Org {
  // ---- 部门 ----
  export namespace Departments {
    export const CreateSchema = z.object({
      name: z.string().min(1).max(50),
      parentId: z.number().int().positive().nullable(),
      sortOrder: z.number().int().default(0),
    });
    export type Create = z.infer<typeof CreateSchema>;

    export const UpdateSchema = CreateSchema.partial();
    export type Update = z.infer<typeof UpdateSchema>;

    export const ListParamsSchema = Common.PaginationParams.extend({
      parentId: z.coerce.number().int().positive().optional(),
      keyword: z.string().optional(),
    });
    export type ListParams = z.infer<typeof ListParamsSchema>;

    export const EntitySchema = z.object({
      id: z.number().int().positive(),
      name: z.string(),
      parentId: z.number().int().positive().nullable(),
      sortOrder: z.number().int(),
    })
      .merge(Common.AuditMixin)
      .merge(Common.SoftDeleteMixin);
    export type Entity = z.infer<typeof EntitySchema>;

    /** 组织树节点（递归） */
    export const TreeNodeSchema: z.ZodType<{
      id: number; name: string; parentId: number | null; sortOrder: number;
      createdAt: string; updatedAt: string; deletedAt: string | null;
      children?: TreeNode[];
    }> = EntitySchema.extend({
      children: z.lazy(() => z.array(TreeNodeSchema)).optional(),
    }) as any;
    export type TreeNode = z.infer<typeof TreeNodeSchema>;
  }

  // ---- 岗位 ----
  export namespace Positions {
    export const CreateSchema = z.object({
      name: z.string().min(1).max(50),
      rankId: z.number().int().positive(),
      headcount: z.number().int().positive(),
    });
    export type Create = z.infer<typeof CreateSchema>;

    export const UpdateSchema = CreateSchema.partial();
    export type Update = z.infer<typeof UpdateSchema>;

    export const EntitySchema = z.object({
      id: z.number().int().positive(),
      name: z.string(),
      departmentId: z.number().int().positive(),
      rankId: z.number().int().positive(),
      rankName: z.string(),
      headcount: z.number().int(),
    })
      .merge(Common.AuditMixin)
      .merge(Common.SoftDeleteMixin);
    export type Entity = z.infer<typeof EntitySchema>;
  }

  // ---- 职级 ----
  export namespace Ranks {
    export const CreateSchema = z.object({
      name: z.string().min(1).max(30),
      level: z.number().int().positive(),
    });
    export type Create = z.infer<typeof CreateSchema>;

    export const UpdateSchema = CreateSchema.partial();
    export type Update = z.infer<typeof UpdateSchema>;

    export const EntitySchema = z.object({
      id: z.number().int().positive(),
      name: z.string(),
      level: z.number().int(),
    }).merge(Common.AuditMixin);
    export type Entity = z.infer<typeof EntitySchema>;
  }

  // ---- 员工 ----
  export namespace Employees {
    export const StatusEnum = z.enum(['ACTIVE', 'PROBATION', 'RESIGNED']);
    export type Status = z.infer<typeof StatusEnum>;

    export const CreateSchema = z.object({
      name: z.string().min(1).max(30),
      employeeNo: z.string().min(1).max(20),
      phone: z.string().regex(/^1[3-9]\d{9}$/, '手机号格式错误'),
      email: z.string().email().optional(),
      idCard: z.string().length(18).regex(/^\d{17}[\dXx]$/, '身份证格式错误'),
      hireDate: Common.DateString,
      departmentId: z.number().int().positive(),
      positionIds: z.array(z.number().int().positive()).min(1),
    });
    export type Create = z.infer<typeof CreateSchema>;

    export const UpdateSchema = CreateSchema.partial();
    export type Update = z.infer<typeof UpdateSchema>;

    export const ListParamsSchema = Common.PaginationParams.extend({
      departmentId: z.coerce.number().int().positive().optional(),
      positionId: z.coerce.number().int().positive().optional(),
      status: StatusEnum.optional(),
      keyword: z.string().optional(),
    });
    export type ListParams = z.infer<typeof ListParamsSchema>;

    /** 基础实体字段（不含敏感信息） */
    const BaseEntityFields = {
      id: z.number().int().positive(),
      name: z.string(),
      employeeNo: z.string(),
      phone: z.string(),
      email: z.string().nullable(),
      hireDate: z.string(),
      departmentId: z.number().int().positive(),
      departmentName: z.string(),
      positionIds: z.array(z.number().int().positive()),
      positionNames: z.array(z.string()),
      status: StatusEnum,
    };

    export const EntityBaseSchema = z.object(BaseEntityFields)
      .merge(Common.AuditMixin)
      .merge(Common.SoftDeleteMixin);

    /** 列表项（敏感字段脱敏） */
    export const ListItemSchema = EntityBaseSchema.extend({
      idCard: Common.SensitiveMask,
      salary: Common.SensitiveMask,
    });
    export type ListItem = z.infer<typeof ListItemSchema>;

    /** 详情（全字段，需权限） */
    export const FullDetailSchema = EntityBaseSchema.extend({
      idCard: z.string(),
      salary: z.number().nonnegative(),
      bankAccount: z.string().nullable(),
      emergencyContact: z.string().nullable(),
      emergencyPhone: z.string().nullable(),
    });
    export type FullDetail = z.infer<typeof FullDetailSchema>;

    /** 转正 */
    export const RegularizeSchema = z.object({
      regularizeDate: Common.DateString,
    });
    export type Regularize = z.infer<typeof RegularizeSchema>;

    /** 离职 */
    export const ResignSchema = z.object({
      resignDate: Common.DateString,
      reason: z.string().min(1).max(500),
    });
    export type Resign = z.infer<typeof ResignSchema>;

    /** 批量导入结果 */
    export const BatchImportResultSchema = z.object({
      successCount: z.number().int().nonnegative(),
      failCount: z.number().int().nonnegative(),
      errorFileUrl: z.string().nullable(),
    });
    export type BatchImportResult = z.infer<typeof BatchImportResultSchema>;
  }
}

// ============================================================
// 4. PERMISSIONS — 权限系统
// ============================================================
export namespace Permissions {
  export namespace Roles {
    export const CreateSchema = z.object({
      name: z.string().min(1).max(30),
      code: z.string().min(1).max(50).regex(/^[a-z_:]+$/, '仅小写+下划线+冒号'),
      description: z.string().max(200).optional(),
    });
    export type Create = z.infer<typeof CreateSchema>;

    export const UpdateSchema = CreateSchema.partial();
    export type Update = z.infer<typeof UpdateSchema>;

    export const EntitySchema = z.object({
      id: z.number().int().positive(),
      name: z.string(),
      code: z.string(),
      description: z.string().nullable(),
    })
      .merge(Common.AuditMixin)
      .merge(Common.SoftDeleteMixin);
    export type Entity = z.infer<typeof EntitySchema>;

    export const AssignPermissionsSchema = z.object({
      permissionIds: z.array(z.number().int().positive()),
    });
    export type AssignPermissions = z.infer<typeof AssignPermissionsSchema>;
  }

  export namespace Permissions_ {
    export const EntitySchema = z.object({
      id: z.number().int().positive(),
      code: z.string(),
      name: z.string(),
      module: z.string(),
    });
    export type Entity = z.infer<typeof EntitySchema>;
  }

  export namespace UserRoles {
    export const AssignSchema = z.object({
      roleIds: z.array(z.number().int().positive()),
    });
    export type Assign = z.infer<typeof AssignSchema>;
  }
}

// ============================================================
// 5. SCHEDULES — 智能排班
// ============================================================
export namespace Schedules {
  // ---- 班次模板 ----
  export namespace ShiftTemplates {
    export const CreateSchema = z.object({
      name: z.string().min(1).max(30),
      startTime: Common.TimeString,
      endTime: Common.TimeString,
      color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, '须为 hex 颜色'),
      description: z.string().max(200).optional(),
    });
    export type Create = z.infer<typeof CreateSchema>;

    export const UpdateSchema = CreateSchema.partial();
    export type Update = z.infer<typeof UpdateSchema>;

    export const EntitySchema = z.object({
      id: z.number().int().positive(),
      name: z.string(),
      startTime: z.string(),
      endTime: z.string(),
      color: z.string(),
      description: z.string().nullable(),
    }).merge(Common.AuditMixin);
    export type Entity = z.infer<typeof EntitySchema>;
  }

  // ---- 轮班规则 ----
  export namespace RotationRules {
    export const PatternItemSchema = z.object({
      dayOffset: z.number().int().nonnegative(),
      shiftTemplateId: z.number().int().positive(),
    });

    export const CreateSchema = z.object({
      name: z.string().min(1).max(50),
      pattern: z.array(PatternItemSchema).min(1),
      cycleDays: z.number().int().positive(),
    }).refine(d => d.pattern.length === d.cycleDays, {
      message: 'cycleDays 须等于 pattern 数组长度',
    });
    export type Create = z.infer<typeof CreateSchema>;

    export const UpdateSchema = CreateSchema;
    export type Update = z.infer<typeof UpdateSchema>;

    export const EntitySchema = z.object({
      id: z.number().int().positive(),
      name: z.string(),
      pattern: z.array(PatternItemSchema),
      cycleDays: z.number().int(),
    }).merge(Common.AuditMixin);
    export type Entity = z.infer<typeof EntitySchema>;
  }

  // ---- 排班记录 ----
  export namespace Records {
    export const ListParamsSchema = Common.PaginationParams.extend({
      startDate: Common.DateString,
      endDate: Common.DateString,
      departmentId: z.coerce.number().int().positive().optional(),
      employeeId: z.coerce.number().int().positive().optional(),
    });
    export type ListParams = z.infer<typeof ListParamsSchema>;

    export const GenerateSchema = z.object({
      startDate: Common.DateString,
      endDate: Common.DateString,
      departmentId: z.number().int().positive(),
      rotationRuleId: z.number().int().positive(),
    });
    export type Generate = z.infer<typeof GenerateSchema>;

    export const GenerateResultSchema = z.object({
      totalAssigned: z.number().int().nonnegative(),
      conflicting: z.number().int().nonnegative(),
      skippedLeave: z.number().int().nonnegative(),
      conflicts: z.array(z.object({
        employeeId: z.number().int(),
        employeeName: z.string(),
        date: z.string(),
        reason: z.string(),
      })),
    });
    export type GenerateResult = z.infer<typeof GenerateResultSchema>;

    export const UpdateSchema = z.object({
      shiftTemplateId: z.number().int().positive(),
      date: Common.DateString,
    });
    export type Update = z.infer<typeof UpdateSchema>;

    export const EntitySchema = z.object({
      id: z.number().int().positive(),
      employeeId: z.number().int(),
      employeeName: z.string(),
      shiftTemplateId: z.number().int(),
      shiftName: z.string(),
      startTime: z.string(),
      endTime: z.string(),
      color: z.string(),
      date: z.string(),
      isLeaveDay: z.boolean(),
    }).merge(Common.AuditMixin);
    export type Entity = z.infer<typeof EntitySchema>;

    /** 排班冲突 */
    export const ConflictSchema = z.object({
      employeeId: z.number().int(),
      employeeName: z.string(),
      date: z.string(),
      conflicts: z.array(z.string()),
    });
    export type Conflict = z.infer<typeof ConflictSchema>;
  }
}

// ============================================================
// 6. ATTENDANCE — 考勤工时
// ============================================================
export namespace Attendance {
  export namespace Records {
    export const ClockTypeEnum = z.enum(['IN', 'OUT']);

    export const ListParamsSchema = Common.PaginationParams.extend({
      employeeId: z.coerce.number().int().positive().optional(),
      dateFrom: Common.DateString.optional(),
      dateTo: Common.DateString.optional(),
      departmentId: z.coerce.number().int().positive().optional(),
    });
    export type ListParams = z.infer<typeof ListParamsSchema>;

    export const ClockSchema = z.object({
      employeeId: z.number().int().positive(),
      type: ClockTypeEnum,
      timestamp: z.string().datetime(),
    });
    export type Clock = z.infer<typeof ClockSchema>;

    export const EntitySchema = z.object({
      id: z.number().int().positive(),
      employeeId: z.number().int(),
      employeeName: z.string(),
      type: ClockTypeEnum,
      timestamp: z.string().datetime(),
      isLate: z.boolean(),
      isEarly: z.boolean(),
      lateMinutes: z.number().int().nonnegative(),
      earlyMinutes: z.number().int().nonnegative(),
      shiftId: z.number().int().positive().nullable(),
    });
    export type Entity = z.infer<typeof EntitySchema>;
  }

  export namespace Summaries {
    export const ListParamsSchema = Common.PaginationParams.extend({
      year: z.coerce.number().int(),
      month: z.coerce.number().int().min(1).max(12),
      departmentId: z.coerce.number().int().positive().optional(),
      employeeId: z.coerce.number().int().positive().optional(),
    });
    export type ListParams = z.infer<typeof ListParamsSchema>;

    export const GenerateSchema = z.object({
      year: z.number().int(),
      month: z.number().int().min(1).max(12),
      departmentId: z.number().int().positive().nullable(),
    });
    export type Generate = z.infer<typeof GenerateSchema>;

    export const EntitySchema = z.object({
      id: z.number().int().positive(),
      year: z.number().int(),
      month: z.number().int(),
      employeeId: z.number().int(),
      employeeName: z.string(),
      departmentName: z.string(),
      shouldWorkDays: z.number().int().nonnegative(),
      actualWorkDays: z.number().int().nonnegative(),
      lateCount: z.number().int().nonnegative(),
      earlyCount: z.number().int().nonnegative(),
      overtimeHours: z.number().nonnegative(),
      absentDays: z.number().nonnegative(),
      leaveDays: z.number().nonnegative(),
      locked: z.boolean(),
    }).merge(Common.AuditMixin);
    export type Entity = z.infer<typeof EntitySchema>;
  }
}

// ============================================================
// 7. LEAVE — 假期管理
// ============================================================
export namespace Leave {
  export namespace Quotas {
    export const ListParamsSchema = Common.PaginationParams.extend({
      year: z.coerce.number().int(),
      employeeId: z.coerce.number().int().positive().optional(),
      departmentId: z.coerce.number().int().positive().optional(),
    });
    export type ListParams = z.infer<typeof ListParamsSchema>;

    export const InitYearSchema = z.object({ year: z.number().int() });
    export type InitYear = z.infer<typeof InitYearSchema>;

    export const EntitySchema = z.object({
      id: z.number().int().positive(),
      year: z.number().int(),
      employeeId: z.number().int(),
      employeeName: z.string(),
      annualBalance: z.number().nonnegative(),
      annualUsed: z.number().nonnegative(),
      sickUsed: z.number().nonnegative(),
      personalUsed: z.number().nonnegative(),
      compensatoryBalance: z.number().nonnegative(),
      compensatoryUsed: z.number().nonnegative(),
    }).merge(Common.AuditMixin);
    export type Entity = z.infer<typeof EntitySchema>;
  }

  export namespace Requests {
    export const TypeEnum = z.enum(['ANNUAL', 'SICK', 'PERSONAL', 'COMPENSATORY', 'MARRIAGE', 'MATERNITY']);
    export const TimeHalfEnum = z.enum(['AM', 'PM', 'ALL']);
    export const StatusEnum = z.enum(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']);

    export const ListParamsSchema = Common.PaginationParams.extend({
      status: StatusEnum.optional(),
      employeeId: z.coerce.number().int().positive().optional(),
      departmentId: z.coerce.number().int().positive().optional(),
      dateFrom: Common.DateString.optional(),
      dateTo: Common.DateString.optional(),
    });
    export type ListParams = z.infer<typeof ListParamsSchema>;

    export const CreateSchema = z.object({
      employeeId: z.number().int().positive(),
      type: TypeEnum,
      startDate: Common.DateString,
      endDate: Common.DateString,
      startTime: TimeHalfEnum,
      endTime: TimeHalfEnum,
      reason: z.string().min(1).max(500),
      attachments: z.array(z.string().url()).default([]),
    }).refine(d => new Date(d.endDate) >= new Date(d.startDate), {
      message: 'endDate 不能早于 startDate',
    });
    export type Create = z.infer<typeof CreateSchema>;

    export const UpdateSchema = CreateSchema.partial();
    export type Update = z.infer<typeof UpdateSchema>;

    export const EntitySchema = z.object({
      id: z.number().int().positive(),
      employeeId: z.number().int(),
      employeeName: z.string(),
      type: TypeEnum,
      startDate: z.string(),
      endDate: z.string(),
      startTime: TimeHalfEnum,
      endTime: TimeHalfEnum,
      days: z.number().positive(),
      reason: z.string(),
      attachments: z.array(z.string()),
      status: StatusEnum,
      workflowInstanceId: z.number().int().positive().nullable(),
    }).merge(Common.AuditMixin);
    export type Entity = z.infer<typeof EntitySchema>;

    export const ApprovalChainSchema = z.object({
      instanceId: z.number().int(),
      status: z.string(),
      nodes: z.array(z.object({
        id: z.number().int(),
        type: z.string(),
        label: z.string(),
        assigneeName: z.string().nullable(),
        status: z.string(),
        comment: z.string().nullable(),
        operatedAt: z.string().datetime().nullable(),
      })),
    });
    export type ApprovalChain = z.infer<typeof ApprovalChainSchema>;
  }
}

// ============================================================
// 8. SALARY — 薪资核算（含二级密码安全）
// ============================================================
export namespace Salary {
  // ---- 二级密码 ----
  export namespace Password {
    export const VerifySchema = z.object({
      password: z.string().min(1).max(100),
    });
    export type Verify = z.infer<typeof VerifySchema>;

    export const VerifyResultSchema = z.object({
      salaryToken: z.string(),
      expiresIn: z.number().int(),
    });
    export type VerifyResult = z.infer<typeof VerifyResultSchema>;

    export const SetPasswordSchema = z.object({
      oldPassword: z.string().max(100),
      newPassword: z.string().min(6).max(100),
    });
    export type SetPassword = z.infer<typeof SetPasswordSchema>;
  }

  // ---- 薪资结构 ----
  export namespace Structures {
    export const ItemTypeEnum = z.enum(['BASE', 'PERFORMANCE', 'SUBSIDY', 'INSURANCE', 'TAX', 'DEDUCTION']);

    export const ItemSchema = z.object({
      type: ItemTypeEnum,
      name: z.string().min(1).max(30),
      formula: z.string().min(1).max(200),
      sortOrder: z.number().int().default(0),
    });
    export type Item = z.infer<typeof ItemSchema>;

    export const CreateSchema = z.object({
      name: z.string().min(1).max(50),
      items: z.array(ItemSchema).min(1),
    });
    export type Create = z.infer<typeof CreateSchema>;

    export const UpdateSchema = CreateSchema;
    export type Update = z.infer<typeof UpdateSchema>;

    export const EntitySchema = z.object({
      id: z.number().int().positive(),
      name: z.string(),
      items: z.array(ItemSchema),
    }).merge(Common.AuditMixin);
    export type Entity = z.infer<typeof EntitySchema>;

    export const AssignSchema = z.object({
      employeeIds: z.array(z.number().int().positive()).min(1),
    });
    export type Assign = z.infer<typeof AssignSchema>;
  }

  // ---- 工资条 ----
  export namespace Payslips {
    export const ListParamsSchema = Common.PaginationParams.extend({
      year: z.coerce.number().int(),
      month: z.coerce.number().int().min(1).max(12),
      departmentId: z.coerce.number().int().positive().optional(),
      employeeId: z.coerce.number().int().positive().optional(),
    });
    export type ListParams = z.infer<typeof ListParamsSchema>;

    export const GenerateSchema = z.object({
      year: z.number().int(),
      month: z.number().int().min(1).max(12),
      departmentId: z.number().int().positive().nullable(),
    });
    export type Generate = z.infer<typeof GenerateSchema>;

    export const PayslipItemSchema = z.object({
      type: Structures.ItemTypeEnum,
      name: z.string(),
      amount: z.number(),
      sortOrder: z.number().int(),
    });

    /** 列表项（金额脱敏） */
    export const ListItemSchema = z.object({
      id: z.number().int().positive(),
      employeeId: z.number().int(),
      employeeName: z.string(),
      departmentName: z.string(),
      year: z.number().int(),
      month: z.number().int(),
      grossPay: Common.SensitiveMask,
      netPay: Common.SensitiveMask,
      status: z.enum(['DRAFT', 'FINAL']),
    }).merge(Common.AuditMixin);
    export type ListItem = z.infer<typeof ListItemSchema>;

    /** 详细信息（全字段，需 X-Salary-Token） */
    export const FullDetailSchema = z.object({
      id: z.number().int().positive(),
      employeeId: z.number().int(),
      employeeName: z.string(),
      departmentName: z.string(),
      year: z.number().int(),
      month: z.number().int(),
      items: z.array(PayslipItemSchema),
      grossPay: z.number(),
      deductions: z.number(),
      netPay: z.number(),
      attendanceSummary: z.object({
        shouldWorkDays: z.number(),
        actualWorkDays: z.number(),
        lateCount: z.number(),
        overtimeHours: z.number(),
      }).optional(),
      status: z.enum(['DRAFT', 'FINAL']),
    }).merge(Common.AuditMixin);
    export type FullDetail = z.infer<typeof FullDetailSchema>;
  }

  // ---- 审计日志 ----
  export namespace Audit {
    export const ActionEnum = z.enum([
      'VIEW_SALARY', 'VIEW_PAYSLIP', 'EXPORT_SALARY',
      'VERIFY_PASSWORD_SUCCESS', 'VERIFY_PASSWORD_FAIL',
    ]);

    export const ListParamsSchema = Common.PaginationParams.extend({
      userId: z.coerce.number().int().positive().optional(),
      action: ActionEnum.optional(),
      dateFrom: Common.DateString.optional(),
      dateTo: Common.DateString.optional(),
    });
    export type ListParams = z.infer<typeof ListParamsSchema>;

    export const EntitySchema = z.object({
      id: z.number().int().positive(),
      userId: z.number().int(),
      username: z.string(),
      action: ActionEnum,
      targetType: z.string().optional(),
      targetId: z.number().int().positive().optional(),
      ip: z.string(),
      userAgent: z.string().optional(),
    }).merge(Common.AuditMixin);
    export type Entity = z.infer<typeof EntitySchema>;
  }
}

// ============================================================
// 9. EXPENSE — 报销管理
// ============================================================
export namespace Expense {
  export const TypeEnum = z.enum(['TRAVEL', 'OFFICE', 'ENTERTAINMENT', 'OTHER']);
  export const StatusEnum = z.enum(['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'PAID']);

  export namespace Claims {
    export const ListParamsSchema = Common.PaginationParams.extend({
      status: StatusEnum.optional(),
      employeeId: z.coerce.number().int().positive().optional(),
      departmentId: z.coerce.number().int().positive().optional(),
      dateFrom: Common.DateString.optional(),
      dateTo: Common.DateString.optional(),
    });
    export type ListParams = z.infer<typeof ListParamsSchema>;

    export const CreateSchema = z.object({
      title: z.string().min(1).max(100),
      expenseType: TypeEnum,
      amount: z.number().positive(),
      description: z.string().max(500).optional(),
      attachments: z.array(z.string().url()).default([]),
    });
    export type Create = z.infer<typeof CreateSchema>;

    export const UpdateSchema = CreateSchema.partial();
    export type Update = z.infer<typeof UpdateSchema>;

    export const EntitySchema = z.object({
      id: z.number().int().positive(),
      employeeId: z.number().int(),
      employeeName: z.string(),
      title: z.string(),
      expenseType: TypeEnum,
      amount: z.number(),
      description: z.string().nullable(),
      attachments: z.array(z.string()),
      status: StatusEnum,
      workflowInstanceId: z.number().int().positive().nullable(),
    }).merge(Common.AuditMixin);
    export type Entity = z.infer<typeof EntitySchema>;
  }
}

// ============================================================
// 10. TRAINING — 培训管理
// ============================================================
export namespace Training {
  export namespace Courses {
    export const TypeEnum = z.enum(['ONLINE', 'OFFLINE']);
    export const StatusEnum = z.enum(['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED']);

    export const ListParamsSchema = Common.PaginationParams.extend({
      status: StatusEnum.optional(),
      keyword: z.string().optional(),
    });
    export type ListParams = z.infer<typeof ListParamsSchema>;

    export const CreateSchema = z.object({
      name: z.string().min(1).max(100),
      description: z.string().max(1000).optional(),
      startDate: Common.DateString,
      endDate: Common.DateString,
      type: TypeEnum,
      location: z.string().max(200),
      trainer: z.string().max(50),
      maxAttendees: z.number().int().positive().nullable(),
    });
    export type Create = z.infer<typeof CreateSchema>;

    export const UpdateSchema = CreateSchema.partial();
    export type Update = z.infer<typeof UpdateSchema>;

    export const EntitySchema = z.object({
      id: z.number().int().positive(),
      name: z.string(),
      description: z.string().nullable(),
      startDate: z.string(),
      endDate: z.string(),
      type: TypeEnum,
      location: z.string(),
      trainer: z.string(),
      maxAttendees: z.number().int().nullable(),
      currentAttendees: z.number().int(),
      status: StatusEnum,
    }).merge(Common.AuditMixin);
    export type Entity = z.infer<typeof EntitySchema>;

    export const EnrollSchema = z.object({
      employeeIds: z.array(z.number().int().positive()).min(1),
    });
    export type Enroll = z.infer<typeof EnrollSchema>;

    export const CompleteSchema = z.object({
      employeeId: z.number().int().positive(),
      score: z.number().min(0).max(100).nullable(),
    });
    export type Complete = z.infer<typeof CompleteSchema>;
  }

  export namespace Records {
    export const EntitySchema = z.object({
      id: z.number().int().positive(),
      employeeId: z.number().int(),
      employeeName: z.string(),
      courseId: z.number().int(),
      courseName: z.string(),
      score: z.number().nullable(),
      completedAt: z.string().datetime().nullable(),
    }).merge(Common.AuditMixin);
    export type Entity = z.infer<typeof EntitySchema>;
  }
}

// ============================================================
// 11. KB — 知识库
// ============================================================
export namespace Kb {
  export const CategoryEnum = z.enum(['POLICY', 'COURSEWARE', 'FORM', 'CONTRACT', 'ANNOUNCEMENT']);

  export namespace Documents {
    export const ListParamsSchema = Common.PaginationParams.extend({
      category: CategoryEnum.optional(),
      keyword: z.string().optional(),
      uploadDateFrom: Common.DateString.optional(),
      uploadDateTo: Common.DateString.optional(),
    });
    export type ListParams = z.infer<typeof ListParamsSchema>;

    export const EntitySchema = z.object({
      id: z.number().int().positive(),
      title: z.string(),
      category: CategoryEnum,
      fileName: z.string(),
      fileSize: z.number().int(),
      url: z.string(),
      isConfidential: z.boolean(),
      uploadBy: z.number().int(),
      uploadByName: z.string(),
      previewUrl: z.string().nullable(),
    }).merge(Common.AuditMixin);
    export type Entity = z.infer<typeof EntitySchema>;
  }
}

// ============================================================
// 12. WORKFLOW — 审批流引擎（最复杂模块）
// ============================================================
export namespace Workflow {
  // 基础枚举
  export const NodeTypeEnum = z.enum(['START', 'APPROVAL', 'CONDITION', 'CC', 'SUB_PROCESS', 'END']);
  export const AssigneeTypeEnum = z.enum(['ROLE', 'USER', 'DEPARTMENT_LEADER']);
  export const SignTypeEnum = z.enum(['OR', 'AND']);
  export const TimeoutActionEnum = z.enum(['PASS', 'REJECT', 'NOTIFY']);
  export const NodeStatusEnum = z.enum(['PENDING', 'IN_PROGRESS', 'APPROVED', 'REJECTED', 'CANCELLED', 'SKIPPED']);
  export const InstanceStatusEnum = z.enum(['PENDING', 'IN_PROGRESS', 'APPROVED', 'REJECTED', 'CANCELLED']);
  export const SourceTypeEnum = z.enum(['LEAVE', 'EXPENSE', 'OTHER']);

  // ---- 流程模板 ----
  export namespace Templates {
    export const ComparisonOperatorEnum = z.enum(['EQ', 'NE', 'GT', 'GTE', 'LT', 'LTE', 'IN', 'CONTAINS']);

    export const ConditionSchema = z.object({
      field: z.string().min(1),
      operator: ComparisonOperatorEnum,
      value: z.string(),
    });

    /** 条件分支（CONDITION 节点用） */
    export const ConditionBranchSchema = z.object({
      label: z.string().min(1).max(50),
      conditions: z.array(ConditionSchema).min(1),
    });

    /** 位置坐标 */
    export const PositionSchema = z.object({ x: z.number(), y: z.number() });

    /** 模板节点（辨析联合类型：按 type 字段区分） */
    export const NodeSchema = z.discriminatedUnion('type', [
      z.object({ type: z.literal('START'),   label: z.string().min(1).max(50), position: PositionSchema }),
      z.object({ type: z.literal('END'),     label: z.string().min(1).max(50), position: PositionSchema }),
      z.object({
        type: z.literal('APPROVAL'),
        label: z.string().min(1).max(50),
        assigneeType: AssigneeTypeEnum,
        assigneeId: z.number().int().positive().nullable(),
        signType: SignTypeEnum,
        timeoutHours: z.number().positive().nullable(),
        timeoutAction: TimeoutActionEnum,
        position: PositionSchema,
      }),
      z.object({
        type: z.literal('CONDITION'),
        label: z.string().min(1).max(50),
        branches: z.array(ConditionBranchSchema).min(1),
        position: PositionSchema,
      }),
      z.object({
        type: z.literal('CC'),
        label: z.string().min(1).max(50),
        assigneeType: AssigneeTypeEnum,
        assigneeId: z.number().int().positive().nullable(),
        position: PositionSchema,
      }),
      z.object({
        type: z.literal('SUB_PROCESS'),
        label: z.string().min(1).max(50),
        subTemplateId: z.number().int().positive(),
        position: PositionSchema,
      }),
    ]);
    export type Node = z.infer<typeof NodeSchema>;

    export const EdgeSchema = z.object({
      sourceNodeIndex: z.number().int().nonnegative(),
      targetNodeIndex: z.number().int().nonnegative(),
      label: z.string().max(20).optional(),
    });
    export type Edge = z.infer<typeof EdgeSchema>;

    export const CreateSchema = z.object({
      name: z.string().min(1).max(100),
      description: z.string().max(500).optional(),
      nodes: z.array(NodeSchema).min(2),
      edges: z.array(EdgeSchema).min(1),
    });
    export type Create = z.infer<typeof CreateSchema>;

    export const UpdateSchema = CreateSchema;
    export type Update = z.infer<typeof UpdateSchema>;

    export const EntitySchema = z.object({
      id: z.number().int().positive(),
      name: z.string(),
      description: z.string().nullable(),
      nodes: z.array(NodeSchema),
      edges: z.array(EdgeSchema),
      version: z.number().int().positive(),
      isDeployed: z.boolean(),
    })
      .merge(Common.AuditMixin)
      .merge(Common.SoftDeleteMixin);
    export type Entity = z.infer<typeof EntitySchema>;
  }

  // ---- 审批实例 ----
  export namespace Instances {
    export const CreateSchema = z.object({
      templateId: z.number().int().positive(),
      subject: z.string().min(1).max(200),
      formData: z.record(z.unknown()),
      sourceType: SourceTypeEnum,
      sourceId: z.number().int().positive(),
    });
    export type Create = z.infer<typeof CreateSchema>;

    export const ListParamsSchema = Common.PaginationParams.extend({
      status: InstanceStatusEnum.optional(),
      applicantId: z.coerce.number().int().positive().optional(),
      templateId: z.coerce.number().int().positive().optional(),
      dateFrom: Common.DateString.optional(),
      dateTo: Common.DateString.optional(),
    });
    export type ListParams = z.infer<typeof ListParamsSchema>;

    /** 实例节点（运行时状态） */
    export const InstanceNodeSchema = z.object({
      id: z.number().int().positive(),
      instanceId: z.number().int(),
      type: NodeTypeEnum,
      label: z.string(),
      assigneeType: AssigneeTypeEnum.nullable(),
      assigneeId: z.number().int().positive().nullable(),
      assigneeName: z.string().nullable(),
      signType: SignTypeEnum.nullable(),
      status: NodeStatusEnum,
      comment: z.string().nullable(),
      operatedBy: z.number().int().positive().nullable(),
      operatedByName: z.string().nullable(),
      operatedAt: z.string().datetime().nullable(),
      sortOrder: z.number().int(),
    });
    export type InstanceNode = z.infer<typeof InstanceNodeSchema>;

    export const EntitySchema = z.object({
      id: z.number().int().positive(),
      templateId: z.number().int(),
      templateName: z.string(),
      subject: z.string(),
      formData: z.record(z.unknown()),
      sourceType: SourceTypeEnum,
      sourceId: z.number().int(),
      applicantId: z.number().int(),
      applicantName: z.string(),
      status: InstanceStatusEnum,
      currentNodeIndex: z.number().int(),
      nodes: z.array(InstanceNodeSchema),
      completedAt: z.string().datetime().nullable(),
    }).merge(Common.AuditMixin);
    export type Entity = z.infer<typeof EntitySchema>;

    /** 列表项（去掉 nodes/formData 减负） */
    export const ListItemSchema = EntitySchema.omit({ nodes: true, formData: true });
    export type ListItem = z.infer<typeof ListItemSchema>;

    // 操作 Action
    export const ApproveSchema = z.object({ comment: z.string().max(500).optional() });
    export type Approve = z.infer<typeof ApproveSchema>;

    export const RejectSchema = z.object({ reason: z.string().min(1).max(500) });
    export type Reject = z.infer<typeof RejectSchema>;

    export const DelegateSchema = z.object({
      toUserId: z.number().int().positive(),
      reason: z.string().max(200).optional(),
    });
    export type Delegate = z.infer<typeof DelegateSchema>;

    export const AddSignerSchema = z.object({ userId: z.number().int().positive() });
    export type AddSigner = z.infer<typeof AddSignerSchema>;
  }
}

// ============================================================
// 13. MESSAGES — 消息与公告
// ============================================================
export namespace Messages {
  export namespace Notifications {
    export const TypeEnum = z.enum(['TODO', 'NOTIFICATION', 'SYSTEM']);

    export const ListParamsSchema = Common.PaginationParams.extend({
      read: z.coerce.boolean().optional(),
      type: TypeEnum.optional(),
    });
    export type ListParams = z.infer<typeof ListParamsSchema>;

    export const EntitySchema = z.object({
      id: z.number().int().positive(),
      userId: z.number().int(),
      type: TypeEnum,
      title: z.string(),
      content: z.string(),
      read: z.boolean(),
      link: z.string().nullable(),
      sourceType: z.string().nullable(),
      sourceId: z.number().int().positive().nullable(),
    }).merge(Common.AuditMixin);
    export type Entity = z.infer<typeof EntitySchema>;
  }

  export namespace Announcements {
    export const TargetTypeEnum = z.enum(['ALL', 'DEPARTMENT', 'ROLE']);
    export const StatusEnum = z.enum(['DRAFT', 'PUBLISHED']);

    export const CreateSchema = z.object({
      title: z.string().min(1).max(200),
      content: z.string().min(1),
      targetType: TargetTypeEnum,
      targetIds: z.array(z.number().int().positive()).default([]),
      attachments: z.array(z.string().url()).default([]),
    });
    export type Create = z.infer<typeof CreateSchema>;

    export const UpdateSchema = CreateSchema.partial();
    export type Update = z.infer<typeof UpdateSchema>;

    export const ListParamsSchema = Common.PaginationParams.extend({
      status: StatusEnum.optional(),
      targetDepartmentId: z.coerce.number().int().positive().optional(),
    });
    export type ListParams = z.infer<typeof ListParamsSchema>;

    export const EntitySchema = z.object({
      id: z.number().int().positive(),
      title: z.string(),
      content: z.string(),
      targetType: TargetTypeEnum,
      targetIds: z.array(z.number().int()),
      attachments: z.array(z.string()),
      status: StatusEnum,
      publishedAt: z.string().datetime().nullable(),
      publisherId: z.number().int().nullable(),
      publisherName: z.string().nullable(),
    }).merge(Common.AuditMixin);
    export type Entity = z.infer<typeof EntitySchema>;
  }
}

// ============================================================
// 14. EXCEL — 导入导出（含异步任务进度）
// ============================================================
export namespace Excel {
  export const ModuleEnum = z.enum([
    'employee', 'schedule', 'attendance', 'leave', 'salary', 'expense', 'training',
  ]);
  export const TaskStatusEnum = z.enum(['PROCESSING', 'COMPLETED', 'FAILED']);

  export namespace Import {
    export const ProgressSchema = z.object({
      status: TaskStatusEnum,
      progress: z.number().int().min(0).max(100),
      totalRows: z.number().int().nonnegative(),
      processedRows: z.number().int().nonnegative(),
    });
    export type Progress = z.infer<typeof ProgressSchema>;

    export const ResultSchema = z.object({
      taskId: z.string(),
      successCount: z.number().int().nonnegative(),
      failCount: z.number().int().nonnegative(),
      errorFileUrl: z.string().nullable(),
    });
    export type Result = z.infer<typeof ResultSchema>;
  }

  export namespace Export {
    export const CommonParamsSchema = Common.PaginationParams.extend({
      year: z.coerce.number().int().optional(),
      month: z.coerce.number().int().min(1).max(12).optional(),
      departmentId: z.coerce.number().int().positive().optional(),
    });
    export type CommonParams = z.infer<typeof CommonParamsSchema>;
  }
}
