import fastify from 'fastify';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import compress from '@fastify/compress';
import type { FastifyInstance } from 'fastify';
import { registerErrorHandler } from '../plugins/error-handler.js';
import { registerGlobalAuth } from '../middleware/auth.js';
import { prisma, setAuditContext } from '../lib/prisma.js';
import { scheduleRoutes } from '../routes/schedule.js';
import { attendanceRoutes } from '../routes/attendance.js';
import { leaveRoutes } from '../routes/leave.js';
import { authRoutes } from '../routes/auth.js';
import { salaryPasswordRoutes } from '../routes/salary-password.js';
import { orgRoutes } from '../routes/org.js';
import { employeeRoutes } from '../routes/employee.js';
import { roleRoutes } from '../routes/role.js';
import { permissionRoutes } from '../routes/permission.js';
import { userRoutes } from '../routes/user.js';
import { workflowRoutes } from '../routes/workflow.js';
import { salaryRoutes } from '../routes/salary.js';
import { expenseRoutes } from '../routes/expense.js';
import { trainingRoutes } from '../routes/training.js';
import { kbRoutes } from '../routes/kb.js';
import { excelRoutes } from '../routes/excel.js';
import { messageRoutes, announcementRoutes } from '../routes/message.js';
import { overtimeRoutes } from '../routes/overtime.js';
import { dataPermissionRoutes } from '../routes/data-permission.js';
import { employeeArchiveRoutes } from '../routes/employee-archive.js';
import { auditRoutes } from '../routes/audit.js';
import { dashboardStatsRoutes } from '../routes/dashboard-stats.js';
import { orgReorderRoutes } from '../routes/org-reorder.js';

export async function buildTestApp(options?: { skipAuth?: boolean; employeeId?: number; permissions?: string[] }): Promise<FastifyInstance> {
  const { skipAuth = true, employeeId = 1, permissions = ['admin:all'] } = options || {};
  const app = fastify();

  app.register(cookie, {
    secret: 'test-cookie-secret',
  });

  app.register(jwt, {
    secret: 'test-jwt-secret',
  });
  app.register(compress);

  registerErrorHandler(app);

  // 测试环境跳过认证，直接注入 mock 用户
  if (skipAuth) {
    app.addHook('onRequest', async (request) => {
      // ponytail: 测试环境跳过认证，直接注入 mock 用户，默认 admin:all 全权限 + ALL 数据范围
      (request as any).user = { id: 1, username: 'testuser', employeeId };
      (request as any).employeeId = employeeId;
      (request as any).permissions = new Set(permissions);
      (request as any).dataScopes = {}; // admin:all 时 buildRowAccessFilter 会返回空过滤
      (request as any)._authSkipped = true;
      setAuditContext(1, 'testuser', '127.0.0.1');
    });
  }

  // 全局鉴权中间件（skipAuth 时通过 _authSkipped 跳过）
  registerGlobalAuth(app);

  app.register(
    async (instance) => {
      instance.register(authRoutes, { prefix: '/auth' });
      instance.register(scheduleRoutes, { prefix: '/schedule' });
      instance.register(attendanceRoutes, { prefix: '/attendance' });
      instance.register(leaveRoutes, { prefix: '/leave' });
      instance.register(salaryPasswordRoutes, { prefix: '/salary-password' });
      instance.register(orgRoutes, { prefix: '/org' });
      instance.register(orgReorderRoutes, { prefix: '/org/departments' });
      instance.register(employeeRoutes, { prefix: '/employees' });
      instance.register(roleRoutes, { prefix: '/roles' });
      instance.register(permissionRoutes, { prefix: '/permissions' });
      instance.register(userRoutes, { prefix: '/users' });
      instance.register(workflowRoutes, { prefix: '/workflow' });
      instance.register(salaryRoutes, { prefix: '/salary' });
      instance.register(expenseRoutes, { prefix: '/expense' });
      instance.register(trainingRoutes, { prefix: '/training' });
      instance.register(kbRoutes, { prefix: '/kb' });
      instance.register(excelRoutes, { prefix: '/excel' });
      instance.register(messageRoutes, { prefix: '/messages' });
      instance.register(announcementRoutes, { prefix: '/announcements' });
      instance.register(overtimeRoutes, { prefix: '/overtime' });
      instance.register(dataPermissionRoutes, { prefix: '/data-permissions' });
      instance.register(employeeArchiveRoutes, { prefix: '/employee-archive' });
      instance.register(auditRoutes, { prefix: '/audit' });
      instance.register(dashboardStatsRoutes, { prefix: '/dashboard-stats' });
    },
    { prefix: '/api' },
  );

  // ponytail: schema 新增 KbDocument/Announcement 等外键后，测试默认引用 userId=1，预先 upsert 测试 User 避免外键约束失败
  await prisma.user.upsert({
    where: { id: 1 },
    create: { id: 1, username: 'testuser', passwordHash: 'test' },
    update: {},
  });

  // 健康检查端点（不鉴权）
  app.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  }));

  await app.ready();
  return app;
}
