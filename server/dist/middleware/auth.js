import { prisma } from '../lib/prisma.js';
import { getCache, setCache, deleteCache } from '../lib/redis.js';
import { setAuditContext, clearAuditContext } from '../lib/prisma.js';
const PERMISSION_CACHE_TTL = 300;
// 白名单路径：不需要 JWT 校验
const AUTH_SKIP_PATHS = new Set([
    '/api/auth/login',
    '/api/auth/refresh',
    '/api/auth/logout',
]);
function isSkipPath(url) {
    // 精确匹配白名单，或文档/WebSocket/健康检查 路径前缀
    if (AUTH_SKIP_PATHS.has(url))
        return true;
    if (url.startsWith('/docs'))
        return true;
    if (url.startsWith('/ws'))
        return true;
    if (url.startsWith('/health'))
        return true;
    return false;
}
function permissionCacheKey(userId) {
    return `user:perms:${userId}`;
}
export async function invalidateUserPermissions(userId) {
    await deleteCache(permissionCacheKey(userId));
}
async function getUserPermissions(userId) {
    const cacheKey = permissionCacheKey(userId);
    const cached = await getCache(cacheKey);
    if (cached)
        return cached;
    const userWithRoles = await prisma.user.findUnique({
        where: { id: userId, deletedAt: null },
        include: {
            userRoles: {
                include: {
                    role: {
                        include: {
                            rolePermissions: {
                                include: { permission: true },
                            },
                        },
                    },
                },
            },
        },
    });
    const permissions = [];
    if (userWithRoles) {
        for (const ur of userWithRoles.userRoles) {
            for (const rp of ur.role.rolePermissions) {
                permissions.push(rp.permission.code);
            }
        }
    }
    await setCache(cacheKey, permissions, PERMISSION_CACHE_TTL);
    return permissions;
}
const DATASCOPE_CACHE_TTL = 300;
export async function getUserDataScopes(userId) {
    const cacheKey = `datascope:user:${userId}`;
    const cached = await getCache(cacheKey);
    if (cached)
        return cached;
    const records = await prisma.dataPermission.findMany({
        where: { userId },
        select: { resourceType: true, scope: true },
    });
    const scopes = {};
    for (const r of records) {
        scopes[r.resourceType] = r.scope;
    }
    await setCache(cacheKey, scopes, DATASCOPE_CACHE_TTL);
    return scopes;
}
// 全局注册 JWT 鉴权 — 在 index.ts 中调用一次即可
export function registerGlobalAuth(app) {
    app.addHook('onRequest', async (request, reply) => {
        // ponytail: 测试环境通过 onRequest 预注入 user，跳过 JWT 校验
        if (request._authSkipped) {
            request.permissions = request.permissions || new Set();
            return;
        }
        // 白名单路径跳过
        if (isSkipPath(request.url))
            return;
        try {
            const authHeader = request.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return reply.status(401).send({
                    code: 20000,
                    data: null,
                    message: '未登录或 token 已过期',
                });
            }
            const decoded = await request.jwtVerify();
            request.user = {
                id: decoded.id,
                username: decoded.username,
                employeeId: decoded.employeeId,
            };
            request.employeeId = decoded.employeeId;
            setAuditContext(decoded.id, decoded.username, request.ip);
            const permissions = await getUserPermissions(decoded.id);
            request.permissions = new Set(permissions);
            const dataScopes = await getUserDataScopes(decoded.id);
            request.dataScopes = dataScopes;
        }
        catch {
            reply.status(401).send({
                code: 20000,
                data: null,
                message: '未登录或 token 已过期',
            });
        }
    });
    // 请求结束后清除审计上下文
    app.addHook('onResponse', async () => {
        clearAuditContext();
    });
}
// 按需权限校验 — 供个别路由使用 requirePermission('employee:create')
export function requirePermission(permission) {
    return async (request, reply) => {
        if (!request.user) {
            return reply.status(401).send({
                code: 20000,
                data: null,
                message: '未登录或 token 已过期',
            });
        }
        // 超级管理员跳过所有权限检查
        if (request.permissions?.has('admin:all'))
            return;
        if (!request.permissions?.has(permission)) {
            reply.status(403).send({
                code: 20001,
                data: null,
                message: '无权限',
            });
        }
    };
}
//# sourceMappingURL=auth.js.map