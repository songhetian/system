import { PrismaClient } from '@prisma/client';
const globalForPrisma = globalThis;
// 当前请求上下文（由中间件在每次请求开始时注入）
let _currentUserId = null;
let _currentUsername = null;
let _currentIp = null;
const AUDIT_SKIP_MODELS = new Set(['OperationLog', 'PrismaMigration']);
export function setAuditContext(userId, username, ip) {
    _currentUserId = userId;
    _currentUsername = username;
    _currentIp = ip || null;
}
export function clearAuditContext() {
    _currentUserId = null;
    _currentUsername = null;
    _currentIp = null;
}
const prismaClient = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});
// 操作日志中间件
prismaClient.$use(async (params, next) => {
    const result = await next(params);
    if (_currentUserId &&
        (params.action === 'create' || params.action === 'update' || params.action === 'delete') &&
        params.model &&
        !AUDIT_SKIP_MODELS.has(params.model)) {
        const actionMap = { create: 'CREATE', update: 'UPDATE', delete: 'DELETE' };
        const before = params.action === 'update' ? params.args.data : undefined;
        const after = params.action === 'delete' ? undefined : result;
        try {
            await prismaClient.operationLog.create({
                data: {
                    userId: _currentUserId,
                    username: _currentUsername,
                    action: actionMap[params.action],
                    entityType: params.model,
                    entityId: result?.id || params.args?.where?.id || 0,
                    before: before ? before : undefined,
                    after: after ? after : undefined,
                    ip: _currentIp,
                },
            });
        }
        catch {
            // 日志写入失败不阻塞主流程
        }
    }
    return result;
});
export const prisma = prismaClient;
if (process.env.NODE_ENV !== 'production')
    globalForPrisma.prisma = prisma;
//# sourceMappingURL=prisma.js.map