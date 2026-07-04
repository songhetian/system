import type { DepartmentCreate, DepartmentUpdate, DepartmentQuery } from '@shared/schemas/org.js';
export declare function createDepartment(data: DepartmentCreate): Promise<{
    createdAt: Date;
    id: number;
    name: string;
    updatedAt: Date;
    deletedAt: Date | null;
    parentId: number | null;
    sortOrder: number;
    managerId: number | null;
}>;
export declare function getDepartmentById(id: number): Promise<{
    createdAt: Date;
    id: number;
    name: string;
    updatedAt: Date;
    deletedAt: Date | null;
    parentId: number | null;
    sortOrder: number;
    managerId: number | null;
} | null>;
export declare function listDepartments(query: DepartmentQuery): Promise<{
    list: {
        createdAt: Date;
        id: number;
        name: string;
        updatedAt: Date;
        deletedAt: Date | null;
        parentId: number | null;
        sortOrder: number;
        managerId: number | null;
    }[];
    total: number;
    page: DepartmentQuery;
    pageSize: DepartmentQuery;
}>;
export declare function updateDepartment(id: number, data: DepartmentUpdate): Promise<{
    createdAt: Date;
    id: number;
    name: string;
    updatedAt: Date;
    deletedAt: Date | null;
    parentId: number | null;
    sortOrder: number;
    managerId: number | null;
}>;
export declare function deleteDepartment(id: number): Promise<void>;
export declare function getDepartmentTree(): Promise<any[]>;
//# sourceMappingURL=department.service.d.ts.map