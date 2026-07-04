import { z } from "zod";
import { auditMixin } from "./common";

// ─── 登录 ────────────────────────────────────────────────────

export const zLoginInput = z.object({
  username: z.string().min(1).max(50),
  password: z.string().min(1).max(100),
});

export const zUserBrief = z.object({
  id: z.number().int().positive(),
  username: z.string(),
  employeeId: z.number().int().positive(),
});

export const zLoginOutput = z.object({
  accessToken: z.string(),
  user: zUserBrief,
});

export type LoginInput = z.infer<typeof zLoginInput>;
export type LoginOutput = z.infer<typeof zLoginOutput>;
export type UserBrief = z.infer<typeof zUserBrief>;

export const zRefreshOutput = zLoginOutput;
export type RefreshOutput = LoginOutput;

// ─── 用户实体 ────────────────────────────────────────────────

export const zUserCreate = z.object({
  username: z.string().min(1).max(50),
  password: z.string().min(6).max(100),
  employeeId: z.number().int().positive(),
});

export const zUserBase = zUserCreate
  .extend({
    id: z.number().int().positive(),
    passwordHash: z.string(),
    loginFailCount: z.number().int().min(0).default(0),
    lockedUntil: z.string().datetime().nullable(),
  })
  .merge(auditMixin);

export const zUser = zUserBase.omit({ passwordHash: true });

export type UserCreate = z.infer<typeof zUserCreate>;
export type User = z.infer<typeof zUser>;
