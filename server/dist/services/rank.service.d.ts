import type { RankCreate, RankUpdate } from '@shared/schemas/org.js';
export declare function createRank(data: RankCreate): Promise<{
    level: number;
    createdAt: Date;
    id: number;
    name: string;
    updatedAt: Date;
}>;
export declare function getRankById(id: number): Promise<{
    level: number;
    createdAt: Date;
    id: number;
    name: string;
    updatedAt: Date;
} | null>;
export declare function listRanks(): Promise<{
    level: number;
    createdAt: Date;
    id: number;
    name: string;
    updatedAt: Date;
}[]>;
export declare function updateRank(id: number, data: RankUpdate): Promise<{
    level: number;
    createdAt: Date;
    id: number;
    name: string;
    updatedAt: Date;
}>;
export declare function deleteRank(id: number): Promise<void>;
//# sourceMappingURL=rank.service.d.ts.map