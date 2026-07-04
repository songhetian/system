import 'dotenv/config';
import fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import multipart from '@fastify/multipart';
import compress from '@fastify/compress';
import fastifyStatic from '@fastify/static';
import swagger from '@fastify/swagger';
import { join } from 'path';
import scalar from '@scalar/fastify-api-reference';
import { registerErrorHandler } from './plugins/error-handler.js';
import { registerWebSocket } from './plugins/websocket.js';
import { registerGlobalAuth } from './middleware/auth.js';
import { registerRateLimit } from './middleware/rate-limit.js';
import { authRoutes } from './routes/auth.js';
import { salaryPasswordRoutes } from './routes/salary-password.js';
import { attendanceRoutes } from './routes/attendance.js';
import { leaveRoutes } from './routes/leave.js';
import { scheduleRoutes } from './routes/schedule.js';
import { orgRoutes } from './routes/org.js';
import { orgReorderRoutes } from './routes/org-reorder.js';
import { employeeRoutes } from './routes/employee.js';
import { roleRoutes } from './routes/role.js';
import { workflowRoutes } from './routes/workflow.js';
import { salaryRoutes } from './routes/salary.js';
import { expenseRoutes } from './routes/expense.js';
import { trainingRoutes } from './routes/training.js';
import { kbRoutes } from './routes/kb.js';
import { excelRoutes } from './routes/excel.js';
import { messageRoutes, announcementRoutes } from './routes/message.js';
import { overtimeRoutes } from './routes/overtime.js';
import { dataPermissionRoutes } from './routes/data-permission.js';
import { employeeArchiveRoutes } from './routes/employee-archive.js';
import { auditRoutes } from './routes/audit.js';
import { dashboardStatsRoutes } from './routes/dashboard-stats.js';
import { userRoutes } from './routes/user.js';
import { permissionRoutes } from './routes/permission.js';
const app = fastify({
    logger: {
        level: process.env.LOG_LEVEL || 'info',
    },
});
app.register(cors, {
    origin: process.env.WEB_ORIGIN?.split(',') || ['http://localhost:5173'],
    credentials: true,
});
app.register(cookie, {
    secret: process.env.COOKIE_SECRET || 'cookie-secret-change-me',
    parseOptions: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
    },
});
app.register(jwt, {
    secret: process.env.JWT_ACCESS_SECRET || 'access-secret-change-me',
});
app.register(multipart, {
    limits: {
        fileSize: 50 * 1024 * 1024,
    },
});
app.register(swagger, {
    openapi: {
        info: {
            title: '人力智能排班薪资一体化中台 API',
            description: 'REST API 文档',
            version: '1.0.0',
        },
        servers: [
            {
                url: 'http://localhost:3000/api',
                description: '开发环境',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
    },
});
app.register(scalar, {
    routePrefix: '/docs',
    configuration: {
        title: 'API 文档',
        theme: 'default',
    },
});
registerErrorHandler(app);
registerWebSocket(app);
// Gzip 压缩
app.register(compress);
// 静态文件服务 — 上传文件目录
app.register(fastifyStatic, {
    root: join(process.cwd(), 'uploads'),
    prefix: '/uploads/',
});
// 全局中间件：限流 → 鉴权（顺序重要，限流在鉴权之前）
registerRateLimit(app);
registerGlobalAuth(app);
app.register(async (instance) => {
    instance.register(authRoutes, { prefix: '/auth' });
    instance.register(salaryPasswordRoutes, { prefix: '/salary-password' });
    instance.register(orgRoutes, { prefix: '/org' });
    instance.register(orgReorderRoutes, { prefix: '/org/departments' });
    instance.register(employeeRoutes, { prefix: '/employees' });
    instance.register(roleRoutes, { prefix: '/roles' });
    instance.register(scheduleRoutes, { prefix: '/schedule' });
    instance.register(attendanceRoutes, { prefix: '/attendance' });
    instance.register(leaveRoutes, { prefix: '/leave' });
    instance.register(workflowRoutes, { prefix: '/workflow' });
    instance.register(salaryRoutes, { prefix: '/salary' });
    instance.register(expenseRoutes, { prefix: '/expense' });
    instance.register(trainingRoutes, { prefix: '/training' });
    instance.register(kbRoutes, { prefix: '/kb' });
    instance.register(excelRoutes, { prefix: '/excel' });
    instance.register(messageRoutes, { prefix: '/messages' });
    instance.register(announcementRoutes, { prefix: '/announcements' });
    instance.register(userRoutes, { prefix: '/users' });
    instance.register(permissionRoutes, { prefix: '/permissions' });
    instance.register(overtimeRoutes, { prefix: '/overtime' });
    instance.register(dataPermissionRoutes, { prefix: '/data-permissions' });
    instance.register(employeeArchiveRoutes, { prefix: '/employee-archive' });
    instance.register(auditRoutes, { prefix: '/audit' });
    instance.register(dashboardStatsRoutes, { prefix: '/dashboard-stats' });
}, { prefix: '/api' });
// 健康检查（不鉴权、不限流，供 Docker compose healthcheck 使用）
app.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
}));
const start = async () => {
    try {
        const port = Number(process.env.SERVER_PORT) || 3000;
        const host = process.env.SERVER_HOST || '0.0.0.0';
        await app.listen({ port, host });
        console.log(`🚀 Server running at http://${host}:${port}`);
        console.log(`📚 API docs at http://${host}:${port}/docs`);
        console.log(`🔌 WebSocket at ws://${host}:${port}/ws`);
    }
    catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};
start();
//# sourceMappingURL=index.js.map