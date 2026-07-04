import { describe, it, expect, beforeEach } from 'vitest';
import { redis, getCache, setCache, deleteCache } from '../lib/redis.js';
describe('Redis Mock - 缓存功能', () => {
    beforeEach(async () => {
        await redis.flushAll();
    });
    it('setCache 和 getCache - 存取值正确', async () => {
        await setCache('test:key', { name: 'test', value: 123 });
        const result = await getCache('test:key');
        expect(result).toEqual({ name: 'test', value: 123 });
    });
    it('getCache - 不存在的键返回 null', async () => {
        const result = await getCache('nonexistent');
        expect(result).toBeNull();
    });
    it('deleteCache - 删除键后无法读取', async () => {
        await setCache('test:delete', 'value');
        await deleteCache('test:delete');
        const result = await getCache('test:delete');
        expect(result).toBeNull();
    });
    it('setCache TTL - 过期后返回 null', async () => {
        await setCache('test:ttl', 'value', 1);
        const before = await getCache('test:ttl');
        expect(before).toBe('value');
        await new Promise((resolve) => setTimeout(resolve, 1100));
        const after = await getCache('test:ttl');
        expect(after).toBeNull();
    }, 2000);
    it('hset 和 hget - 哈希操作', async () => {
        await redis.hset('test:hash', 'field1', 'value1');
        await redis.hset('test:hash', 'field2', 'value2');
        const val1 = await redis.hget('test:hash', 'field1');
        const val2 = await redis.hget('test:hash', 'field2');
        expect(val1).toBe('value1');
        expect(val2).toBe('value2');
    });
});
//# sourceMappingURL=redis.test.js.map