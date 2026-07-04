interface RowAccessContext {
    userId: number;
    employeeId: number | null;
    permissions: Set<string>;
    dataScopes: Record<string, string>;
}
export declare function getEmployeeDepartmentId(employeeId: number): Promise<number | null>;
export declare function getDepartmentAndChildrenIds(deptId: number): Promise<number[]>;
/**
 * 构建行级权限过滤条件
 * @param ctx 请求上下文（含权限、数据范围）
 * @param entity 资源类型（如 'leave', 'attendance', 'employee'）
 * @returns Prisma where 条件
 */
export declare function buildRowAccessFilter(ctx: RowAccessContext, entity: string): Promise<Record<string, any>>;
export {};
//# sourceMappingURL=row-access.d.ts.map