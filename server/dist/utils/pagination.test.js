import { describe, it, expect } from 'vitest';
import { calcOffset, parsePagination, paginate } from './pagination.js';
describe('pagination utils', () => {
    describe('calcOffset', () => {
        it('calcOffset(1, 10) 返回 0', () => {
            expect(calcOffset(1, 10)).toBe(0);
        });
        it('calcOffset(3, 20) 返回 40', () => {
            expect(calcOffset(3, 20)).toBe(40);
        });
    });
    describe('parsePagination', () => {
        it('从 query string 解析并应用默认值', () => {
            expect(parsePagination({ page: '2', pageSize: '15' })).toEqual({ page: 2, pageSize: 15 });
        });
        it('缺失时应用默认值 page=1, pageSize=10', () => {
            expect(parsePagination({})).toEqual({ page: 1, pageSize: 10 });
        });
        it('page < 1 回退到 1', () => {
            expect(parsePagination({ page: '0' }).page).toBe(1);
            expect(parsePagination({ page: '-3' }).page).toBe(1);
        });
        it('pageSize > 100 截断到 100', () => {
            expect(parsePagination({ pageSize: '999' }).pageSize).toBe(100);
        });
        it('支持数字入参', () => {
            expect(parsePagination({ page: 3, pageSize: 25 })).toEqual({ page: 3, pageSize: 25 });
        });
    });
    describe('paginate', () => {
        it('返回正确的 { list, total, page, pageSize }', async () => {
            const countFn = async () => 42;
            const queryFn = async (skip, take) => {
                expect(skip).toBe(0); // page 1 -> skip 0
                expect(take).toBe(10);
                return ['a', 'b', 'c'];
            };
            const result = await paginate({ page: 1, pageSize: 10, countFn, queryFn });
            expect(result).toEqual({ list: ['a', 'b', 'c'], total: 42, page: 1, pageSize: 10 });
        });
        it('page 默认 1, pageSize 默认 10', async () => {
            const countFn = async () => 5;
            const queryFn = async (skip, take) => {
                expect(skip).toBe(0); // 默认 page 1
                expect(take).toBe(10);
                return [{ id: 1 }];
            };
            const result = await paginate({ countFn, queryFn });
            expect(result).toEqual({ list: [{ id: 1 }], total: 5, page: 1, pageSize: 10 });
        });
    });
});
//# sourceMappingURL=pagination.test.js.map