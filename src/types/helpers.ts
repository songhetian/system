// ============================================================
// src/types/helpers.ts — Zod 无法直接表达的纯 TS 泛型
// ============================================================

/** 掩码实体：将指定 Key 的值替换为 "****" 字面量 */
export type MaskedEntity<T, K extends keyof T> = Omit<T, K> & { [P in K]: '****' };

/** 从辨析联合类型中提取指定 discriminator 的分支 */
export type DiscriminateUnion<T, K extends keyof T, V extends T[K]> = Extract<T, Record<K, V>>;

/** 从实体中提取可做查询条件的标量字段 */
export type Queryable<T> = {
  [K in keyof T as T[K] extends number | string | boolean | null | undefined ? K : never]?: T[K];
};

/** 薪资模块认证上下文（所有薪资接口需携带的 header 映射） */
export interface SalaryAuthContext {
  salaryToken: string;
}

/** 通用异步任务进度 */
export interface AsyncTaskProgress {
  taskId: string;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progress: number;   // 0–100
  totalRows: number;
  processedRows: number;
}

/** 分页接口签名（用于常量类型标注） */
export type PaginatedEndpoint<Item> = {
  list: Item[];
  total: number;
  page: number;
  pageSize: number;
};

/** 审批操作类型 */
export type WorkflowAction = 'APPROVE' | 'REJECT' | 'DELEGATE' | 'ADD_SIGNER' | 'CANCEL';

/** 薪资审计动作类型 */
export type SalaryAuditAction =
  | 'VIEW_SALARY'
  | 'VIEW_PAYSLIP'
  | 'EXPORT_SALARY'
  | 'VERIFY_PASSWORD_SUCCESS'
  | 'VERIFY_PASSWORD_FAIL';

/** 获取实体 status 字段的联合类型 */
export type EntityStatus<E extends { status: string }> = E['status'];
