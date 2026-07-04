import { ZodError } from 'zod';
import { BusinessError } from '../lib/errors.js';
export function registerErrorHandler(app) {
    app.setErrorHandler((error, request, reply) => {
        if (error instanceof ZodError || error.name === 'ZodError') {
            const issues = error.issues || [];
            const message = issues.map((issue) => {
                const path = issue.path?.join('.') || '';
                return path ? `${path}: ${issue.message}` : issue.message;
            }).join('; ');
            return reply.status(400).send({
                code: 10002,
                data: null,
                message: message || '参数验证失败',
            });
        }
        if (error instanceof BusinessError) {
            return reply.status(error.statusCode).send({
                code: error.code,
                data: null,
                message: error.message,
            });
        }
        const statusCode = error.statusCode || 500;
        const code = error.code || 10003;
        const message = error.message || '服务器内部错误';
        if (statusCode >= 500) {
            request.log.error(error);
        }
        reply.status(statusCode).send({
            code,
            data: null,
            message,
        });
    });
    app.setNotFoundHandler((request, reply) => {
        reply.status(404).send({
            code: 10001,
            data: null,
            message: '资源不存在',
        });
    });
}
//# sourceMappingURL=error-handler.js.map