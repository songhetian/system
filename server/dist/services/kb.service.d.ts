import type { KbDocumentCreate, KbDocumentQuery } from '@shop/shared';
export declare function createKbDocument(data: KbDocumentCreate & {
    fileName: string;
    fileSize: number;
    fileData: Buffer;
}, uploaderId: number, uploaderName: string): Promise<{
    title: string;
    createdAt: Date;
    id: number;
    updatedAt: Date;
    deletedAt: Date | null;
    category: import("@prisma/client").$Enums.KbCategory;
    isConfidential: boolean;
    fileName: string;
    fileSize: number;
    fileUrl: string;
    uploaderId: number;
    uploaderName: string;
    securityLevel: import("@prisma/client").$Enums.FileSecurityLevel;
    allowedUserIds: import("@prisma/client/runtime/library").JsonValue;
    allowedRoleIds: import("@prisma/client/runtime/library").JsonValue;
}>;
export declare function getKbDocumentById(id: number): Promise<{
    title: string;
    createdAt: Date;
    id: number;
    updatedAt: Date;
    deletedAt: Date | null;
    category: import("@prisma/client").$Enums.KbCategory;
    isConfidential: boolean;
    fileName: string;
    fileSize: number;
    fileUrl: string;
    uploaderId: number;
    uploaderName: string;
    securityLevel: import("@prisma/client").$Enums.FileSecurityLevel;
    allowedUserIds: import("@prisma/client/runtime/library").JsonValue;
    allowedRoleIds: import("@prisma/client/runtime/library").JsonValue;
} | null>;
export declare function listKbDocuments(query: KbDocumentQuery): Promise<any>;
export declare function deleteKbDocument(id: number): Promise<void>;
export declare function getKbPreviewUrl(id: number): Promise<{
    url: string;
    expiresAt: string;
}>;
//# sourceMappingURL=kb.service.d.ts.map