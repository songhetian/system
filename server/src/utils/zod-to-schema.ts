import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

function fixExclusiveBounds(obj: any): any {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(fixExclusiveBounds);

  const result: any = {};
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

export function zodToSchema<T extends z.ZodTypeAny>(
  schema: T,
  options?: { name?: string; description?: string },
) {
  const jsonSchema = zodToJsonSchema(schema, {
    target: 'openApi3',
    name: options?.name,
  }) as any;

  const fixed = fixExclusiveBounds(jsonSchema);

  if (options?.description) {
    fixed.description = options.description;
  }

  return fixed;
}

export function createResponseSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return zodToSchema(
    z.object({
      code: z.number().default(0),
      data: dataSchema,
      message: z.string().default('ok'),
    }),
  );
}

export function createPaginatedResponseSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return createResponseSchema(
    z.object({
      list: z.array(itemSchema),
      total: z.number(),
      page: z.number(),
      pageSize: z.number(),
    }),
  );
}
