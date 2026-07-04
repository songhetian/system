// 分页参数最大限制
const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
// 计算 skip 值
export function calcOffset(page, pageSize) {
    return (page - 1) * pageSize;
}
// 从 query string 解析分页参数：解析字符串/数字，应用默认值，page<1 回退到 1，pageSize 上限 100
export function parsePagination(query) {
    const rawPage = typeof query.page === 'string' ? parseInt(query.page, 10) : query.page;
    const rawSize = typeof query.pageSize === 'string' ? parseInt(query.pageSize, 10) : query.pageSize;
    // ponytail: NaN/undefined/0/负数 一律走默认值，避免下游 skip 计算出错
    const page = !rawPage || rawPage < 1 ? DEFAULT_PAGE : rawPage;
    const pageSize = !rawSize || rawSize < 1 ? DEFAULT_PAGE_SIZE : Math.min(rawSize, MAX_PAGE_SIZE);
    return { page, pageSize };
}
// 通用分页执行器：泛型 T 支持任意 Prisma model，countFn/queryFn 由调用方注入
export async function paginate(options) {
    const { page, pageSize } = parsePagination({
        page: options.page,
        pageSize: options.pageSize,
    });
    const [list, total] = await Promise.all([
        options.queryFn(calcOffset(page, pageSize), pageSize),
        options.countFn(),
    ]);
    return { list, total, page, pageSize };
}
//# sourceMappingURL=pagination.js.map