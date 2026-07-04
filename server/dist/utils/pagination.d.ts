export declare function calcOffset(page: number, pageSize: number): number;
export declare function parsePagination(query: {
    page?: string | number;
    pageSize?: string | number;
}): {
    page: number;
    pageSize: number;
};
export declare function paginate<T>(options: {
    page?: number;
    pageSize?: number;
    countFn: () => Promise<number>;
    queryFn: (skip: number, take: number) => Promise<T[]>;
}): Promise<{
    list: T[];
    total: number;
    page: number;
    pageSize: number;
}>;
//# sourceMappingURL=pagination.d.ts.map