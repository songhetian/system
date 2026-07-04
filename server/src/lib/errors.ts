export class BusinessError extends Error {
  public readonly code: number;
  public readonly statusCode: number;

  constructor(message: string, code: number = 10000, statusCode: number = 400) {
    super(message);
    this.name = 'BusinessError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export const Errors = {
  notFound(message: string = '资源不存在') {
    return new BusinessError(message, 10001, 404);
  },
  validation(message: string = '参数验证失败') {
    return new BusinessError(message, 10002, 400);
  },
  business(message: string, code: number = 10000) {
    return new BusinessError(message, code, 400);
  },
  unauthorized(message: string = '未登录或 token 已过期') {
    return new BusinessError(message, 20000, 401);
  },
  forbidden(message: string = '无权限') {
    return new BusinessError(message, 20001, 403);
  },
};