export interface FileAccessContext {
    userId: number;
    roleIds: number[];
    hasSecondPasswordVerified?: boolean;
    secondPasswordVerifiedAt?: number;
}
export declare function checkFileAccess(documentId: number, context: FileAccessContext): Promise<{
    allowed: boolean;
    reason?: string;
}>;
export declare function filterDocumentsByAccess(documents: any[], context: FileAccessContext): Promise<any[]>;
export declare function updateDocumentSecurity(documentId: number, securityLevel: string, allowedUserIds: number[], allowedRoleIds: number[]): Promise<{
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
export declare const fileSecurityLevels: {
    value: string;
    label: string;
    description: string;
}[];
//# sourceMappingURL=file-security.service.d.ts.map