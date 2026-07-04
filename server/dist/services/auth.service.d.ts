export declare class AuthError extends Error {
    code: number;
    statusCode: number;
    constructor(message: string, code: number, statusCode: number);
}
export declare function login(username: string, password: string): Promise<{
    id: number;
    username: string;
    employeeId: number | null;
}>;
export declare function generateTokens(app: any, user: {
    id: number;
    username: string;
    employeeId: number | null;
}): Promise<{
    accessToken: any;
    refreshToken: any;
}>;
//# sourceMappingURL=auth.service.d.ts.map