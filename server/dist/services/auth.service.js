import { prisma } from '../lib/prisma.js';
import { verifyPassword } from '../lib/password.js';
const MAX_LOGIN_FAILS = 5;
const LOCK_DURATION_MINUTES = 15;
export class AuthError extends Error {
    code;
    statusCode;
    constructor(message, code, statusCode) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
    }
}
export async function login(username, password) {
    const user = await prisma.user.findUnique({
        where: { username, deletedAt: null },
        include: { employee: true },
    });
    if (!user) {
        throw new AuthError('用户名或密码错误', 20000, 401);
    }
    if (user.lockedUntil && user.lockedUntil > new Date()) {
        throw new AuthError(`账户已锁定，请 ${LOCK_DURATION_MINUTES} 分钟后重试`, 20002, 423);
    }
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
        const newFailCount = user.loginFailCount + 1;
        const lockedUntil = newFailCount >= MAX_LOGIN_FAILS
            ? new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000)
            : null;
        await prisma.user.update({
            where: { id: user.id },
            data: {
                loginFailCount: newFailCount,
                lockedUntil,
            },
        });
        if (lockedUntil) {
            throw new AuthError(`登录失败次数过多，账户已锁定 ${LOCK_DURATION_MINUTES} 分钟`, 20002, 423);
        }
        throw new AuthError('用户名或密码错误', 20000, 401);
    }
    await prisma.user.update({
        where: { id: user.id },
        data: {
            loginFailCount: 0,
            lockedUntil: null,
        },
    });
    return {
        id: user.id,
        username: user.username,
        employeeId: user.employeeId,
    };
}
export async function generateTokens(app, user) {
    const accessToken = await app.jwt.sign({ id: user.id, username: user.username, employeeId: user.employeeId }, { expiresIn: process.env.JWT_ACCESS_TTL || '15m' });
    const refreshToken = await app.jwt.sign({ id: user.id, type: 'refresh' }, { expiresIn: process.env.JWT_REFRESH_TTL || '7d' });
    return { accessToken, refreshToken };
}
//# sourceMappingURL=auth.service.js.map