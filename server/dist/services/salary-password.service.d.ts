export declare class SalaryPasswordError extends Error {
    code: number;
    statusCode: number;
    constructor(message: string, code: number, statusCode: number);
}
export declare function verifySalaryPassword(userId: number, password: string, app: any, ip: string, userAgent?: string): Promise<{
    token: string;
    expiresIn: number;
}>;
export declare function setSalaryPassword(userId: number, oldPassword: string | null, newPassword: string): Promise<void>;
//# sourceMappingURL=salary-password.service.d.ts.map