import { z } from "zod";

// ─── 响应信封 ────────────────────────────────────────────────

export const zApiResponse = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    code: z.number().int(),
    data: dataSchema,
    message: z.string(),
  });

export const zApiResponseEmpty = zApiResponse(z.null());

// ─── 分页 ────────────────────────────────────────────────────

export const zPaginationParams = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const zPaginatedData = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    list: z.array(itemSchema),
    total: z.number().int().min(0),
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1),
  });

export type PaginationParams = z.infer<typeof zPaginationParams>;

// ─── Mixin ───────────────────────────────────────────────────

export const auditMixin = z.object({
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const softDeleteMixin = z.object({
  deletedAt: z.string().datetime().nullable(),
});

// ─── 辅助 Schema ─────────────────────────────────────────────

export const zDateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日期格式必须为 YYYY-MM-DD");

export const zTimeString = z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "时间格式必须为 HH:mm");

export const zHexColor = z.string().regex(/^#[0-9A-Fa-f]{6}$/, "颜色格式必须为 #RRGGBB");

export const zPhone = z.string().regex(/^1[3-9]\d{9}$/, "手机号格式错误");

export const zIdCard = z.string().regex(/^\d{17}[\dXx]$/, "身份证号格式错误");

export const zNonNegativeNumber = z.number().nonnegative("不能为负数");

export const zMasked = z.literal("****");

export const zStatusCode = z
  .number()
  .int()
  .refine((n) => n === 0 || (n >= 10000 && n <= 139999), "错误码超出有效区间");
