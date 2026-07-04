import type { MessageQuery, AnnouncementCreate, AnnouncementQuery } from '@shop/shared';
export declare function createMessage(data: {
    userId: number;
    type: string;
    title: string;
    content: string;
    sourceType?: string;
    sourceId?: number;
}): Promise<{
    content: string;
    title: string;
    userId: number;
    createdAt: Date;
    id: number;
    type: import("@prisma/client").$Enums.MessageType;
    sourceType: string | null;
    sourceId: number | null;
    read: boolean;
}>;
export declare function getMessageById(id: number): Promise<{
    content: string;
    title: string;
    userId: number;
    createdAt: Date;
    id: number;
    type: import("@prisma/client").$Enums.MessageType;
    sourceType: string | null;
    sourceId: number | null;
    read: boolean;
} | null>;
export declare function listMessages(query: MessageQuery): Promise<{
    list: {
        content: string;
        title: string;
        userId: number;
        createdAt: Date;
        id: number;
        type: import("@prisma/client").$Enums.MessageType;
        sourceType: string | null;
        sourceId: number | null;
        read: boolean;
    }[];
    total: number;
    page: any;
    pageSize: any;
}>;
export declare function markMessageRead(id: number): Promise<{
    content: string;
    title: string;
    userId: number;
    createdAt: Date;
    id: number;
    type: import("@prisma/client").$Enums.MessageType;
    sourceType: string | null;
    sourceId: number | null;
    read: boolean;
}>;
export declare function markAllMessagesRead(userId: number): Promise<{
    count: number;
}>;
export declare function deleteMessage(id: number): Promise<void>;
export declare function getUnreadCount(userId: number): Promise<number>;
export declare function createAnnouncement(data: AnnouncementCreate & {
    publisherId: number;
    publisherName: string;
}): Promise<{
    content: string;
    title: string;
    createdAt: Date;
    id: number;
    updatedAt: Date;
    deletedAt: Date | null;
    status: import("@prisma/client").$Enums.AnnouncementStatus;
    attachments: import("@prisma/client/runtime/library").JsonValue;
    targetType: import("@prisma/client").$Enums.AnnouncementTargetType;
    targetIds: import("@prisma/client/runtime/library").JsonValue;
    publisherId: number;
    publisherName: string;
    publishedAt: Date | null;
}>;
export declare function getAnnouncementById(id: number): Promise<{
    content: string;
    title: string;
    createdAt: Date;
    id: number;
    updatedAt: Date;
    deletedAt: Date | null;
    status: import("@prisma/client").$Enums.AnnouncementStatus;
    attachments: import("@prisma/client/runtime/library").JsonValue;
    targetType: import("@prisma/client").$Enums.AnnouncementTargetType;
    targetIds: import("@prisma/client/runtime/library").JsonValue;
    publisherId: number;
    publisherName: string;
    publishedAt: Date | null;
} | null>;
export declare function listAnnouncements(query: AnnouncementQuery): Promise<{
    list: {
        content: string;
        title: string;
        createdAt: Date;
        id: number;
        updatedAt: Date;
        deletedAt: Date | null;
        status: import("@prisma/client").$Enums.AnnouncementStatus;
        attachments: import("@prisma/client/runtime/library").JsonValue;
        targetType: import("@prisma/client").$Enums.AnnouncementTargetType;
        targetIds: import("@prisma/client/runtime/library").JsonValue;
        publisherId: number;
        publisherName: string;
        publishedAt: Date | null;
    }[];
    total: number;
    page: any;
    pageSize: any;
}>;
export declare function updateAnnouncement(id: number, data: Partial<AnnouncementCreate>): Promise<{
    content: string;
    title: string;
    createdAt: Date;
    id: number;
    updatedAt: Date;
    deletedAt: Date | null;
    status: import("@prisma/client").$Enums.AnnouncementStatus;
    attachments: import("@prisma/client/runtime/library").JsonValue;
    targetType: import("@prisma/client").$Enums.AnnouncementTargetType;
    targetIds: import("@prisma/client/runtime/library").JsonValue;
    publisherId: number;
    publisherName: string;
    publishedAt: Date | null;
}>;
export declare function publishAnnouncement(id: number): Promise<{
    content: string;
    title: string;
    createdAt: Date;
    id: number;
    updatedAt: Date;
    deletedAt: Date | null;
    status: import("@prisma/client").$Enums.AnnouncementStatus;
    attachments: import("@prisma/client/runtime/library").JsonValue;
    targetType: import("@prisma/client").$Enums.AnnouncementTargetType;
    targetIds: import("@prisma/client/runtime/library").JsonValue;
    publisherId: number;
    publisherName: string;
    publishedAt: Date | null;
}>;
export declare function deleteAnnouncement(id: number): Promise<void>;
//# sourceMappingURL=message.service.d.ts.map