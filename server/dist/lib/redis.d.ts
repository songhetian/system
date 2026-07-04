export declare const redis: {
    get(key: string): Promise<string | null>;
    set(key: string, value: string, options?: {
        EX?: number;
    }): Promise<void>;
    del(key: string): Promise<void>;
    exists(key: string): Promise<boolean>;
    hget(key: string, field: string): Promise<string | null>;
    hset(key: string, field: string, value: string): Promise<void>;
    keys(pattern: string): Promise<string[]>;
    flushAll(): Promise<void>;
};
export declare function getCache<T>(key: string): Promise<T | null>;
export declare function setCache<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
export declare function deleteCache(key: string): Promise<void>;
export declare function deleteCachePattern(pattern: string): Promise<void>;
//# sourceMappingURL=redis.d.ts.map