export class BusinessError extends Error {
    code;
    statusCode;
    constructor(message, code = 10000, statusCode = 400) {
        super(message);
        this.name = 'BusinessError';
        this.code = code;
        this.statusCode = statusCode;
    }
}
export const Errors = {
    notFound(message = '资源不存在') {
        return new BusinessError(message, 10001, 404);
    },
    validation(message = '参数验证失败') {
        return new BusinessError(message, 10002, 400);
    },
    business(message, code = 10000) {
        return new BusinessError(message, code, 400);
    },
    unauthorized(message = '未登录或 token 已过期') {
        return new BusinessError(message, 20000, 401);
    },
    forbidden(message = '无权限') {
        return new BusinessError(message, 20001, 403);
    },
};
//# sourceMappingURL=errors.js.map