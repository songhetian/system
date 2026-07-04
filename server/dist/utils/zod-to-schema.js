import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
function fixExclusiveBounds(obj) {
    if (obj === null || typeof obj !== 'object')
        return obj;
    if (Array.isArray(obj))
        return obj.map(fixExclusiveBounds);
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
        if (key === 'exclusiveMinimum' && typeof value === 'boolean') {
            if (value && typeof obj.minimum === 'number') {
                result.exclusiveMinimum = obj.minimum;
            }
            continue;
        }
        if (key === 'exclusiveMaximum' && typeof value === 'boolean') {
            if (value && typeof obj.maximum === 'number') {
                result.exclusiveMaximum = obj.maximum;
            }
            continue;
        }
        if (key === 'minimum' && obj.exclusiveMinimum === true) {
            continue;
        }
        if (key === 'maximum' && obj.exclusiveMaximum === true) {
            continue;
        }
        result[key] = fixExclusiveBounds(value);
    }
    return result;
}
export function zodToSchema(schema, options) {
    const jsonSchema = zodToJsonSchema(schema, {
        target: 'openApi3',
        name: options?.name,
    });
    const fixed = fixExclusiveBounds(jsonSchema);
    if (options?.description) {
        fixed.description = options.description;
    }
    return fixed;
}
export function createResponseSchema(dataSchema) {
    return zodToSchema(z.object({
        code: z.number().default(0),
        data: dataSchema,
        message: z.string().default('ok'),
    }));
}
export function createPaginatedResponseSchema(itemSchema) {
    return createResponseSchema(z.object({
        list: z.array(itemSchema),
        total: z.number(),
        page: z.number(),
        pageSize: z.number(),
    }));
}
//# sourceMappingURL=zod-to-schema.js.map