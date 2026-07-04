import { getCache, setCache } from '../lib/redis.js';
const WINDOW_SECONDS = 60;
const DEFAULT_LIMIT = 100;
const LOGIN_LIMIT = 10;
function getClientIp(request) {
    // ponytail: 信任 X-Forwarded-For，生产环境需配合 Fastify trustProxy 使用
    const forwarded = request.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
        return forwarded.split(',')[0].trim();
    }
    return request.ip;
}
function getRateLimit(ip, path) {
    // 登录接口限流更严，防暴力破解
    if (path === '/api/auth/login')
        return LOGIN_LIMIT;
    return DEFAULT_LIMIT;
}
function windowKey(ip) {
    const bucket = Math.floor(Date.now() / (WINDOW_SECONDS * 1000));
    return `rate-limit:${ip}:${bucket}`;
}
export function registerRateLimit(app) {
    app.addHook('onRequest', async (request, reply) => {
        // 白名单：文档和 WebSocket 不限流
        const url = request.url.split('?')[0];
        if (url.startsWith('/docs') || url.startsWith('/ws'))
            return;
        const ip = getClientIp(request);
        const limit = getRateLimit(ip, url);
        const key = windowKey(ip);
        // ponytail: get-then-set 存在竞态，单用户系统可接受；高并发场景需升级为 Redis INCR 原子操作
        const current = (await getCache(key)) ?? 0;
        if (current >= limit) {
            return reply.status(429).send({
                code: 20002,
                data: null,
                message: '请求过于频繁，请稍后再试',
            });
        }
        await setCache(key, current + 1, WINDOW_SECONDS);
    });
}
//# sourceMappingURL=rate-limit.js.map