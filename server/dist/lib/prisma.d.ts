import { PrismaClient } from '@prisma/client';
export declare function setAuditContext(userId: number | null, username: string | null, ip?: string | null): void;
export declare function clearAuditContext(): void;
export declare const prisma: PrismaClient<{
    log: ("error" | "query" | "warn")[];
}, never, import("@prisma/client/runtime/library").DefaultArgs>;
//# sourceMappingURL=prisma.d.ts.map