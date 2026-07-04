export declare class BusinessError extends Error {
    readonly code: number;
    readonly statusCode: number;
    constructor(message: string, code?: number, statusCode?: number);
}
export declare const Errors: {
    notFound(message?: string): BusinessError;
    validation(message?: string): BusinessError;
    business(message: string, code?: number): BusinessError;
    unauthorized(message?: string): BusinessError;
    forbidden(message?: string): BusinessError;
};
//# sourceMappingURL=errors.d.ts.map