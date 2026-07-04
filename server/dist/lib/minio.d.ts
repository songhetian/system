declare class MockMinIO {
    private files;
    putObject(bucketName: string, objectName: string, data: Buffer): Promise<void>;
    getObject(bucketName: string, objectName: string): Promise<Buffer>;
    statObject(bucketName: string, objectName: string): Promise<{
        size: number;
        lastModified: Date;
    }>;
    removeObject(bucketName: string, objectName: string): Promise<void>;
    makeBucket(bucketName: string): Promise<void>;
    bucketExists(bucketName: string): Promise<boolean>;
    presignedUrl(method: string, bucketName: string, objectName: string, expires: number): Promise<string>;
}
export declare const minioClient: MockMinIO;
export declare function uploadFile(bucket: string, filename: string, data: Buffer): Promise<string>;
export declare function downloadFile(bucket: string, filename: string): Promise<Buffer>;
export declare function getFileUrl(bucket: string, filename: string, expiresMinutes?: number): Promise<string>;
export declare function deleteFile(bucket: string, filename: string): Promise<void>;
export {};
//# sourceMappingURL=minio.d.ts.map