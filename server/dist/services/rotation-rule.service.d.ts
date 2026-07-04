import type { RotationRuleCreate } from '@shop/shared';
export declare class RotationRuleError extends Error {
    code: number;
    statusCode: number;
    constructor(message: string, code: number, statusCode: number);
}
export declare function createRotationRule(data: RotationRuleCreate): Promise<{
    createdAt: Date;
    id: number;
    name: string;
    updatedAt: Date;
    deletedAt: Date | null;
    pattern: import("@prisma/client/runtime/library").JsonValue;
    cycleDays: number;
}>;
export declare function findAllRotationRules(): Promise<{
    createdAt: Date;
    id: number;
    name: string;
    updatedAt: Date;
    deletedAt: Date | null;
    pattern: import("@prisma/client/runtime/library").JsonValue;
    cycleDays: number;
}[]>;
export declare function findRotationRuleById(id: number): Promise<{
    createdAt: Date;
    id: number;
    name: string;
    updatedAt: Date;
    deletedAt: Date | null;
    pattern: import("@prisma/client/runtime/library").JsonValue;
    cycleDays: number;
} | null>;
export declare function updateRotationRule(id: number, data: Partial<RotationRuleCreate>): Promise<{
    createdAt: Date;
    id: number;
    name: string;
    updatedAt: Date;
    deletedAt: Date | null;
    pattern: import("@prisma/client/runtime/library").JsonValue;
    cycleDays: number;
}>;
export declare function deleteRotationRule(id: number): Promise<boolean>;
//# sourceMappingURL=rotation-rule.service.d.ts.map