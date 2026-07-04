import { z } from "zod";
import { auditMixin, softDeleteMixin, zPaginationParams } from "./common.js";

// ═══════════════════ 系统消息 ═══════════════════

export const zMessageType = z.enum(["TODO", "NOTIFICATION", "SYSTEM"]);

export const zMessage = z.object({
  id: z.number().int().positive(),
  userId: z.number().int().positive(),
  type: zMessageType,
  title: z.string(),
  content: z.string(),
  sourceType: z.string().nullable(),
  sourceId: z.number().int().positive().nullable(),
  read: z.boolean(),
  createdAt: z.string().datetime(),
});

export const zMessageQuery = zPaginationParams.extend({
  read: z.coerce.boolean().optional(),
  type: zMessageType.optional(),
});

export type MessageType = z.infer<typeof zMessageType>;
export type Message = z.infer<typeof zMessage>;
export type MessageQuery = z.infer<typeof zMessageQuery>;

// ═══════════════════ 公告 ═══════════════════

export const zAnnouncementTargetType = z.enum(["ALL", "DEPARTMENT", "ROLE"]);

export const zAnnouncementStatus = z.enum(["DRAFT", "PUBLISHED"]);

export const zAnnouncementCreate = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  targetType: zAnnouncementTargetType,
  targetIds: z.array(z.number().int().positive()).default([]),
  attachments: z.array(z.string()).default([]),
});

export const zAnnouncementUpdate = zAnnouncementCreate.partial();

export const zAnnouncement = zAnnouncementCreate
  .extend({
    id: z.number().int().positive(),
    status: zAnnouncementStatus,
    publisherId: z.number().int().positive(),
    publisherName: z.string(),
    publishedAt: z.string().datetime().nullable(),
  })
  .merge(auditMixin)
  .merge(softDeleteMixin)
  .omit({ deletedAt: true });

export const zAnnouncementQuery = zPaginationParams.extend({
  status: zAnnouncementStatus.optional(),
  targetDepartmentId: z.coerce.number().int().positive().optional(),
});

export type AnnouncementTargetType = z.infer<typeof zAnnouncementTargetType>;
export type AnnouncementStatus = z.infer<typeof zAnnouncementStatus>;
export type AnnouncementCreate = z.infer<typeof zAnnouncementCreate>;
export type AnnouncementUpdate = z.infer<typeof zAnnouncementUpdate>;
export type Announcement = z.infer<typeof zAnnouncement>;
export type AnnouncementQuery = z.infer<typeof zAnnouncementQuery>;
