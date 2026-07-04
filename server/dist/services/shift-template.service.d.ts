import type { ShiftTemplateCreate, ShiftTemplateUpdate } from '@shop/shared';
export declare class ShiftTemplateError extends Error {
    code: number;
    statusCode: number;
    constructor(message: string, code: number, statusCode: number);
}
export declare function createShiftTemplate(data: ShiftTemplateCreate): Promise<{
    description: string | null;
    createdAt: Date;
    id: number;
    name: string;
    updatedAt: Date;
    deletedAt: Date | null;
    startTime: string;
    endTime: string;
    color: string;
}>;
export declare function findAllShiftTemplates(): Promise<{
    description: string | null;
    createdAt: Date;
    id: number;
    name: string;
    updatedAt: Date;
    deletedAt: Date | null;
    startTime: string;
    endTime: string;
    color: string;
}[]>;
export declare function findShiftTemplateById(id: number): Promise<{
    description: string | null;
    createdAt: Date;
    id: number;
    name: string;
    updatedAt: Date;
    deletedAt: Date | null;
    startTime: string;
    endTime: string;
    color: string;
} | null>;
export declare function updateShiftTemplate(id: number, data: ShiftTemplateUpdate): Promise<{
    description: string | null;
    createdAt: Date;
    id: number;
    name: string;
    updatedAt: Date;
    deletedAt: Date | null;
    startTime: string;
    endTime: string;
    color: string;
}>;
export declare function deleteShiftTemplate(id: number): Promise<boolean>;
//# sourceMappingURL=shift-template.service.d.ts.map