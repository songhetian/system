import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { zLoginInput, zLoginOutput } from '@shop/shared';
import { createResponseSchema, zodToSchema } from '../utils/zod-to-schema.js';
import { login, generateTokens } from '../services/auth.service.js';
import { prisma } from '../lib/prisma.js';
export const authRoutes = async (app) => {
    app.post('/login', {
        schema: {
            description: '用户登录',
            tags: ['认证'],
            body: zodToSchema(zLoginInput),
            response: {
                200: createResponseSchema(zLoginOutput),
            },
        },
    }, async (request, reply) => {
        const body = zLoginInput.parse(request.body);
        const user = await login(body.username, body.password);
        const { accessToken, refreshToken } = await generateTokens(app, user);
        reply.setCookie('X-Refresh-Token', refreshToken, {
            httpOnly: true,
            sameSite: 'lax',
            path: '/api/auth/refresh',
            maxAge: 7 * 24 * 60 * 60,
        });
        return {
            code: 0,
            data: {
                accessToken,
                user: {
                    id: user.id,
                    username: user.username,
                    employeeId: user.employeeId || 0,
                },
            },
            message: 'ok',
        };
    });
    app.post('/refresh', {
        schema: {
            description: '刷新 access token',
            tags: ['认证'],
            response: {
                200: createResponseSchema(z.object({ accessToken: z.string() })),
            },
        },
    }, async (request, reply) => {
        const refreshToken = request.cookies['X-Refresh-Token'];
        if (!refreshToken) {
            return reply.status(401).send({
                code: 20000,
                data: null,
                message: '未登录或 token 已过期',
            });
        }
        try {
            const decoded = await app.jwt.verify(refreshToken);
            if (decoded.type !== 'refresh') {
                throw new Error('Invalid token type');
            }
            const user = await prisma.user.findUnique({
                where: { id: decoded.id, deletedAt: null },
            });
            if (!user) {
                throw new Error('User not found');
            }
            const accessToken = await app.jwt.sign({ id: user.id, username: user.username, employeeId: user.employeeId }, { expiresIn: process.env.JWT_ACCESS_TTL || '15m' });
            return {
                code: 0,
                data: { accessToken },
                message: 'ok',
            };
        }
        catch {
            reply.clearCookie('X-Refresh-Token', { path: '/api/auth/refresh' });
            return reply.status(401).send({
                code: 20000,
                data: null,
                message: '未登录或 token 已过期',
            });
        }
    });
    app.post('/logout', {
        schema: {
            description: '登出',
            tags: ['认证'],
            response: {
                200: createResponseSchema(z.null()),
            },
        },
    }, async (request, reply) => {
        reply.clearCookie('X-Refresh-Token', { path: '/api/auth/refresh' });
        return {
            code: 0,
            data: null,
            message: 'ok',
        };
    });
    // 修改密码
    app.post('/change-password', {
        schema: {
            body: zodToSchema(z.object({
                oldPassword: z.string().min(1),
                newPassword: z.string().min(6),
            })),
        },
    }, async (request, reply) => {
        const { oldPassword, newPassword } = request.body;
        const user = await prisma.user.findUnique({ where: { id: request.user.id } });
        if (!user)
            return reply.status(404).send({ code: 10000, data: null, message: '用户不存在' });
        const valid = await bcrypt.compare(oldPassword, user.password);
        if (!valid)
            return reply.status(400).send({ code: 10000, data: null, message: '旧密码错误' });
        await prisma.user.update({
            where: { id: request.user.id },
            data: { password: await bcrypt.hash(newPassword, 10) },
        });
        return { code: 0, data: null, message: 'success' };
    });
};
//# sourceMappingURL=auth.js.map