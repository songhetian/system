import type { DataPermissionCreate, DataPermissionUpdate, DataPermissionQuery } from '@shop/shared';
export declare function createDataPermission(data: DataPermissionCreate): Promise<{
    userId: number | null;
    createdAt: Date;
    id: number;
    updatedAt: Date;
    roleId: number | null;
    resourceType: string;
    scope: import("@prisma/client").$Enums.DataScope;
    departmentId: number | null;
}>;
export declare function listDataPermissions(query: DataPermissionQuery): Promise<{
    total: number;
    items: {
        userId: number | null;
        createdAt: Date;
        id: number;
        updatedAt: Date;
        roleId: number | null;
        resourceType: string;
        scope: import("@prisma/client").$Enums.DataScope;
        departmentId: number | null;
    }[];
}>;
export declare function getDataPermission(id: number): Promise<{
    userId: number | null;
    createdAt: Date;
    id: number;
    updatedAt: Date;
    roleId: number | null;
    resourceType: string;
    scope: import("@prisma/client").$Enums.DataScope;
    departmentId: number | null;
}>;
export declare function updateDataPermission(id: number, data: DataPermissionUpdate): Promise<{
    userId: number | null;
    createdAt: Date;
    id: number;
    updatedAt: Date;
    roleId: number | null;
    resourceType: string;
    scope: import("@prisma/client").$Enums.DataScope;
    departmentId: number | null;
}>;
export declare function deleteDataPermission(id: number): Promise<{
    userId: number | null;
    createdAt: Date;
    id: number;
    updatedAt: Date;
    roleId: number | null;
    resourceType: string;
    scope: import("@prisma/client").$Enums.DataScope;
    departmentId: number | null;
}>;
export declare function getUserDataScope(userId: number, resourceType: string): Promise<string>;
export declare function getUserDepartmentIds(userId: number, scope: string): Promise<number[]>;
//# sourceMappingURL=data-permission.service.d.ts.map