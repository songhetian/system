import type { FastifyInstance, preHandlerHookHandler } from 'fastify';
export declare function invalidateUserPermissions(userId: number): Promise<void>;
export declare function getUserDataScopes(userId: number): Promise<Record<string, string>>;
declare module '@fastify/jwt' {
    interface FastifyJWT {
        payload: {
            id: number;
            username: string;
            employeeId: number | null;
        };
        user: {
            id: number;
            username: string;
            employeeId: number | null;
        };
    }
}
declare module 'fastify' {
    interface FastifyRequest {
        permissions: Set<string>;
        dataScopes: Record<string, string>;
        employeeId: number;
    }
}
export declare function registerGlobalAuth(app: FastifyInstance): void;
export declare function requirePermission(permission: string): preHandlerHookHandler;
//# sourceMappingURL=auth.d.ts.map