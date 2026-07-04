import type { RoleCreate, RoleUpdate, RoleQuery, PermissionQuery } from '@shop/shared';
export declare function createRole(data: RoleCreate): Promise<{
    description: string | null;
    createdAt: Date;
    id: number;
    name: string;
    updatedAt: Date;
    deletedAt: Date | null;
    code: string;
}>;
export declare function getRoleById(id: number): Promise<{
    description: string | null;
    createdAt: Date;
    id: number;
    name: string;
    updatedAt: Date;
    deletedAt: Date | null;
    code: string;
} | null>;
export declare function listRoles(query: RoleQuery): Promise<{
    list: {
        description: string | null;
        createdAt: Date;
        id: number;
        name: string;
        updatedAt: Date;
        deletedAt: Date | null;
        code: string;
    }[];
    total: number;
    page: number;
    pageSize: number;
}>;
export declare function listUsers(page?: number, pageSize?: number, keyword?: string): Promise<{
    list: ({
        employee: {
            id: number;
            name: string;
        } | null;
    } & {
        username: string;
        createdAt: Date;
        id: number;
        employeeId: number | null;
        passwordHash: string;
        loginFailCount: number;
        lockedUntil: Date | null;
        updatedAt: Date;
        deletedAt: Date | null;
    })[];
    total: number;
    page: number;
    pageSize: number;
}>;
export declare function updateRole(id: number, data: RoleUpdate): Promise<{
    description: string | null;
    createdAt: Date;
    id: number;
    name: string;
    updatedAt: Date;
    deletedAt: Date | null;
    code: string;
}>;
export declare function deleteRole(id: number): Promise<void>;
export declare function assignRolePermissions(roleId: number, permissionIds: number[]): Promise<number>;
export declare function getRolePermissions(roleId: number): Promise<{
    createdAt: Date;
    id: number;
    name: string;
    updatedAt: Date;
    code: string;
    group: string;
}[]>;
export declare function listPermissions(query: PermissionQuery): Promise<{
    createdAt: Date;
    id: number;
    name: string;
    updatedAt: Date;
    code: string;
    group: string;
}[]>;
export declare function assignUserRoles(userId: number, roleIds: number[]): Promise<number>;
//# sourceMappingURL=role.service.d.ts.map