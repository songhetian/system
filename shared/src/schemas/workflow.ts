import { z } from "zod";
import { auditMixin, softDeleteMixin, zPaginationParams } from "./common";

// ─── 基础枚举 ─────────────────────────────────────────────────

export const zNodeType = z.enum([
  "START",
  "APPROVAL",
  "CONDITION",
  "CC",
  "SUB_PROCESS",
  "END",
]);

export const zAssigneeType = z.enum(["ROLE", "USER", "DEPARTMENT_LEADER"]);

export const zSignType = z.enum(["OR", "AND"]);

export const zTimeoutAction = z.enum(["PASS", "REJECT", "NOTIFY"]);

export const zOperator = z.enum(["GT", "GTE", "LT", "LTE", "EQ", "NEQ"]);

// ─── 位置 ─────────────────────────────────────────────────────

export const zCanvasPosition = z.object({
  x: z.number(),
  y: z.number(),
});

// ─── 条件 ─────────────────────────────────────────────────────

export const zCondition = z.object({
  conditionType: z.string().min(1),
  field: z.string().optional(),
  operator: zOperator,
  conditionValue: z.string().min(1),
});

// ═══════════════════ 节点（辨析联合） ══════════════════

const zBaseNode = z.object({
  label: z.string().min(1).max(100),
  position: zCanvasPosition,
});

export const zTemplateNode = z.discriminatedUnion("type", [
  // START
  zBaseNode.extend({ type: z.literal("START") }),
  // END
  zBaseNode.extend({ type: z.literal("END") }),
  // APPROVAL
  zBaseNode.extend({
    type: z.literal("APPROVAL"),
    assigneeType: zAssigneeType,
    assigneeId: z.number().int().positive().nullable(),
    signType: zSignType,
    timeoutHours: z.number().positive().optional(),
    timeoutAction: zTimeoutAction.optional(),
  }),
  // CONDITION
  zBaseNode.extend({
    type: z.literal("CONDITION"),
    conditions: z.array(zCondition).min(1),
  }),
  // CC
  zBaseNode.extend({
    type: z.literal("CC"),
    assigneeType: zAssigneeType,
    assigneeId: z.number().int().positive().nullable(),
  }),
  // SUB_PROCESS
  zBaseNode.extend({
    type: z.literal("SUB_PROCESS"),
    subTemplateId: z.number().int().positive(),
  }),
]);

// ─── 边 ───────────────────────────────────────────────────────

export const zEdge = z.object({
  sourceNodeIndex: z.number().int().min(0),
  targetNodeIndex: z.number().int().min(0),
  label: z.string().max(50).optional(),
});

// ═══════════════════ 流程模板 ═══════════════════

export const zWorkflowTemplateCreateBase = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  nodes: z.array(zTemplateNode).min(2),
  edges: z.array(zEdge).min(1),
});

export const zWorkflowTemplateCreate = zWorkflowTemplateCreateBase.superRefine((data, ctx) => {
  const hasStart = data.nodes.some((n) => n.type === "START");
  const hasEnd = data.nodes.some((n) => n.type === "END");
  if (!hasStart) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "必须包含 START 节点", path: ["nodes"] });
  }
  if (!hasEnd) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "必须包含 END 节点", path: ["nodes"] });
  }
});

export const zWorkflowTemplate = zWorkflowTemplateCreateBase
  .extend({
    id: z.number().int().positive(),
    version: z.number().int().positive().default(1),
    status: z.enum(["DRAFT", "PUBLISHED"]),
  })
  .merge(auditMixin)
  .merge(softDeleteMixin)
  .omit({ deletedAt: true });

export type NodeType = z.infer<typeof zNodeType>;
export type AssigneeType = z.infer<typeof zAssigneeType>;
export type SignType = z.infer<typeof zSignType>;
export type TimeoutAction = z.infer<typeof zTimeoutAction>;
export type Operator = z.infer<typeof zOperator>;
export type CanvasPosition = z.infer<typeof zCanvasPosition>;
export type Condition = z.infer<typeof zCondition>;
export type TemplateNode = z.infer<typeof zTemplateNode>;
export type Edge = z.infer<typeof zEdge>;
export type WorkflowTemplateCreate = z.infer<typeof zWorkflowTemplateCreate>;
export type WorkflowTemplate = z.infer<typeof zWorkflowTemplate>;

// ═══════════════════ 审批实例 ═══════════════════

export const zWorkflowInstanceStatus = z.enum([
  "PENDING",
  "IN_PROGRESS",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
]);

export const zWorkflowInstanceCreate = z.object({
  templateId: z.number().int().positive(),
  subject: z.string().min(1).max(200),
  formData: z.record(z.string(), z.unknown()),
  sourceType: z.enum(["LEAVE", "EXPENSE", "OTHER"]),
  sourceId: z.number().int().positive(),
  applicantId: z.number().int().positive().optional(),
});

export const zWorkflowInstanceNode = z.object({
  id: z.number().int().positive(),
  type: zNodeType,
  label: z.string(),
  assigneeId: z.number().int().positive().nullable(),
  assigneeName: z.string().nullable(),
  signType: zSignType.nullable(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "SKIPPED"]),
  comment: z.string().nullable(),
  operatedAt: z.string().datetime().nullable(),
});

export const zWorkflowInstance = z.object({
  id: z.number().int().positive(),
  templateName: z.string(),
  subject: z.string(),
  formData: z.record(z.string(), z.unknown()),
  sourceType: z.string(),
  sourceId: z.number().int().positive(),
  status: zWorkflowInstanceStatus,
  nodes: z.array(zWorkflowInstanceNode),
  applicantName: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const zWorkflowInstanceQuery = zPaginationParams.extend({
  status: zWorkflowInstanceStatus.optional(),
  applicantId: z.coerce.number().int().positive().optional(),
  templateId: z.coerce.number().int().positive().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

// ─── 审批操作 ─────────────────────────────────────────────────

export const zWorkflowApprove = z.object({
  comment: z.string().max(500).optional(),
});

export const zWorkflowReject = z.object({
  reason: z.string().min(1).max(500),
});

export const zWorkflowDelegate = z.object({
  toUserId: z.number().int().positive(),
  reason: z.string().max(500).optional(),
});

export const zWorkflowAddSigner = z.object({
  userId: z.number().int().positive(),
});

export type WorkflowInstanceStatus = z.infer<typeof zWorkflowInstanceStatus>;
export type WorkflowInstanceCreate = z.infer<typeof zWorkflowInstanceCreate>;
export type WorkflowInstanceNode = z.infer<typeof zWorkflowInstanceNode>;
export type WorkflowInstance = z.infer<typeof zWorkflowInstance>;
export type WorkflowInstanceQuery = z.infer<typeof zWorkflowInstanceQuery>;
export type WorkflowApprove = z.infer<typeof zWorkflowApprove>;
export type WorkflowReject = z.infer<typeof zWorkflowReject>;
export type WorkflowDelegate = z.infer<typeof zWorkflowDelegate>;
export type WorkflowAddSigner = z.infer<typeof zWorkflowAddSigner>;
