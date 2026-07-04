import { z } from 'zod';
export declare function zodToSchema<T extends z.ZodTypeAny>(schema: T, options?: {
    name?: string;
    description?: string;
}): any;
export declare function createResponseSchema<T extends z.ZodTypeAny>(dataSchema: T): any;
export declare function createPaginatedResponseSchema<T extends z.ZodTypeAny>(itemSchema: T): any;
//# sourceMappingURL=zod-to-schema.d.ts.map