import { prisma } from '../lib/prisma.js';
import { hashPassword, verifyPassword } from '../lib/password.js';

const MAX_FAILS = 3;
const LOCK_DURATION_MINUTES = 30;
const TOKEN_TTL_SECONDS = 5 * 60;

export class SalaryPasswordError extends Error {
  code: number;
  statusCode: number;

  constructor(message: string, code: number, statusCode: number) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
  }
}

export async function verifySalaryPassword(
  userId: number,
  password: string,
  app: any,
  ip: string,
  userAgent?: string,
): Promise<{ token: string; expiresIn: number }> {
  const record = await prisma.salaryPassword.findUnique({
    where: { userId },
  });

  if (!record) {
    throw new SalaryPasswordError('请先设置二级密码', 21001, 400);
  }

  if (record.lockedUntil && record.lockedUntil > new Date()) {
    throw new SalaryPasswordError(
      `密码错误次数过多，请 ${LOCK_DURATION_MINUTES} 分钟后重试`,
      21002,
      423,
    );
  }

  const valid = await verifyPassword(password, record.passwordHash);
  if (!valid) {
    const newFailCount = record.failCount + 1;
    const lockedUntil =
      newFailCount >= MAX_FAILS
        ? new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000)
        : null;

    await prisma.salaryPassword.update({
      where: { id: record.id },
      data: {
        failCount: newFailCount,
        lockedUntil,
      },
    });

    await prisma.salaryAuditLog.create({
      data: {
        userId,
        action: 'VERIFY_PASSWORD_FAIL',
        ip,
        userAgent,
        detail: JSON.stringify({ failCount: newFailCount, locked: !!lockedUntil }),
      },
    });

    if (lockedUntil) {
      throw new SalaryPasswordError(
        `密码错误次数过多，已锁定 ${LOCK_DURATION_MINUTES} 分钟`,
        21002,
        423,
      );
    }

    throw new SalaryPasswordError('二级密码错误', 21000, 401);
  }

  await prisma.salaryPassword.update({
    where: { id: record.id },
    data: {
      failCount: 0,
      lockedUntil: null,
    },
  });

  const token = await app.jwt.sign(
    { userId, type: 'salary' },
    { expiresIn: TOKEN_TTL_SECONDS + 's' },
  );

  await prisma.salaryAuditLog.create({
    data: {
      userId,
      action: 'VERIFY_PASSWORD_SUCCESS',
      ip,
      userAgent,
    },
  });

  return {
    token,
    expiresIn: TOKEN_TTL_SECONDS,
  };
}

export async function setSalaryPassword(
  userId: number,
  oldPassword: string | null,
  newPassword: string,
): Promise<void> {
  const existing = await prisma.salaryPassword.findUnique({
    where: { userId },
  });

  if (existing) {
    if (!oldPassword) {
      throw new SalaryPasswordError('请输入旧密码', 21003, 400);
    }
    const valid = await verifyPassword(oldPassword, existing.passwordHash);
    if (!valid) {
      throw new SalaryPasswordError('旧密码错误', 21004, 400);
    }
    const newHash = await hashPassword(newPassword);
    await prisma.salaryPassword.update({
      where: { id: existing.id },
      data: {
        passwordHash: newHash,
        failCount: 0,
        lockedUntil: null,
      },
    });
  } else {
    const newHash = await hashPassword(newPassword);
    await prisma.salaryPassword.create({
      data: {
        userId,
        passwordHash: newHash,
      },
    });
  }
}
