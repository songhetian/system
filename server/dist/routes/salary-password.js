import { z } from 'zod';
import { zSalaryPasswordVerify, zSalaryPasswordVerifyResult, zSalaryPasswordSet } from '@shop/shared';
import { createResponseSchema, zodToSchema } from '../utils/zod-to-schema.js';
import { verifySalaryPassword, setSalaryPassword, SalaryPasswordError } from '../services/salary-password.service.js';
export const salaryPasswordRoutes = async (app) => {
    app.post('/verify', {
        schema: {
            description: '校验二级密码',
            tags: ['薪资'],
            body: zodToSchema(zSalaryPasswordVerify),
            response: {
                200: createResponseSchema(zSalaryPasswordVerifyResult),
            },
        },
    }, async (request, reply) => {
        const body = zSalaryPasswordVerify.parse(request.body);
        const ip = request.ip;
        const userAgent = request.headers['user-agent'];
        try {
            const result = await verifySalaryPassword(request.user.id, body.password, app, ip, userAgent);
            return {
                code: 0,
                data: result,
                message: 'ok',
            };
        }
        catch (err) {
            if (err instanceof SalaryPasswordError) {
                return reply.status(err.statusCode).send({
                    code: err.code,
                    data: null,
                    message: err.message,
                });
            }
            throw err;
        }
    });
    app.post('/set', {
        schema: {
            description: '设置或修改二级密码',
            tags: ['薪资'],
            body: zodToSchema(zSalaryPasswordSet),
            response: {
                200: createResponseSchema(z.null()),
            },
        },
    }, async (request, reply) => {
        const body = zSalaryPasswordSet.parse(request.body);
        try {
            await setSalaryPassword(request.user.id, body.oldPassword ?? null, body.newPassword);
            return {
                code: 0,
                data: null,
                message: 'ok',
            };
        }
        catch (err) {
            if (err instanceof SalaryPasswordError) {
                return reply.status(err.statusCode).send({
                    code: err.code,
                    data: null,
                    message: err.message,
                });
            }
            throw err;
        }
    });
};
//# sourceMappingURL=salary-password.js.map