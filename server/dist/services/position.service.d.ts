import type { PositionCreate, PositionUpdate } from '@shared/schemas/org.js';
export declare function createPosition(departmentId: number, data: PositionCreate): Promise<{
    createdAt: Date;
    id: number;
    name: string;
    updatedAt: Date;
    deletedAt: Date | null;
    departmentId: number;
    rankId: number;
    headcount: number;
}>;
export declare function getPositionById(id: number): Promise<{
    createdAt: Date;
    id: number;
    name: string;
    updatedAt: Date;
    deletedAt: Date | null;
    departmentId: number;
    rankId: number;
    headcount: number;
} | null>;
export declare function listPositions(params: {
    page: number;
    pageSize: number;
    departmentId?: number;
    keyword?: string;
}): Promise<{
    list: {
        createdAt: Date;
        id: number;
        name: string;
        updatedAt: Date;
        deletedAt: Date | null;
        departmentId: number;
        rankId: number;
        headcount: number;
    }[];
    total: number;
    page: number;
    pageSize: number;
}>;
export declare function updatePosition(id: number, data: PositionUpdate): Promise<{
    createdAt: Date;
    id: number;
    name: string;
    updatedAt: Date;
    deletedAt: Date | null;
    departmentId: number;
    rankId: number;
    headcount: number;
}>;
export declare function deletePosition(id: number): Promise<void>;
//# sourceMappingURL=position.service.d.ts.map